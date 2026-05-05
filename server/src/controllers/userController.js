const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const User = require("../models/userModel");

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if(!username || !email || !password){
        throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({ username });
    if(existingUser){
        throw new ApiError(400, "Username already exists");
    }
    const existingUserEmail = await User.findOne({ email });
    if(existingUserEmail){
        throw new ApiError(400, "Email already exists");
    }

    const user = await User.create({ username, email, password });

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
        throw new ApiError(404, "User does not exist");
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


module.exports = { registerUser, loginUser };

