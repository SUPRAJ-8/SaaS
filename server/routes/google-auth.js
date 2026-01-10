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

    // Determine redirect URL based on environment
    let redirectUrl = 'http://localhost:3000'; // Default for development

    // Check if we're in production
    const origin = req.get('origin') || req.get('referer') || '';
    if (origin.includes('nepostore.xyz')) {
      // Production: redirect to app subdomain login page
      redirectUrl = 'https://app.nepostore.xyz/login';
    } else if (origin.includes('app.localhost')) {
      // Development with subdomain: redirect to app subdomain login
      redirectUrl = 'http://app.localhost:3000/login';
    } else if (origin.includes('localhost')) {
      // Development: redirect to main domain
      redirectUrl = 'http://localhost:3000';
    }

    res.redirect(redirectUrl);
  });
});

// @route   GET /auth/current_user
// @desc    Return current user
// @access  Public
router.get('/current_user', (req, res) => {
  console.log('📍 /auth/current_user called');
  console.log('User in session:', !!req.user);
  if (req.user) {
    console.log('User details:', {
      id: req.user._id,
      email: req.user.email,
      clientIdType: typeof req.user.clientId,
      hasClientIdSubdomain: !!(req.user.clientId && req.user.clientId.subdomain)
    });
  }

  if (!req.user) {
    return res.status(401).json({ msg: 'Not Authenticated' });
  }
  res.send(req.user);
});

module.exports = router;
