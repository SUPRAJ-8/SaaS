require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

const app = express();

// Init Middleware
app.use(cors());
app.use(express.json({ extended: false }));
app.use('/uploads', express.static('uploads'));

const cookieSession = require('cookie-session');
const passport = require('passport');
require('./config/passport-setup'); // Executes the passport setup

// Session and Passport Middleware
app.use(
  cookieSession({
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    keys: [process.env.COOKIE_KEY], // Secret key for signing the cookie
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Middleware to handle subdomain routing
const subdomainHandler = (req, res, next) => {
  const host = req.hostname;
  const subdomain = host.split('.')[0];

  // Check if it's a client subdomain and not a request for the main app/API
  if (subdomain && subdomain !== 'localhost' && subdomain !== 'www' && subdomain !== 'api') {
    // If it's a client subdomain, let the websites router handle it
    require('./routes/websites')(req, res, next);
  } else {
    // Otherwise, continue to the main API routes
    next();
  }
};

// Use the subdomain handler for all incoming requests
// app.use(subdomainHandler);

app.get('/', (req, res) => {
  res.send('API for Nepali CMS is running...');
});

// Define API Routes
app.use('/auth', require('./routes/google-auth'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/pages', require('./routes/pages'));
// We will create the API for managing websites later
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/seeder', require('./routes/seeder'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/upload', require('./routes/upload'));

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
