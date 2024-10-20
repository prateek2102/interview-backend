const express = require('express');
const router = express.Router();
const { register, login, verifyEmail, verifyOTP } = require('../controllers/authController');

router.post('/signup', register);
router.post('/login', login);
router.post('/verify-otp', verifyOTP); // Add OTP verification route

module.exports = router;