const express = require('express');
const passport = require('passport');
const router = express.Router();

// @route   GET /auth/google
// @desc    Authenticate with Google
// @access  Public
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'] // What we want to get from the user's Google account
}));

// @route   GET /auth/google/callback
// @desc    Google auth callback
// @access  Public
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login-error' }), (req, res) => {
  // Successful authentication, redirect to the client's dashboard.
  let clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

  if (clientUrl.includes('nepostore.xyz')) {
    clientUrl = 'https://app.nepostore.xyz';
  } else if (clientUrl.includes('localhost')) {
    // For local development with subdomains
    clientUrl = 'http://app.localhost:3000';
  }

  res.redirect(`${clientUrl}/dashboard`);
});

// @route   GET /auth/logout
// @desc    Logout user
// @access  Public
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    req.session = null; // Clear the session cookie
    res.redirect('http://localhost:3000'); // Redirect to landing page
  });
});

// @route   GET /auth/current_user
// @desc    Return current user
// @access  Public
router.get('/current_user', (req, res) => {
  console.log('📍 /auth/current_user called');
  console.log('Session exists:', !!req.session);
  console.log('Session passport:', req.session?.passport);
  console.log('User in session:', !!req.user);
  console.log('User data:', req.user ? { id: req.user._id, name: req.user.name, email: req.user.email } : 'No user');
  console.log('Cookies:', req.headers.cookie);

  if (!req.user) {
    return res.status(401).json({ msg: 'Not Authenticated' });
  }
  res.send(req.user);
});

module.exports = router;
