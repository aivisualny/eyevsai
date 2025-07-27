const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const passport = require('passport');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  username: Joi.string().min(3).max(20).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        error: 'User with this email or username already exists' 
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        points: user.points,
        totalVotes: user.totalVotes,
        correctVotes: user.correctVotes
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        points: user.points,
        totalVotes: user.totalVotes,
        correctVotes: user.correctVotes
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Social Login Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', (req, res, next) => {
  if (req.query.error === 'access_denied') {
    return res.redirect('/login?error=user_cancelled');
  }
  next();
},
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    try {
      const token = generateToken(req.user._id);
      const userInfo = {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        points: req.user.points,
        totalVotes: req.user.totalVotes,
        correctVotes: req.user.correctVotes,
        avatar: req.user.avatar,
        socialProvider: req.user.socialProvider
      };
      const userData = encodeURIComponent(JSON.stringify(userInfo));
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth-callback?token=${token}&user=${userData}`);
    } catch (error) {
      console.error('Google callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/login?error=소셜 로그인에 실패했습니다.`);
    }
  }
);

router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get('/facebook/callback', (req, res, next) => {
  if (req.query.error === 'access_denied') {
    return res.redirect('/login?error=user_cancelled');
  }
  next();
},
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  (req, res) => {
    try {
      const token = generateToken(req.user._id);
      const userInfo = {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        points: req.user.points,
        totalVotes: req.user.totalVotes,
        correctVotes: req.user.correctVotes,
        avatar: req.user.avatar,
        socialProvider: req.user.socialProvider
      };
      const userData = encodeURIComponent(JSON.stringify(userInfo));
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth-callback?token=${token}&user=${userData}`);
    } catch (error) {
      console.error('Facebook callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/login?error=소셜 로그인에 실패했습니다.`);
    }
  }
);

router.get('/kakao', passport.authenticate('kakao'));

router.get('/kakao/callback', (req, res, next) => {
  if (req.query.error === 'access_denied') {
    return res.redirect('/login?error=user_cancelled');
  }
  next();
},
  passport.authenticate('kakao', { failureRedirect: '/login' }),
  (req, res) => {
    try {
      const token = generateToken(req.user._id);
      const userInfo = {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        points: req.user.points,
        totalVotes: req.user.totalVotes,
        correctVotes: req.user.correctVotes,
        avatar: req.user.avatar,
        socialProvider: req.user.socialProvider
      };
      const userData = encodeURIComponent(JSON.stringify(userInfo));
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth-callback?token=${token}&user=${userData}`);
    } catch (error) {
      console.error('Kakao callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/login?error=소셜 로그인에 실패했습니다.`);
    }
  }
);

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        points: user.points,
        totalVotes: user.totalVotes,
        correctVotes: user.correctVotes,
        accuracy: user.getAccuracy()
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { username, avatar } = req.body;
    
    const updateData = {};
    if (username) updateData.username = username;
    if (avatar) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        points: user.points,
        totalVotes: user.totalVotes,
        correctVotes: user.correctVotes,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// 회원탈퇴
router.delete('/delete', auth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: '회원탈퇴가 완료되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: '회원탈퇴에 실패했습니다.' });
  }
});

module.exports = router; 