require('dotenv').config();
const express = require('express');
const Client = require('./models/Client');
const cors = require('cors');
const connectDB = require('./db');
const Category = require('./models/Category');
const Product = require('./models/Product');

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

    // Check standard allowed origins first
    const isStandardOrigin = allowedOrigins.includes(normalizedOrigin) ||
      normalizedOrigin.includes('localhost') ||
      normalizedOrigin.includes('nepostore.xyz') ||
      normalizedOrigin.startsWith('http://192.168.') ||
      normalizedOrigin.startsWith('http://10.') ||
      normalizedOrigin.startsWith('http://172.');

    if (isStandardOrigin) {
      console.log('[CORS] ✓ Allowing standard origin:', normalizedOrigin);
      return callback(null, normalizedOrigin);
    }

    // Dynamic check for custom domains
    // Extract hostname: https://www.example.com -> www.example.com
    const hostname = normalizedOrigin.replace(/^https?:\/\//, '').split(':')[0];

    // We need to use req-less database check here
    Client.findOne({
      $or: [
        { customDomain: hostname },
        { customDomain: hostname.replace(/^www\./, '') } // Check without www too
      ]
    }).then(tenant => {
      if (tenant) {
        console.log(`[CORS] ✓ Allowing custom domain origin: ${normalizedOrigin} (Store: ${tenant.name})`);
        callback(null, normalizedOrigin);
      } else {
        console.log('[CORS] ✗ BLOCKED origin (no tenant found):', normalizedOrigin);
        callback(new Error(`Not allowed by CORS: ${normalizedOrigin}`));
      }
    }).catch(err => {
      console.error('[CORS] DB Error during origin check:', err);
      callback(null, false); // Block on DB error for safety
    });
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
  // Check for forwarded host from proxy first (for subdomain support with changeOrigin: true)
  const rawHost = req.headers['x-forwarded-host'] || req.headers['x-original-host'] || req.hostname;
  // Remove port if present
  const host = rawHost.split(':')[0];
  const headerSubdomain = req.headers['x-subdomain'];

  console.log(`[Tenant] Processing request: ${req.method} ${req.path}`);
  console.log(`[Tenant] Host: ${host}, x-subdomain header: ${headerSubdomain || 'none'}`);

  // 1. Try x-subdomain header first (sent from frontend for custom domains/subdomains)
  if (headerSubdomain) {
    try {
      let query;
      // If the header looks like a domain (has dots), query by customDomain
      if (headerSubdomain.includes('.')) {
        console.log(`[Tenant] Searching by customDomain: ${headerSubdomain}`);
        query = {
          $or: [
            { customDomain: headerSubdomain },
            { customDomain: headerSubdomain.replace(/^www\./, '') }, // Try without www
            { customDomain: 'www.' + headerSubdomain } // Try with www
          ]
        };
      } else {
        console.log(`[Tenant] Searching by subdomain: ${headerSubdomain}`);
        query = { subdomain: headerSubdomain };
      }

      const tenantClient = await Client.findOne(query);
      if (tenantClient) {
        req.tenantClient = tenantClient;
        console.log(`[Tenant] ✅ Found tenant via x-subdomain header: ${tenantClient.name} (ID: ${tenantClient._id})`);
        return next();
      } else {
        console.log(`[Tenant] ⚠️ No tenant found for x-subdomain: ${headerSubdomain}`);
      }
    } catch (err) {
      console.error('[Tenant] Error during x-subdomain lookup:', err);
    }
  }

  // 2. Check if this is a custom domain (not our main domains)
  const isMainDomain = host === 'nepostore.xyz' ||
    host === 'www.nepostore.xyz' ||
    host === 'app.nepostore.xyz' ||
    host === 'localhost' ||
    host.endsWith('.localhost');

  if (!isMainDomain) {
    try {
      console.log(`[Tenant] Searching by customDomain (host): ${host}`);
      const query = {
        $or: [
          { customDomain: host },
          { customDomain: host.replace(/^www\./, '') }, // Try without www
          { customDomain: 'www.' + host } // Try with www
        ]
      };

      const tenantClient = await Client.findOne(query);
      if (tenantClient) {
        req.tenantClient = tenantClient;
        console.log(`[Tenant] ✅ Found tenant via custom domain: ${tenantClient.name} (ID: ${tenantClient._id})`);
        return next();
      } else {
        console.log(`[Tenant] ⚠️ No tenant found for custom domain: ${host}`);
      }
    } catch (err) {
      console.error('[Tenant] Custom domain lookup error:', err);
    }
  }

  // 3. Fallback to Subdomain logic (for *.localhost and *.nepostore.xyz)
  const parts = host.split('.');
  let subdomain = null;

  if (host.endsWith('.localhost')) {
    subdomain = parts[0];
    console.log(`[Tenant] Detected .localhost subdomain: ${subdomain}`);
  } else if (host.endsWith('.nepostore.xyz')) {
    subdomain = parts[0];
    console.log(`[Tenant] Detected .nepostore.xyz subdomain: ${subdomain}`);
  }

  // Skip app subdomain (that's the dashboard)
  if (subdomain === 'app' || subdomain === 'www' || subdomain === 'api') {
    console.log(`[Tenant] Skipping reserved subdomain: ${subdomain}`);
    return next();
  }

  if (subdomain) {
    try {
      console.log(`[Tenant] Searching by subdomain: ${subdomain}`);
      const tenantClient = await Client.findOne({ subdomain });
      if (tenantClient) {
        req.tenantClient = tenantClient;
        console.log(`[Tenant] ✅ Found tenant via subdomain: ${tenantClient.name} (ID: ${tenantClient._id})`);
      } else {
        console.log(`[Tenant] ⚠️ No tenant found for subdomain: ${subdomain}`);
      }
    } catch (err) {
      console.error('[Tenant] Subdomain lookup error:', err);
    }
  }

  if (!req.tenantClient) {
    console.log(`[Tenant] ❌ No tenant identified for this request`);
  }

  next();
};

