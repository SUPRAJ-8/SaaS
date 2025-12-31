const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Client = require('../models/Client');
const User = require('../models/User');

// @route   POST api/auth/register
// @desc    Register a new tenant/client and admin user
// @access  Public
router.post('/register', async (req, res) => {
    console.log('📝 Registration request body:', req.body);
    const { fullName, email, storeName, password } = req.body;
    console.log('Extracted fields:', { fullName, email, storeName, hasPassword: !!password });

    try {
        // Check if user or client already exists
        let userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ msg: 'User with this email already exists' });
        }

        let clientExists = await Client.findOne({ ownerEmail: email.toLowerCase() });
        if (clientExists) {
            return res.status(400).json({ msg: 'A store with this email already exists' });
        }

        // Generate subdomain slug
        let subdomain = storeName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

        // Check if subdomain exists, if so append unique string
        let existingSubdomain = await Client.findOne({ subdomain });
        if (existingSubdomain) {
            subdomain = `${subdomain}-${Date.now().toString().slice(-4)}`;
        }

        // 1. Create a new Client
        console.log('🏗️ Creating Client with:', {
            name: storeName,
            ownerEmail: email.toLowerCase(),
            subdomain: subdomain
        });

        const newClient = new Client({
            name: storeName,
            ownerEmail: email.toLowerCase(),
            subdomain: subdomain,
            subscriptionPlan: 'free',
            subscriptionStatus: 'trialing'
        });

        const savedClient = await newClient.save();
        console.log('✅ Client saved:', savedClient._id);

        // 2. Create the User (linked to the new Client)
        const newUser = new User({
            clientId: savedClient._id,
            name: fullName,
            email: email.toLowerCase(),
            password: password // Will be hashed below
        });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        newUser.password = await bcrypt.hash(password, salt);

        const savedUser = await newUser.save();

        // Establish session
        req.login(savedUser, (err) => {
            if (err) {
                console.error('Passport req.login error (register):', err);
                return res.status(500).json({ msg: 'Session creation failed during registration' });
            }

            // req.login() automatically calls serializeUser and sets req.session.passport
            console.log('💾 Registration session after req.login:', req.session);

            res.json({ success: true, msg: 'Store created successfully', user: savedUser });
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/login
// @desc    Login user with email and password
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Establish session strictly for this user
        req.login(user, (err) => {
            if (err) {
                console.error('Passport req.login error (login):', err);
                return res.status(500).json({ msg: 'Login session failed' });
            }

            // req.login() automatically calls serializeUser and sets req.session.passport
            console.log('💾 Login session after req.login:', req.session);

            res.json({
                success: true,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    clientId: user.clientId
                }
            });
        });
    } catch (err) {
        console.error('Login Route Error:', err);
        res.status(500).send('Server Error: ' + err.message);
    }
});

module.exports = router;
