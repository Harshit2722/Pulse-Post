const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const User = require("../models/userModel");

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

module.exports = { registerUser, loginUser, getCurrentUser, updateAccount };

