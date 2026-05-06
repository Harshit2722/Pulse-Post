const Post = require('../models/postModel');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const createPost = asyncHandler(async (req, res) => {
    const { content } = req.body;

    let post = await Post.create({
        content,
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



module.exports = { createPost, getAllPosts };
