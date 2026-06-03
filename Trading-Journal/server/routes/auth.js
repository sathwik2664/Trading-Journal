const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  logout,
  checkEmail,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/check-email', checkEmail);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;