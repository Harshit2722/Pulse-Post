const express = require('express');
const router = express.Router();
const { createPost, getAllPosts, deletePost, toggleLike, addComment, postById, deleteComment, updatePost } = require('../controllers/postController');
const verifyJWT = require('../middleware/authMiddleware');
const upload = require('../middleware/multerMiddleware');

router.get('/', getAllPosts);
router.post('/create', verifyJWT, upload.single("image"), createPost);
router.get("/:id", verifyJWT, postById);
router.delete("/:id", verifyJWT, deletePost);
router.post("/:id/like", verifyJWT, toggleLike);
router.post("/:id/comment", verifyJWT, addComment);
router.patch("/:id", verifyJWT, updatePost);
router.delete("/:id/comment/:commentId", verifyJWT, deleteComment);

module.exports = router;
