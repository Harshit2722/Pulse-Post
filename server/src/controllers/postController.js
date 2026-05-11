const Post = require('../models/postModel');
const Notification = require('../models/notificationModel');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require("../utils/ApiError")
const { uploadToCloudinary } = require('../utils/cloudinary');

const createPost = asyncHandler(async (req, res) => {
    const { content, title, category } = req.body;

    if (!content || !title)
        throw new ApiError(400, "Please provide content, title and category");

    const localFilePath = req.file?.path;

    let imageUrl = "";
    
    if(req.file){
        const image = await uploadToCloudinary(localFilePath);
        
        if(image){
            imageUrl = image.url;
        }
        else{
            throw new ApiError(500, "Failed to upload image");
        }
    }

    let post = await Post.create({
        content,
        title,
        category,
        author: req.user._id,
        image: imageUrl
    })

    post = await post.populate("author", "name avatar tagline");

    // 🔥 REAL-TIME: Notify all connected clients
    const io = req.app.get("io");
    io.emit("new-post", {
        message: `${req.user.name} shared a new pulse!`,
        post
    });
    console.log("🚀 Socket emit: new-post")

    return res.status(201).json(
        new ApiResponse(201, post, "Pulse posted! 🚀")
    );
});

const getAllPosts = asyncHandler(async (req, res) => {
    const { cursor, limit = 8, category } = req.query;
    const fetchLimit = Number(limit);

    let query = { author: { $ne: req.user._id } };
    
    if (category && category !== 'All') {
        query.category = category;
    }

    if (cursor) {
        // If cursor exists, we need to AND it with the author filter
        query = {
            ...query,
            _id: { $lt: cursor }
        };
    }

    const posts = await Post.find(query)
        .populate("author", "name avatar tagline")
        .sort({ _id: -1 })
        .limit(fetchLimit + 1) // FETCH ONE EXTRA TO CHECK AHEAD
        .lean();

    let nextCursor = null;
    if (posts.length > fetchLimit) {
        nextCursor = posts[fetchLimit - 1]._id;
        posts.pop(); // Remove the extra item
    }

    return res.status(200).json(
        new ApiResponse(200, { posts, nextCursor }, "Pulse feed loaded")
    );
});

const postById = asyncHandler(async (req,res)=>{
    const {id} = req.params;

    const post = await Post.findById(id).populate("author","name avatar tagline").populate("comments.author","name avatar");

    if(!post){
        throw new ApiError(404,"Post not found");
    }

    return res.status(200).json(new ApiResponse(200,post,"Post fetched"))
})

const deletePost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    // Security check: Only the author can delete
    if (post.author.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only delete your own pulses");
    }

    await post.deleteOne();

    // 🔥 REAL-TIME: Notify everyone to remove this post from their screen
    const io = req.app.get("io");
    io.emit("post-deleted", id);

    return res.status(200).json(
        new ApiResponse(200, {}, "Pulse deleted forever")
    );
});


const toggleLike = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    const isLiked = post.likes.includes(req.user._id);

    if (isLiked) {
        // UNLIKE: Remove user ID
        post.likes = post.likes.filter(uid => uid.toString() !== req.user._id.toString());
    } else {
        // LIKE: Add user ID
        post.likes.push(req.user._id);
    }

    await post.save();

    // 🔥 PERSISTENT NOTIFICATION & REAL-TIME
    const io = req.app.get("io");
    
    if (!isLiked && post.author.toString() !== req.user._id.toString()) {
        const notification = await Notification.create({
            recipient: post.author,
            sender: req.user._id,
            type: 'like',
            post: id,
            message: `${req.user.name} loved your pulse: "${post.title.substring(0, 20)}..."`
        });

        const populatedNotif = await notification.populate('sender', 'name avatar');
        io.emit(`notification-${post.author}`, populatedNotif);
    }

    io.emit("update-likes", {
        postId: id,
        likes: post.likes,
        likerName: req.user.name,
        isLikedNow: !isLiked
    });

    return res.status(200).json(
        new ApiResponse(200, post, isLiked ? "Unliked" : "Liked")
    );
});


const addComment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) throw new ApiError(400, "Comment content is required");

    const post = await Post.findById(id);
    if (!post) throw new ApiError(404, "Post not found");

    post.comments.push({
        author: req.user._id,
        content
    });

    await post.save();
    
    const updatedPost = await Post.findById(id).populate("comments.author", "name avatar");

    // 🔥 PERSISTENT NOTIFICATION & REAL-TIME
    const io = req.app.get("io");

    if (post.author.toString() !== req.user._id.toString()) {
        const notification = await Notification.create({
            recipient: post.author,
            sender: req.user._id,
            type: 'comment',
            post: id,
            message: `${req.user.name} shared a reflection on your pulse!`
        });

        const populatedNotif = await notification.populate('sender', 'name avatar');
        io.emit(`notification-${post.author}`, populatedNotif);
    }

    io.emit("new-comment", {
        postId: id,
        comments: updatedPost.comments,
        commenterName: req.user.name,
        postAuthorId: post.author
    });

    return res.status(200).json(
        new ApiResponse(200, updatedPost.comments, "Comment added")
    );
});

const deleteComment = asyncHandler(async (req, res) => {
    const { id, commentId } = req.params;
    const post = await Post.findById(id);

    if (!post) throw new ApiError(404, "Post not found");

    const comment = post.comments.id(commentId);
    if (!comment) throw new ApiError(404, "Comment not found");

    if (comment.author.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only delete your own reflections");
    }

    comment.deleteOne();
    await post.save();

    const updatedPost = await Post.findById(id).populate("comments.author", "name avatar");

    const io = req.app.get("io");
    io.emit("comment-deleted", { postId: id, comments: updatedPost.comments });

    return res.status(200).json(
        new ApiResponse(200, updatedPost.comments, "Reflection removed")
    );
});

const updatePost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, content, category } = req.body;

    let post = await Post.findById(id);

    if (!post) throw new ApiError(404, "Pulse not found");

    if (post.author.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only the creator can edit this pulse");
    }

    post.title = title || post.title;
    post.content = content || post.content;
    post.category = category || post.category;

    await post.save();

    post = await post.populate("author", "name avatar tagline");

    const io = req.app.get("io");
    io.emit("post-updated", post);

    return res.status(200).json(
        new ApiResponse(200, post, "Pulse updated successfully! ✨")
    );
});

const getMyPosts = asyncHandler(async (req, res) => {
    const { cursor, limit = 8 } = req.query;
    const fetchLimit = Number(limit);

    let query = { author: req.user._id };
    if (cursor) {
        query._id = { $lt: cursor };
    }

    const posts = await Post.find(query)
        .populate("author", "name avatar tagline")
        .sort({ _id: -1 })
        .limit(fetchLimit + 1)
        .lean();

    let nextCursor = null;
    if (posts.length > fetchLimit) {
        nextCursor = posts[fetchLimit - 1]._id;
        posts.pop();
    }

    return res.status(200).json(
        new ApiResponse(200, { posts, nextCursor }, "Your pulses loaded")
    );
});

module.exports = { createPost, getAllPosts, deletePost, toggleLike, addComment, postById, deleteComment, updatePost, getMyPosts };

