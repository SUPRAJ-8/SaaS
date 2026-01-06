const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { ensureAuthenticated } = require('../middleware/auth');

// @route   GET api/users
// @desc    Get all users for the current client
// @access  Private
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const users = await User.find({ clientId: req.user.clientId }).sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/users
// @desc    Add a new user (invitation logic can be added later)
// @access  Private
router.post('/', ensureAuthenticated, async (req, res) => {
    const { name, email, role, gender } = req.body;
    const normalizedEmail = email ? email.toLowerCase() : '';
    try {
        let user = await User.findOne({ email: normalizedEmail, clientId: req.user.clientId });
        if (user) {
            return res.status(400).json({ msg: 'User already exists in this store' });
        }

        user = new User({
            name,
            email: normalizedEmail,
            role,
            gender,
            clientId: req.user.clientId,
            status: 'Pending' // Show as pending until they accept/login
        });

        await user.save();
        res.json(user);
    } catch (err) {
        console.error('Error adding user:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/users/:id
// @desc    Update user details (role, status, etc)
// @access  Private
router.put('/:id', ensureAuthenticated, async (req, res) => {
    const { role, status, emailNotification } = req.body;
    try {
        let user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // Ensure user belongs to the same clientId
        if (user.clientId.toString() !== req.user.clientId.toString()) {
            return res.status(401).json({ msg: 'Unauthorized' });
        }

        if (role) user.role = role;
        if (status) user.status = status;
        if (emailNotification !== undefined) user.emailNotification = emailNotification;

        await user.save();
        res.json(user);
    } catch (err) {
        console.error('Error updating user:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/users/:id
// @desc    Delete/Remove user from store
// @access  Private
router.delete('/:id', ensureAuthenticated, async (req, res) => {
    try {
        let user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (user.clientId.toString() !== req.user.clientId.toString()) {
            return res.status(401).json({ msg: 'Unauthorized' });
        }

        // Prevent deleting yourself if you are the only admin? (Optional safety check)

        await user.deleteOne();
        res.json({ msg: 'User removed' });
    } catch (err) {
        console.error('Error deleting user:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/users/bulk-delete
// @desc    Bulk delete users
// @access  Private
router.post('/bulk-delete', ensureAuthenticated, async (req, res) => {
    const { ids } = req.body;
    try {
        await User.deleteMany({
            _id: { $in: ids },
            clientId: req.user.clientId
        });
        res.json({ msg: 'Users deleted' });
    } catch (err) {
        console.error('Error bulk deleting users:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/users/bulk-status
// @desc    Bulk update user status
// @access  Private
router.post('/bulk-status', ensureAuthenticated, async (req, res) => {
    const { ids, status } = req.body;
    try {
        await User.updateMany(
            { _id: { $in: ids }, clientId: req.user.clientId },
            { $set: { status } }
        );
        res.json({ msg: 'Statuses updated' });
    } catch (err) {
        console.error('Error bulk updating status:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
