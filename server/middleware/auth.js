const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        // Check for concurrent login validation
        // req.user is fresh from DB (via deserializeUser)
        // If user has a currentSessionId recorded, it MUST match the session's sessionId
        if (req.user.currentSessionId && req.user.currentSessionId !== req.session.sessionId) {
            console.log(`🚫 Concurrent login detected for user ${req.user.email}. Invalidating session.`);
            req.session = null; // Clear session (cookie-session)
            return res.status(401).json({
                msg: 'Session expired',
                reason: 'You have been logged in from another device.'
            });
        }
        return next();
    }
    res.status(401).json({ msg: 'Unauthorized: Please log in to access this resource' });
};

module.exports = { ensureAuthenticated };
