const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const KakaoStrategy = require('passport-kakao').Strategy;
const User = require('../models/User');

let BASE_URL = process.env.BASE_URL || '';
if (BASE_URL.startsWith('http://')) {
  BASE_URL = BASE_URL.replace('http://', 'https://');
}

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
    const username = profile.displayName || `user_${Date.now()}`;
    const email = profile.emails[0].value;
    const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : null;
    if (!user) {
      user = new User({
        username,
        email,
        password: 'social_login_' + Math.random().toString(36).substr(2, 9),
        avatar,
        socialProvider: 'google',
        socialId: profile.id
      });
      await user.save();
    } else {
      // 소셜 정보 및 프로필 동기화
      user.socialProvider = 'google';
      user.socialId = profile.id;
      user.username = username;
      if (avatar) user.avatar = avatar;
      await user.save();
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
    const username = profile.displayName || `user_${Date.now()}`;
    const email = profile.emails[0].value;
    const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : null;
    if (!user) {
      user = new User({
        username,
        email,
        password: 'social_login_' + Math.random().toString(36).substr(2, 9),
        avatar,
        socialProvider: 'facebook',
        socialId: profile.id
      });
      await user.save();
    } else {
      // 소셜 정보 및 프로필 동기화
      user.socialProvider = 'facebook';
      user.socialId = profile.id;
      user.username = username;
      if (avatar) user.avatar = avatar;
      await user.save();
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
    const username = profile.displayName || `user_${Date.now()}`;
    const avatar = profile._json.properties?.profile_image || null;
    if (!user) {
      user = new User({
        username,
        email,
        password: 'social_login_' + Math.random().toString(36).substr(2, 9),
        avatar,
        socialProvider: 'kakao',
        socialId: profile.id
      });
      await user.save();
    } else {
      // 소셜 정보 및 프로필 동기화
      user.socialProvider = 'kakao';
      user.socialId = profile.id;
      user.username = username;
      if (avatar) user.avatar = avatar;
      await user.save();
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