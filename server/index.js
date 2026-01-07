require('dotenv').config();
const express = require('express');
const Client = require('./models/Client');
const cors = require('cors');
const connectDB = require('./db');

const app = express();

// Init Middleware
app.set('trust proxy', 1); // Trust first proxy (Render, Heroku, etc)

// Debug: Log all incoming requests
app.use((req, res, next) => {
  console.log(`📥 [${req.method}] ${req.originalUrl} | Host: ${req.hostname} | Origin: ${req.headers.origin}`);
  next();
});

// Configure CORS
// IMPORTANT: When credentials: true, origin must be a specific origin or array, never '*'
const allowedOrigins = [
  'http://localhost:3000',
  'http://app.localhost:3000',
  'https://nepostore.xyz',
  'https://www.nepostore.xyz',
  'https://app.nepostore.xyz'
];

// CORS configuration - CRITICAL FIX for credentials mode
// When credentials: true, Access-Control-Allow-Origin MUST be a specific origin, never '*'
const corsOptions = {
  origin: function (origin, callback) {
    // Log for debugging
    console.log('[CORS] Request from origin:', origin || 'no origin');

    // If no origin (same-origin request), the cors library should not set the header
    // But to be safe with credentials, we'll use a default allowed origin
    if (!origin) {
      // For same-origin requests, cors library won't set the header (which is correct)
      // But to avoid any issues, we'll return the first allowed origin as fallback
      console.log('[CORS] No origin - same-origin request, allowing');
      return callback(null, true); // cors library handles this correctly for same-origin
    }

    // Normalize origin (remove trailing slash if present)
    const normalizedOrigin = origin.replace(/\/$/, '');

    // Check if the origin matches any of our base domains or localhost
    // Also allow local network IPs (192.168.x.x, 10.x.x.x, 172.x.x.x) for development testing
    const isAllowed = allowedOrigins.includes(normalizedOrigin) ||
      normalizedOrigin.includes('localhost') ||
      normalizedOrigin.includes('nepostore.xyz') ||
      normalizedOrigin.startsWith('http://192.168.') ||
      normalizedOrigin.startsWith('http://10.') ||
      normalizedOrigin.startsWith('http://172.');

    if (isAllowed) {
      // CRITICAL: Return the specific origin string
      // This ensures Access-Control-Allow-Origin is set to the specific origin, not '*'
      console.log('[CORS] ✓ Allowing origin:', normalizedOrigin);
      callback(null, normalizedOrigin);
    } else {
      console.log('[CORS] ✗ BLOCKED origin:', normalizedOrigin);
      callback(new Error(`Not allowed by CORS: ${normalizedOrigin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'x-subdomain'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Manual CORS handler removed to avoid duplicate headers with cors middleware
// app.use((req, res, next) => { ... });

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static('uploads'));

const cookieSession = require('cookie-session');
const passport = require('passport');
require('./config/passport-setup'); // Executes the passport setup

// Session and Passport Middleware
const isProd = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
console.log('[Init] Production mode:', isProd, '(Environment:', process.env.NODE_ENV, ')');

// Cookie session configuration
app.use((req, res, next) => {
  const cookieConfig = {
    name: 'session',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    keys: ['ecommerce_secret_key'],
    httpOnly: true
  };

  if (isProd) {
    // CRITICAL FIX: For cross-domain auth (frontend on nepostore.xyz, backend on render.com or api.nepostore.xyz)
    // We MUST use sameSite: 'none' and secure: true
    cookieConfig.sameSite = 'none';
    cookieConfig.secure = true;

    // Set domain to allow sharing cookies across all subdomains of nepostore.xyz
    // This is essential if frontend is on app.nepostore.xyz and backend is on api.nepostore.xyz
    if (req.hostname.endsWith('nepostore.xyz')) {
      cookieConfig.domain = '.nepostore.xyz';
      console.log('[Cookie] Production config: domain=.nepostore.xyz, sameSite=none, secure=true');
    } else {
      console.log('[Cookie] Production config: no domain specified, sameSite=none, secure=true');
    }
  } else {
    cookieConfig.sameSite = 'lax';
    cookieConfig.secure = false;
  }

  cookieSession(cookieConfig)(req, res, next);
});

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
const subdomainHandler = async (req, res, next) => {
  const host = req.hostname;
  const headerSubdomain = req.headers['x-subdomain'];

  // 1. Try Custom Domain first (Fastest lookup)
  // If the host is not our main domains, it might be a user's custom domain
  const isMainDomain = host === 'nepostore.xyz' ||
    host === 'www.nepostore.xyz' ||
    host === 'app.nepostore.xyz' ||
    host === 'localhost' ||
    host.endsWith('.localhost');

  if (!isMainDomain || headerSubdomain) {
    try {
      const query = headerSubdomain ? { subdomain: headerSubdomain } : { customDomain: host };
      const tenantClient = await Client.findOne(query);
      if (tenantClient) {
        req.tenantClient = tenantClient;
        return next();
      }
    } catch (err) {
      console.error('Custom domain lookup error:', err);
    }
  }

  // 2. Fallback to Subdomain logic
  const parts = host.split('.');
  let subdomain = headerSubdomain || null;

  if (!subdomain) {
    if (host.endsWith('.localhost')) {
      subdomain = parts[0];
    } else if (host.endsWith('.nepostore.xyz')) {
      subdomain = parts[0];
    }
  }

  if (subdomain === 'app') {
    return next();
  }

  if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
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
app.use('/api/users', require('./routes/users'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/pages', require('./routes/pages'));
// We will create the API for managing websites later
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/seeder', require('./routes/seeder'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/super-admin', require('./routes/super-admin'));
app.use('/api/store-settings', require('./routes/store-settings'));
app.use('/api/client-pages', require('./routes/client-pages'));
app.use('/api/public-settings', require('./routes/public-settings'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/themes', require('./routes/themes'));
app.use('/api/websites', require('./routes/websites'));

// 404 Handler for API routes - Log to help debugging
app.use('/api/*', (req, res) => {
  console.log(`📡 [404] Unmatched API request: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    msg: 'API Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

const port = process.env.PORT || 5002;

const startServer = async () => {
  try {
    // Connect to Database first
    await connectDB();

    // Fix for legacy unique index on ownerEmail
    try {
      console.log('🔍 Checking for legacy indexes on clients collection...');
      const indexes = await Client.collection.indexes();
      console.log('📊 Existing indexes:', indexes.map(i => i.name).join(', '));

      // Specifically target the "Email_1" or "ownerEmail_1" indices
      const emailsIndex = indexes.find(idx => idx.name === 'Email_1');
      const ownerEmailsIndex = indexes.find(idx => idx.name === 'ownerEmail_1');

      if (emailsIndex) {
        console.log('🗑️ Found legacy unique index "Email_1". Attempting to drop...');
        await Client.collection.dropIndex('Email_1');
        console.log('✅ Successfully dropped index: Email_1');
      }

      if (ownerEmailsIndex) {
        console.log('🗑️ Found legacy unique index "ownerEmail_1". Attempting to drop...');
        await Client.collection.dropIndex('ownerEmail_1');
        console.log('✅ Successfully dropped index: ownerEmail_1');
      }
    } catch (indexErr) {
      console.log('ℹ️ Index cleanup info:', indexErr.message);
    }

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
