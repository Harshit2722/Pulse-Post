const express = require('express');
const router = express.Router();
const { registerUser, loginUser, googleLogin, getCurrentUser, updateAccount } = require('../controllers/userController');
const verifyJWT = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google-login', googleLogin);

router.get('/me', verifyJWT, getCurrentUser);
router.patch('/update-account', verifyJWT, updateAccount);

module.exports = router;



