const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const User = require("../models/userModel");
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const {uploadToCloudinary} = require("../utils/cloudinary");
const { sendOTP } = require("../utils/emailService");
const Post = require("../models/postModel");

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if(!name || !email || !password){
        throw new ApiError(400, "All fields are required");
    }

    const existingUserEmail = await User.findOne({ email });
    if(existingUserEmail){
        if (existingUserEmail.isVerified) {
            throw new ApiError(400, "Email already exists and is verified");
        } else {
            // Unverified user trying to register again
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            existingUserEmail.otp = otp;
            existingUserEmail.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
            existingUserEmail.name = name;
            existingUserEmail.password = password; // pre-save hook will hash it again
            await existingUserEmail.save();
            await sendOTP(email, otp);
            return res.status(200).json(new ApiResponse(200, { email }, "OTP sent to your email"));
        }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    const user = await User.create({ name, email, password, otp, otpExpires, isVerified: false });
    await sendOTP(email, otp);

    return res.status(201).json(new ApiResponse(201, { email }, "Registration initiated. OTP sent!"));
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

const verifyOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        throw new ApiError(400, "Email and OTP are required");
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.isVerified) {
        throw new ApiError(400, "User is already verified");
    }

    if (user.otp !== otp) {
        throw new ApiError(400, "Invalid OTP");
    }

    if (new Date() > new Date(user.otpExpires)) {
        throw new ApiError(400, "OTP has expired");
    }

    // Mark as verified and clear OTP
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = user.generateAccessToken();
    const loggedInUser = await User.findById(user._id).select("-password");

    return res.status(200).json(
        new ApiResponse(200, { user: loggedInUser, token }, "Email verified successfully")
    );
});

const resendOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.isVerified) {
        throw new ApiError(400, "User is already verified");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();

    await sendOTP(email, otp);

    return res.status(200).json(
        new ApiResponse(200, { email }, "New OTP sent to your email")
    );
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

    if (!user.isVerified) {
        throw new ApiError(403, "Please verify your email before logging in");
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
});

const removeAvatar = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { avatar: "" }
        },
        { new: true }
    ).select("-password");

    return res.status(200).json(
        new ApiResponse(200, user, "Avatar removed successfully")
    );
});

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
    const { cursor, limit = 8 } = req.query;
    const fetchLimit = Number(limit);
    const user = await User.findById(req.user._id);

    // Get the array of IDs and reverse it to show newest saves first
    let savedIds = [...user.savedPosts].reverse();
    
    if (cursor) {
        const cursorIndex = savedIds.findIndex(id => id.toString() === cursor);
        if (cursorIndex !== -1) {
            savedIds = savedIds.slice(cursorIndex + 1);
        }
    }

    const paginatedIds = savedIds.slice(0, fetchLimit + 1); // Slice one extra

    // Fetch the actual posts
    const posts = await Post.find({ _id: { $in: paginatedIds } })
        .populate("author", "name avatar")
        .lean();

    // Preserve the sorted order based on when they were saved
    const orderedPosts = paginatedIds.map(id => posts.find(p => p._id.toString() === id.toString())).filter(Boolean);

    let nextCursor = null;
    if (orderedPosts.length > fetchLimit) {
        nextCursor = orderedPosts[fetchLimit - 1]._id;
        orderedPosts.pop(); // Remove the extra item
    }

    return res.status(200).json(
        new ApiResponse(200, { posts: orderedPosts, nextCursor }, "Saved pulses fetched")
    );
});

module.exports = { registerUser, verifyOtp, resendOtp, loginUser, googleLogin, getCurrentUser, updateAccount, updateAvatar, removeAvatar, toggleSavePost, getSavedPosts };
