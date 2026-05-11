const express = require('express');
const router = express.Router();
const { 
    registerUser, verifyOtp, resendOtp, loginUser, googleLogin, getCurrentUser, 
    updateAccount, updateAvatar, removeAvatar, toggleSavePost, getSavedPosts,
    forgotPasswordRequest, verifyForgotPasswordOtp, resetPassword
} = require('../controllers/userController');
const verifyJWT = require('../middleware/authMiddleware');
const upload = require('../middleware/multerMiddleware');

router.post('/register', registerUser);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/login', loginUser);
router.post('/google-login', googleLogin);
router.post('/forgot-password', forgotPasswordRequest);
router.post('/verify-forgot-password-otp', verifyForgotPasswordOtp);
router.post('/reset-password', resetPassword);

router.get('/me', verifyJWT, getCurrentUser);
router.patch('/update-account', verifyJWT, updateAccount);
router.patch("/update-avatar",verifyJWT,upload.single("avatar"),updateAvatar);
router.delete("/remove-avatar", verifyJWT, removeAvatar);

router.post('/save/:postId', verifyJWT, toggleSavePost);
router.get('/saved', verifyJWT, getSavedPosts);

module.exports = router;



