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
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  res.redirect(`${clientUrl}/dashboard`);
});

// @route   GET /api/logout
// @desc    Logout user
// @access  Private
router.get('/logout', (req, res) => {
  req.logout(); // This function is attached by Passport
  res.redirect('/'); // Redirect to the homepage or login page
});

// @route   GET /api/current_user
// @desc    Return current user
// @access  Private
router.get('/current_user', (req, res) => {
  res.send(req.user); // req.user is populated by Passport if the user is logged in
});

module.exports = router;
