const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ msg: 'Unauthorized: Please log in to access this resource' });
};

module.exports = { ensureAuthenticated };
