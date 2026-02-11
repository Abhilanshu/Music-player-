const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
// const passport = require('passport'); // Temporarily disabled


// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', authController.register);

// @route   POST api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authController.login);

// @route   GET api/auth/user
// @desc    Get user data
// @access  Private
router.get('/user', auth, authController.getUser);

// @route   PUT api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, authController.updateProfile);

// OAuth Routes - TEMPORARILY DISABLED (passport config issues)
// router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
// router.get('/google/callback', passport.authenticate('google', { session: false }), authController.googleCallback);

// router.get('/microsoft', passport.authenticate('microsoft', { scope: ['user.read'] }));
// router.get('/microsoft/callback', passport.authenticate('microsoft', { session: false }), authController.microsoftCallback);

// Mobile OTP Routes
router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);

module.exports = router;
