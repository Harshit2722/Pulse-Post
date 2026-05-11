const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const User = require("../models/userModel");
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const {uploadToCloudinary} = require("../utils/cloudinary");


const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if(!name || !email || !password){
        throw new ApiError(400, "All fields are required");
    }

    const existingUserEmail = await User.findOne({ email });
    if(existingUserEmail){
        throw new ApiError(400, "Email already exists");
    }

    const user = await User.create({ name, email, password });
    const createdUser = await User.findById(user._id).select("-password");

    return res.status(201).json(new ApiResponse(201, createdUser, "User created!"));
});

const googleLogin = asyncHandler(async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        throw new ApiError(400, "Google Token is required");
    }

    try {
        const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${idToken}`);
        const payload = await response.json();

        if (!payload || !payload.email) {
            throw new ApiError(401, "Invalid Google Token");
        }

        const { email, name, picture, sub: googleId } = payload;

        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                name: name,
                email: email,
                password: Math.random().toString(36).slice(-10), 
                googleId: googleId,
                avatar: picture
            });
        }

        const token = user.generateAccessToken();
        const loggedInUser = await User.findById(user._id).select("-password");

        return res.status(200).json(
            new ApiResponse(200, { user: loggedInUser, token }, "Google Login successful")
        );
    } catch (error) {
        console.error("Google Auth Error:", error);
        throw new ApiError(401, "Google Authentication failed");
    }
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(401, "Invalid credentials");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    const token = user.generateAccessToken();
    const loggedInUser = await User.findById(user._id).select("-password");

    return res.status(200).json(
        new ApiResponse(200, { user: loggedInUser, token }, "User logged in successfully")
    );
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, req.user, "User fetched successfully")
    );
});

const updateAccount = asyncHandler(async (req, res) => {
    const { name, password } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (password) user.password = password;

    await user.save();
    const updatedUser = await User.findById(user._id).select("-password");

    return res.status(200).json(
        new ApiResponse(200, updatedUser, "Account updated successfully")
    );
});


const updateAvatar = asyncHandler(async (req,res)=>{

    if(!req.file){
        throw new ApiError(400, "No file uploaded");
    }

    const localFilePath = req.file?.path;

    if(!localFilePath){
        throw new ApiError(400, "Avatar file is missing");
    }


    const avatar = await uploadToCloudinary(localFilePath);

    if(!avatar){
        throw new ApiError(500, "Failed to upload avatar");
    }


    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password");

    return res.status(200).json(
        new ApiResponse(200, user, "Avatar updated successfully")
    );
    
})

const toggleSavePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const user = await User.findById(req.user._id);

    const isSaved = user.savedPosts.includes(postId);

    if (isSaved) {
        user.savedPosts = user.savedPosts.filter(id => id.toString() !== postId);
    } else {
        user.savedPosts.push(postId);
    }

    await user.save();

    return res.status(200).json(
        new ApiResponse(200, user.savedPosts, isSaved ? "Removed from library" : "Saved to library")
    );
});

const getSavedPosts = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate({
        path: 'savedPosts',
        populate: { path: 'author', select: 'name avatar' }
    });

    return res.status(200).json(
        new ApiResponse(200, user.savedPosts, "Saved pulses fetched")
    );
});

module.exports = { registerUser, loginUser, googleLogin, getCurrentUser, updateAccount, updateAvatar, toggleSavePost, getSavedPosts };
