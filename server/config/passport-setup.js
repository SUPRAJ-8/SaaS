const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: (process.env.BACKEND_URL || 'http://localhost:5002') + '/auth/google/callback'
},

  async (accessToken, refreshToken, profile, done) => {
    // This function is called when a user successfully authenticates with Google
    try {
      // Check if user already exists in your DB
      let user = await User.findOne({ googleId: profile.id });

      if (user) {
        // If user exists, pass the user object to the next step
        return done(null, user);
      } else {
        // AUTO-REGISTRATION: Create a new Client and User for new signups
        const Client = require('../models/Client');

        // Generate subdomain from store name
        const storeName = `${profile.displayName}'s Store`;
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

        // 1. Create a new Client (The Organization/Tenant)
        const newClient = new Client({
          name: storeName,
          ownerEmail: profile.emails[0].value,
          subdomain: subdomain,
          subscriptionPlan: 'free',
          subscriptionStatus: 'trialing'
        });

        const savedClient = await newClient.save();

        // 2. Create the User (linked to the new Client)
        const newUser = new User({
          clientId: savedClient._id,
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value
        });

        const savedUser = await newUser.save();
        return done(null, savedUser);
      }
    } catch (err) {
      console.error(err);
      return done(err, false);
    }
  }
));

// These functions are needed for session management
passport.serializeUser((user, done) => {
  console.log('🔐 Serializing user:', user._id);
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  console.log('🔓 Deserializing user ID:', id);
  try {
    const user = await User.findById(id);
    console.log('✅ User found:', user ? user.email : 'Not found');
    done(null, user);
  } catch (err) {
    console.error('❌ Deserialize error:', err);
    done(err, null);
  }
});
