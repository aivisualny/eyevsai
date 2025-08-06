const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const passport = require('passport');
const qs = require('querystring');
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
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '2h' }); // 2시간으로 단축
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
router.get('/google', (req, res) => {
  // 환경 변수에서 백엔드 URL 가져오기
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  
  const redirectUrl = "https://accounts.google.com/o/oauth2/v2/auth?" +
    qs.stringify({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: `${backendUrl}/api/auth/google/callback`,
      response_type: "code",
      scope: "openid email profile",
      prompt: "consent",
    });

  res.redirect(redirectUrl);
});

router.get('/google/callback', async (req, res) => {
  try {
    console.log('=== GOOGLE CALLBACK DEBUG ===');
    console.log('Query params:', req.query);
    console.log('BACKEND_URL:', process.env.BACKEND_URL);
    console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
    console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET');
    console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET');
    console.log('=== END DEBUG ===');
    
    if (req.query.error === 'access_denied') {
      const frontendUrl = process.env.FRONTEND_URL || 'https://eyevsai-frontend-kr9d.vercel.app';
      return res.redirect(`${frontendUrl}/login?error=user_cancelled`);
    }

    const { code } = req.query;
    if (!code) {
      const frontendUrl = process.env.FRONTEND_URL || 'https://eyevsai-frontend-kr9d.vercel.app';
      return res.redirect(`${frontendUrl}/login?error=인증 코드를 받지 못했습니다.`);
    }

    // Google OAuth 토큰 교환
    const backendUrl = process.env.BACKEND_URL || 'https://eyevsai.onrender.com';
    console.log('Token exchange URL:', `${backendUrl}/api/auth/google/callback`);
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: qs.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${backendUrl}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    console.log('Token response status:', tokenResponse.status);
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.log('Token exchange error:', errorText);
      throw new Error(`Google OAuth 토큰 교환 실패: ${tokenResponse.status} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    
    // Google 사용자 정보 가져오기
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Google 사용자 정보 가져오기 실패');
    }

    const profile = await userResponse.json();

    // 사용자 처리
    if (!profile.email) {
      const frontendUrl = process.env.FRONTEND_URL || 'https://eyevsai-frontend-kr9d.vercel.app';
      return res.redirect(`${frontendUrl}/login?error=이메일 정보를 가져올 수 없습니다.`);
    }

    let user = await User.findOne({ email: profile.email });
    let username = profile.name || `user_${Date.now()}`;
    const email = profile.email;
    const avatar = profile.picture || null;

    // 사용자명 중복 처리
    if (!user) {
      // 사용자명이 중복되는 경우 숫자 추가
      let counter = 1;
      let originalUsername = username;
      let finalUsername = username;
      
      // 중복되지 않는 사용자명을 찾을 때까지 반복
      while (true) {
        const existingUser = await User.findOne({ username: finalUsername });
        if (!existingUser) {
          break;
        }
        finalUsername = `${originalUsername}${counter}`;
        counter++;
      }

      user = new User({
        username: finalUsername,
        email,
        password: 'social_login_' + Math.random().toString(36).substr(2, 9),
        avatar,
        socialProvider: 'google',
        socialId: profile.id
      });
      await user.save();
    } else {
      // 기존 사용자의 경우 사용자명은 변경하지 않음 (중복 방지)
      user.socialProvider = 'google';
      user.socialId = profile.id;
      if (avatar) user.avatar = avatar;
      await user.save();
    }

    // JWT 토큰 생성
    const token = generateToken(user._id);
    const userInfo = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      points: user.points,
      totalVotes: user.totalVotes,
      correctVotes: user.correctVotes,
      avatar: user.avatar,
      socialProvider: user.socialProvider
    };
    
    const userData = encodeURIComponent(JSON.stringify(userInfo));
    const frontendUrl = process.env.FRONTEND_URL || 'https://eyevsai-frontend-kr9d.vercel.app';
    res.redirect(`${frontendUrl}/auth-callback?token=${token}&user=${userData}`);
  } catch (error) {
    console.error('Google callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'https://eyevsai-frontend-kr9d.vercel.app';
    res.redirect(`${frontendUrl}/login?error=소셜 로그인에 실패했습니다.`);
  }
});

router.get('/facebook', (req, res) => {
  const redirectUrl = "https://www.facebook.com/v18.0/dialog/oauth?" +
    qs.stringify({
      client_id: process.env.FACEBOOK_APP_ID,
      redirect_uri: 'http://localhost:5000/api/auth/facebook/callback',
      response_type: "code",
      scope: "email",
      state: Math.random().toString(36).substr(2, 9),
    });

  res.redirect(redirectUrl);
});

router.get('/facebook/callback', async (req, res) => {
  try {
    if (req.query.error === 'access_denied') {
      const frontendUrl = process.env.FRONTEND_URL || 'https://eyevsai-frontend-kr9d.vercel.app';
      return res.redirect(`${frontendUrl}/login?error=user_cancelled`);
    }

    const { code } = req.query;
    if (!code) {
      const frontendUrl = process.env.FRONTEND_URL || 'https://eyevsai-frontend-kr9d.vercel.app';
      return res.redirect(`${frontendUrl}/login?error=인증 코드를 받지 못했습니다.`);
    }

    // Facebook OAuth 토큰 교환
    const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: qs.stringify({
        code,
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: 'https://eyevsai.onrender.com/api/auth/facebook/callback',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Facebook OAuth 토큰 교환 실패');
    }

    const tokenData = await tokenResponse.json();
    
    // Facebook 사용자 정보 가져오기
    const userResponse = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${tokenData.access_token}`);

    if (!userResponse.ok) {
      throw new Error('Facebook 사용자 정보 가져오기 실패');
    }

    const profile = await userResponse.json();

    // 사용자 처리
    if (!profile.email) {
      const frontendUrl = process.env.FRONTEND_URL || 'https://eyevsai-frontend-kr9d.vercel.app';
      return res.redirect(`${frontendUrl}/login?error=이메일 정보를 가져올 수 없습니다.`);
    }

    let user = await User.findOne({ email: profile.email });
    let username = profile.name || `user_${Date.now()}`;
    const email = profile.email;
    const avatar = profile.picture?.data?.url || null;

    // 사용자명 중복 처리
    if (!user) {
      // 사용자명이 중복되는 경우 숫자 추가
      let counter = 1;
      let originalUsername = username;
      let finalUsername = username;
      
      // 중복되지 않는 사용자명을 찾을 때까지 반복
      while (true) {
        const existingUser = await User.findOne({ username: finalUsername });
        if (!existingUser) {
          break;
        }
        finalUsername = `${originalUsername}${counter}`;
        counter++;
      }

      user = new User({
        username: finalUsername,
        email,
        password: 'social_login_' + Math.random().toString(36).substr(2, 9),
        avatar,
        socialProvider: 'facebook',
        socialId: profile.id
      });
      await user.save();
    } else {
      // 기존 사용자의 경우 사용자명은 변경하지 않음 (중복 방지)
      user.socialProvider = 'facebook';
      user.socialId = profile.id;
      if (avatar) user.avatar = avatar;
      await user.save();
    }

    // JWT 토큰 생성
    const token = generateToken(user._id);
    const userInfo = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      points: user.points,
      totalVotes: user.totalVotes,
      correctVotes: user.correctVotes,
      avatar: user.avatar,
      socialProvider: user.socialProvider
    };
    
    const userData = encodeURIComponent(JSON.stringify(userInfo));
    const frontendUrl = process.env.FRONTEND_URL || 'https://eyevsai-frontend-kr9d.vercel.app';
    res.redirect(`${frontendUrl}/auth-callback?token=${token}&user=${userData}`);
  } catch (error) {
    console.error('Facebook callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'https://eyevsai-frontend-kr9d.vercel.app';
    res.redirect(`${frontendUrl}/login?error=소셜 로그인에 실패했습니다.`);
  }
});

