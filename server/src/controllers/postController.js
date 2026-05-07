const Post = require('../models/postModel');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require("../utils/ApiError")

const createPost = asyncHandler(async (req, res) => {
    const { content, title, image, category } = req.body;

    let post = await Post.create({
        content,
        title,
        image,
        category,
        author: req.user._id
    })

    post = await post.populate("author", "username");



    // 🔥 REAL-TIME: Notify all connected clients
    const io = req.app.get("io");
    io.emit("new-post", {
        message: `${req.user.username} posted a new pulse!`,
        post
    });
    console.log("🚀 Socket emit: new-post")

    return res.status(201).json(
        new ApiResponse(201, post, "Pulse posted! 🚀")
    );
});

const getAllPosts = asyncHandler(async (req, res) => {
    const posts = await Post.find()
        .populate("author", "username")
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

    return res.status(200).json(
        new ApiResponse(200, posts, "Pulse feed loaded")
    );
});

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

    // 🔥 REAL-TIME: Notify everyone about the updated like count
    const io = req.app.get("io");
    io.emit("update-likes", {
        postId: id,
        likes: post.likes,
        likerName: req.user.username,
        isLikedNow: !isLiked
    });

    return res.status(200).json(
        new ApiResponse(200, post, isLiked ? "Unliked" : "Liked")
    );
});


module.exports = { createPost, getAllPosts, deletePost, toggleLike };

