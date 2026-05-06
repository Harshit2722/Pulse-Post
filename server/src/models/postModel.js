const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, "What's on your mind? Content is required"],
        trim: true,
        maxlength: [500, "Keep it short! Max 500 characters"]
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ]
}, { timestamps: true });

postSchema.index({createdAt:-1})

module.exports = mongoose.model('Post', postSchema);