router.get('/kakao', (req, res) => {
  const redirectUrl = "https://kauth.kakao.com/oauth/authorize?" +
    qs.stringify({
      client_id: process.env.KAKAO_CLIENT_ID,
      redirect_uri: 'http://localhost:5000/api/auth/kakao/callback',
      response_type: "code",
      state: Math.random().toString(36).substr(2, 9),
    });

  res.redirect(redirectUrl);
});

router.get('/kakao/callback', async (req, res) => {
  try {
    if (req.query.error === 'access_denied') {
      const frontendUrl = process.env.FRONTEND_URL || 'https://eyevsai-frontend-kr9d.vercel.app';
      return res.redirect(`${frontendUrl}/login?error=user_cancelled`);
    }

    const { code } = req.query;
    if (!code) {
      const frontendUrl = process.env.FRONTEND_URL || 'https://eyevsai-frontend-kr9d.vercel.app';
      return res.redirect(`${frontendUrl}/login?error=인증 코드를 받지 못했습니다.`);
    }

    // Kakao OAuth 토큰 교환
    const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: qs.stringify({
        code,
        client_id: process.env.KAKAO_CLIENT_ID,
        client_secret: process.env.KAKAO_CLIENT_SECRET,
        redirect_uri: 'https://eyevsai.onrender.com/api/auth/kakao/callback',
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Kakao OAuth 토큰 교환 실패');
    }

    const tokenData = await tokenResponse.json();
    
    // Kakao 사용자 정보 가져오기
    const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Kakao 사용자 정보 가져오기 실패');
    }

    const profile = await userResponse.json();

    // 사용자 처리
    const email = profile.kakao_account?.email;
    if (!email) {
      const frontendUrl = process.env.FRONTEND_URL || 'https://eyevsai-frontend-kr9d.vercel.app';
      return res.redirect(`${frontendUrl}/login?error=이메일 정보를 가져올 수 없습니다.`);
    }

    let user = await User.findOne({ email });
    let username = profile.properties?.nickname || `user_${Date.now()}`;
    const avatar = profile.properties?.profile_image || null;

    // 사용자명 중복 처리
    if (!user) {
      // 사용자명이 중복되는 경우 숫자 추가
      let counter = 1;
      let originalUsername = username;
      let finalUsername = username;
      
      // 중복되지 않는 사용자명을 찾을 때까지 반복
      while (true) {
        const existingUser = await User.findOne({ username: finalUsername });
        if (!existingUser) {
          break;
        }
        finalUsername = `${originalUsername}${counter}`;
        counter++;
      }

      user = new User({
        username: finalUsername,
        email,
        password: 'social_login_' + Math.random().toString(36).substr(2, 9),
        avatar,
        socialProvider: 'kakao',
        socialId: profile.id.toString()
      });
      await user.save();
    } else {
      // 기존 사용자의 경우 사용자명은 변경하지 않음 (중복 방지)
      user.socialProvider = 'kakao';
      user.socialId = profile.id.toString();
      if (avatar) user.avatar = avatar;
      await user.save();
    }

    // JWT 토큰 생성
    const token = generateToken(user._id);
    const userInfo = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      points: user.points,
      totalVotes: user.totalVotes,
      correctVotes: user.correctVotes,
      avatar: user.avatar,
      socialProvider: user.socialProvider
    };
    
    const userData = encodeURIComponent(JSON.stringify(userInfo));
    const frontendUrl = process.env.FRONTEND_URL || 'https://eyevsai-frontend-kr9d.vercel.app';
    res.redirect(`${frontendUrl}/auth-callback?token=${token}&user=${userData}`);
  } catch (error) {
    console.error('Kakao callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'https://eyevsai-frontend-kr9d.vercel.app';
    res.redirect(`${frontendUrl}/login?error=소셜 로그인에 실패했습니다.`);
  }
});

// 사용자명 중복확인
router.get('/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    // 사용자명 유효성 검사
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ 
        available: false, 
        error: '사용자명은 3-20자 사이여야 합니다.' 
      });
    }
    
    if (!/^[a-zA-Z0-9가-힣_]+$/.test(username)) {
      return res.status(400).json({ 
        available: false, 
        error: '사용자명은 영문, 숫자, 한글, 언더스코어(_)만 사용 가능합니다.' 
      });
    }

    // 중복 확인
    const existingUser = await User.findOne({ username });
    
    if (existingUser) {
      return res.json({ 
        available: false, 
        error: '이미 사용 중인 사용자명입니다.' 
      });
    }

    res.json({ 
      available: true, 
      message: '사용 가능한 사용자명입니다.' 
    });
  } catch (error) {
    console.error('Username check error:', error);
    res.status(500).json({ 
      available: false, 
      error: '사용자명 확인 중 오류가 발생했습니다.' 
    });
  }
});

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