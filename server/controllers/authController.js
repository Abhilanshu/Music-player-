const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        user = new User({ name, email, password });
        await user.save();

        const payload = { id: user.id };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const payload = { id: user.id };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const { name, businessName, phone, address, gstin, logo } = req.body;
        const user = await User.findById(req.user.id);

        if (user) {
            user.name = name || user.name;
            user.businessName = businessName || user.businessName;
            user.phone = phone || user.phone;
            user.address = address || user.address;
            user.gstin = gstin || user.gstin;
            user.logo = logo || user.logo;

            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                businessName: updatedUser.businessName,
                phone: updatedUser.phone,
                address: updatedUser.address,
                gstin: updatedUser.gstin,
                logo: updatedUser.logo
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Google OAuth Callback
// @route   GET /api/auth/google/callback
exports.googleCallback = (req, res) => {
    const payload = { id: req.user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.redirect(`http://localhost:5173/dashboard?token=${token}`);
};

// @desc    Microsoft OAuth Callback
// @route   GET /api/auth/microsoft/callback
exports.microsoftCallback = (req, res) => {
    const payload = { id: req.user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.redirect(`http://localhost:5173/dashboard?token=${token}`);
};

// @desc    Send OTP (Mock)
// @route   POST /api/auth/send-otp
// @access  Public
exports.sendOtp = async (req, res) => {
    try {
        const { phone } = req.body;
        // Generate random 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // In a real app, send OTP via SMS provider here
        console.log(`OTP for ${phone}: ${otp}`);

        // Save OTP to DB
        let user = await User.findOne({ phone });

        if (!user) {
            user = new User({
                name: 'Mobile User',
                email: `${phone}@mobile.temp`,
                password: 'otp-login',
                phone
            });
        }

        user.otp = otp;
        user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins
        await user.save();

        res.json({ message: 'OTP sent (check console)' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res) => {
    try {
        const { phone, otp } = req.body;
        const user = await User.findOne({ phone });

        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        if (user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Clear OTP
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        const payload = { id: user.id };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
