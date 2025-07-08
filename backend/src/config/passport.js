const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const KakaoStrategy = require('passport-kakao').Strategy;
const User = require('../models/User');

const BASE_URL = process.env.BASE_URL || '';

// Google OAuth
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: BASE_URL ? `${BASE_URL}/api/auth/google/callback` : "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    if (!profile.emails || !profile.emails[0]) {
      return done(new Error('이메일 정보를 가져올 수 없습니다.'), null);
    }

    let user = await User.findOne({ email: profile.emails[0].value });
    
    if (!user) {
      // 기존 사용자가 없는 경우 새로 생성
      const username = profile.displayName || `user_${Date.now()}`;
      const email = profile.emails[0].value;
      const password = 'social_login_' + Math.random().toString(36).substr(2, 9);
      const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

      user = new User({
        username,
        email,
        password,
        avatar,
        socialProvider: 'google',
        socialId: profile.id
      });
      await user.save();
    } else {
      // 기존 사용자의 소셜 정보 업데이트
      if (!user.socialProvider) {
        user.socialProvider = 'google';
        user.socialId = profile.id;
        if (profile.photos && profile.photos[0]) {
          user.avatar = profile.photos[0].value;
        }
        await user.save();
      }
    }
    
    return done(null, user);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error, null);
  }
}));

// Facebook OAuth
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: BASE_URL ? `${BASE_URL}/api/auth/facebook/callback` : "/api/auth/facebook/callback",
  profileFields: ['id', 'displayName', 'photos', 'email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    if (!profile.emails || !profile.emails[0]) {
      return done(new Error('이메일 정보를 가져올 수 없습니다.'), null);
    }

    let user = await User.findOne({ email: profile.emails[0].value });
    
    if (!user) {
      // 기존 사용자가 없는 경우 새로 생성
      const username = profile.displayName || `user_${Date.now()}`;
      const email = profile.emails[0].value;
      const password = 'social_login_' + Math.random().toString(36).substr(2, 9);
      const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

      user = new User({
        username,
        email,
        password,
        avatar,
        socialProvider: 'facebook',
        socialId: profile.id
      });
      await user.save();
    } else {
      // 기존 사용자의 소셜 정보 업데이트
      if (!user.socialProvider) {
        user.socialProvider = 'facebook';
        user.socialId = profile.id;
        if (profile.photos && profile.photos[0]) {
          user.avatar = profile.photos[0].value;
        }
        await user.save();
      }
    }
    
    return done(null, user);
  } catch (error) {
    console.error('Facebook OAuth error:', error);
    return done(error, null);
  }
}));

// Kakao OAuth
passport.use(new KakaoStrategy({
  clientID: process.env.KAKAO_CLIENT_ID,
  clientSecret: process.env.KAKAO_CLIENT_SECRET,
  callbackURL: BASE_URL ? `${BASE_URL}/api/auth/kakao/callback` : "/api/auth/kakao/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile._json.kakao_account?.email;
    if (!email) {
      return done(new Error('이메일 정보를 가져올 수 없습니다.'), null);
    }

    let user = await User.findOne({ email });
    
    if (!user) {
      // 기존 사용자가 없는 경우 새로 생성
      const username = profile.displayName || `user_${Date.now()}`;
      const password = 'social_login_' + Math.random().toString(36).substr(2, 9);
      const avatar = profile._json.properties?.profile_image || null;

      user = new User({
        username,
        email,
        password,
        avatar,
        socialProvider: 'kakao',
        socialId: profile.id
      });
      await user.save();
    } else {
      // 기존 사용자의 소셜 정보 업데이트
      if (!user.socialProvider) {
        user.socialProvider = 'kakao';
        user.socialId = profile.id;
        if (profile._json.properties?.profile_image) {
          user.avatar = profile._json.properties.profile_image;
        }
        await user.save();
      }
    }
    
    return done(null, user);
  } catch (error) {
    console.error('Kakao OAuth error:', error);
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport; 