// Use the subdomain handler for all incoming requests
app.use(subdomainHandler);

// Middleware to redirect subdomain to custom domain if configured
app.use((req, res, next) => {
  // Only redirect on production (nepostore.xyz domain)
  const host = req.hostname;

  // Check if this is a nepostore.xyz subdomain (not app, www, or api)
  if (host.endsWith('.nepostore.xyz')) {
    const subdomain = host.split('.')[0];

    // Skip reserved subdomains
    if (subdomain === 'app' || subdomain === 'www' || subdomain === 'api') {
      return next();
    }

    // Check if tenant has a custom domain configured
    if (req.tenantClient && req.tenantClient.customDomain) {
      const customDomain = req.tenantClient.customDomain;
      const protocol = req.protocol || 'https';
      const redirectUrl = `${protocol}://${customDomain}${req.originalUrl}`;

      console.log(`[Redirect] Redirecting ${host} → ${customDomain}`);
      return res.redirect(301, redirectUrl); // 301 = Permanent redirect
    }
  }

  next();
});

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
app.use('/api/templates', require('./routes/templates')); // <--- added
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/analytics', require('./routes/analytics'));

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

      // Cleanup Category name index
      try {
        const catIndexes = await Category.collection.indexes();
        if (catIndexes.find(i => i.name === 'name_1')) {
          console.log('🗑️ Found legacy unique index "name_1" on categories. Dropping...');
          await Category.collection.dropIndex('name_1');
          console.log('✅ Dropped index: name_1');
        }
      } catch (e) { console.log('Category index cleanup info:', e.message); }

      // Cleanup Product sku index
      try {
        const prodIndexes = await Product.collection.indexes();
        if (prodIndexes.find(i => i.name === 'sku_1')) {
          console.log('🗑️ Found legacy unique index "sku_1" on products. Dropping...');
          await Product.collection.dropIndex('sku_1');
          console.log('✅ Dropped index: sku_1');
        }
      } catch (e) { console.log('Product index cleanup info:', e.message); }
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
