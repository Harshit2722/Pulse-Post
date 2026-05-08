const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getCurrentUser, updateAccount } = require('../controllers/userController');
const verifyJWT = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);

router.get('/me', verifyJWT, getCurrentUser);
router.patch('/update-account', verifyJWT, updateAccount);

module.exports = router;



