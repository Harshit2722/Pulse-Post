const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    avatar: { type: String }, 
    googleId: { type: String },
    savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    otp: { type: String },
    otpExpires: { type: Date },
    isVerified: { type: Boolean, default: false },
    tagline: { type: String, trim: true, default: "Creator" }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function() {
    const user = this;
    if (user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 10);
    }
});

// Method to check password
userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password);
};

// Generate Access Token
userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            name: this.name
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" } 
    );
};


module.exports = mongoose.model('User', userSchema);
