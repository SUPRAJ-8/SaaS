const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Client = require('../models/Client');
const User = require('../models/User');
const { ensureAuthenticated } = require('../middleware/auth');

// Helper function to generate subdomain from store name
const generateSubdomain = async (storeName) => {
    // Convert to lowercase, remove spaces and special characters
    // Keep only alphanumeric characters and hyphens
    let subdomain = storeName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]/g, '') // Remove all non-alphanumeric except hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

    // Ensure subdomain is not empty
    if (!subdomain) {
        subdomain = `store-${Date.now().toString().slice(-6)}`;
    }

    // Check if subdomain exists, if so append unique string
    let existingSubdomain = await Client.findOne({ subdomain });
    if (existingSubdomain) {
        subdomain = `${subdomain}-${Date.now().toString().slice(-4)}`;
    }

    return subdomain;
};

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

        // Allow users to have multiple stores, so we don't check for existing client here
        // The check is only for existing users (which is handled above)

        // Generate subdomain from store name
        const subdomain = await generateSubdomain(storeName);

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

// @route   GET api/auth/my-stores
// @desc    Get all stores (clients) owned by the authenticated user
// @access  Private
router.get('/my-stores', ensureAuthenticated, async (req, res) => {
    try {
        // Get user's email
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Find all clients owned by this user's email
        let clients = await Client.find({ ownerEmail: user.email.toLowerCase() }).sort({ createdAt: -1 });
        
        // Auto-generate subdomain for clients that don't have one
        for (let client of clients) {
            if (!client.subdomain && client.name) {
                try {
                    const subdomain = await generateSubdomain(client.name);
                    client.subdomain = subdomain;
                    await client.save();
                    console.log(`Auto-generated subdomain "${subdomain}" for client "${client.name}"`);
                } catch (err) {
                    console.error(`Error generating subdomain for client ${client._id}:`, err);
                }
            }
        }
        
        // Re-fetch to get updated clients
        clients = await Client.find({ ownerEmail: user.email.toLowerCase() }).sort({ createdAt: -1 });
        res.json(clients);
    } catch (err) {
        console.error('Error fetching user stores:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/create-store
// @desc    Create a new store (client) for the authenticated user
// @access  Private
router.post('/create-store', ensureAuthenticated, async (req, res) => {
    try {
        const { storeName } = req.body;
        
        if (!storeName || !storeName.trim()) {
            return res.status(400).json({ msg: 'Store name is required' });
        }

        // Get user's email
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Generate subdomain from store name
        const subdomain = await generateSubdomain(storeName);

        // Create a new Client (store)
        const newClient = new Client({
            name: storeName.trim(),
            ownerEmail: user.email.toLowerCase(),
            subdomain: subdomain,
            subscriptionPlan: 'free',
            subscriptionStatus: 'trialing'
        });

        const savedClient = await newClient.save();
        res.status(201).json(savedClient);
    } catch (err) {
        console.error('Error creating store:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
