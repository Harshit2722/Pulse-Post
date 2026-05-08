const express = require('express');
const router = express.Router();
const { registerUser, loginUser, googleLogin, getCurrentUser, updateAccount, updateAvatar } = require('../controllers/userController');
const verifyJWT = require('../middleware/authMiddleware');
const upload = require('../middleware/multerMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google-login', googleLogin);

router.get('/me', verifyJWT, getCurrentUser);
router.patch('/update-account', verifyJWT, updateAccount);

router.patch("/update-avatar",verifyJWT,upload.single("avatar"),updateAvatar)

module.exports = router;



