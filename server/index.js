require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

const app = express();

// Init Middleware
app.set('trust proxy', 1); // Trust first proxy (Render, Heroku, etc)

// Configure CORS
// IMPORTANT: When credentials: true, origin must be a specific origin or array, never '*'
const allowedOrigins = [
  'http://localhost:3000',
  'http://app.localhost:3000',
  'https://nepostore.xyz',
  'https://www.nepostore.xyz',
  'https://app.nepostore.xyz'
];

// CORS configuration - CRITICAL: Must return specific origin, never '*' when credentials: true
const corsOptions = {
  origin: function (origin, callback) {
    // Log for debugging
    console.log('[CORS] Request from origin:', origin || 'no origin');
    
    // CRITICAL FIX: When credentials: true, we CANNOT return true for no origin
    // as it causes the cors library to set Access-Control-Allow-Origin to '*'
    // Instead, we must return a specific origin or handle it differently
    if (!origin) {
      // For same-origin requests (no Origin header), don't set CORS headers
      // The cors library will skip setting Access-Control-Allow-Origin which is correct
      console.log('[CORS] No origin header - allowing (same-origin request)');
      return callback(null, true);
    }

    // Normalize origin (remove trailing slash if present)
    const normalizedOrigin = origin.replace(/\/$/, '');

    // Check if the origin matches any of our base domains or localhost
    const isAllowed = allowedOrigins.includes(normalizedOrigin) ||
      normalizedOrigin.includes('localhost') ||
      normalizedOrigin.includes('nepostore.xyz');

    if (isAllowed) {
      // CRITICAL: Return the specific origin string, NOT true
      // This ensures Access-Control-Allow-Origin is set to the specific origin, not '*'
      console.log('[CORS] Allowing origin:', normalizedOrigin);
      callback(null, normalizedOrigin);
    } else {
      console.log('[CORS] BLOCKED origin:', normalizedOrigin);
      callback(new Error(`Not allowed by CORS: ${normalizedOrigin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

app.use(express.json({ extended: false }));
app.use('/uploads', express.static('uploads'));

const cookieSession = require('cookie-session');
const passport = require('passport');
require('./config/passport-setup'); // Executes the passport setup

// Session and Passport Middleware
const isProd = process.env.NODE_ENV === 'production';
app.use(
  cookieSession({
    name: 'session',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    keys: ['ecommerce_secret_key'], // Simple fixed key for consistency
    // Don't set domain for localhost - let browser handle it
    // When using proxy, cookies will be on same origin
    // For cross-domain cookies (Frontend on Vercel, Backend on Render), 
    // we MUST use sameSite: 'none' and secure: true.
    // Also, don't set a specific domain if the backend and frontend 
    // are on different base domains (e.g., nepostore.xyz vs onrender.com).
    ...(isProd ? {
      sameSite: 'none',
      secure: true
    } : {
      sameSite: 'lax',
      secure: false
    }),
    httpOnly: true
  })
);

// Fix for Passport 0.6.0+
app.use((req, res, next) => {
  if (req.session && !req.session.regenerate) {
    req.session.regenerate = (cb) => cb();
  }
  if (req.session && !req.session.save) {
    req.session.save = (cb) => cb();
  }
  next();
});

app.use(passport.initialize());
app.use(passport.session());

// Debug middleware
app.use((req, res, next) => {
  if (req.path === '/auth/current_user') {
    console.log('🔍 Session data:', req.session);
    console.log('🔍 User data:', req.user ? req.user.email : 'No user');
  }
  next();
});

// Middleware to handle subdomain routing
const Client = require('./models/Client');
const subdomainHandler = async (req, res, next) => {
  const host = req.hostname;
  const parts = host.split('.');

  // Determine subdomain based on hostname structure
  let subdomain = null;

  if (host.endsWith('.localhost')) {
    // e.g., app.localhost, tenant.localhost
    subdomain = parts[0];
  } else if (host === 'localhost') {
    // Root localhost - no subdomain
    subdomain = null;
  } else if (host === 'nepostore.xyz' || host === 'www.nepostore.xyz') {
    // Main domain - no subdomain (landing page)
    subdomain = null;
  } else if (host.endsWith('.nepostore.xyz')) {
    // Production subdomain: app.nepostore.xyz, tenant.nepostore.xyz, etc.
    subdomain = parts[0];
  } else if (parts.length > 2) {
    // Fallback for other domains with subdomains
    subdomain = parts[0];
  }

  // If we are on app subdomain, it's the admin dashboard
  if (subdomain === 'app') {
    return next();
  }

  // Check if it's a client/tenant subdomain (for shop)
  if (subdomain && subdomain !== 'localhost' && subdomain !== 'www' && subdomain !== 'api') {
    try {
      const tenantClient = await Client.findOne({ subdomain });
      if (tenantClient) {
        req.tenantClient = tenantClient;
      }
    } catch (err) {
      console.error('Subdomain lookup error:', err);
    }
  }
  next();
};

// Use the subdomain handler for all incoming requests
app.use(subdomainHandler);

app.get('/', (req, res) => {
  res.send('API for Nepali CMS is running...');
});

// Define API Routes
app.use('/auth', require('./routes/google-auth'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/pages', require('./routes/pages'));
// We will create the API for managing websites later
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/seeder', require('./routes/seeder'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/super-admin', require('./routes/super-admin'));

const port = process.env.PORT || 5002;

const startServer = async () => {
  try {
    // Connect to Database first
    await connectDB();

    const server = app.listen(port, () => {
      console.log(`Server is running on port: ${port}`);
    });

    // Handle common server errors (like port in use)
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(
          `Port ${port} is already in use. Stop the other process using this port or set a different PORT in your environment.`
        );
      } else {
        console.error('Server error:', err);
      }
      process.exit(1);
    });
  } catch (err) {
    console.error(
      'Failed to connect to MongoDB. Server will not start. Details:',
      err.message || err
    );
    process.exit(1);
  }
};

startServer();
