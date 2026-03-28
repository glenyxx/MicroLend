const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes — no token needed
router.post('/register', register);
router.post('/login', login);

// Protected route — must send a valid JWT in the Authorization header
router.get('/profile', protect, getProfile);

module.exports = router;