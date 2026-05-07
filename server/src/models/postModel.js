const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, "What's on your mind? Content is required"],
        trim: true,
        maxlength: [500, "Keep it short! Max 500 characters"]
    },
    title: {
        type: String,
        required: true
    },
    image: {
        type: String,
    },
    category: {
        type: String,
        default: 'General'
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
