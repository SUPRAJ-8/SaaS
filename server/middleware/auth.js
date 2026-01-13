const ensureAuthenticated = (req, res, next) => {
    console.log('🔐 ensureAuthenticated check:', {
        isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
        hasUser: !!req.user,
        userEmail: req.user?.email,
        sessionId: req.session?.sessionId,
        userSessionId: req.user?.currentSessionId
    });

    if (req.isAuthenticated && req.isAuthenticated()) {
        // Check for concurrent login validation
        // ONLY if both the session has an ID and the user record has a recorded session ID
        if (req.user.currentSessionId && req.session.sessionId && req.user.currentSessionId !== req.session.sessionId) {
            console.log(`🚫 Concurrent login detected for user ${req.user.email}. Invalidating session.`);
            req.session = null; // Clear session (cookie-session)
            return res.status(401).json({
                msg: 'Session expired',
                reason: 'You have been logged in from another device.'
            });
        }
        return next();
    }
    console.log('❌ Authentication failed - user not authenticated');
    res.status(401).json({ msg: 'Unauthorized: Please log in to access this resource' });
};

module.exports = { ensureAuthenticated };
