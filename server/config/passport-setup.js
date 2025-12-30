const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
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
        // If user does not exist, you need to decide how to handle it.
        // For a premium service, you would typically look up the user's email 
        // to see if they have an active subscription.

        // For now, let's assume we can't find a matching client and return an error.
        // We will implement the subscription check later.
        console.log(`User with email ${profile.emails[0].value} tried to log in but has no associated client account.`);
        return done(null, false, { message: 'This Google account is not associated with a premium plan.' });
      }
    } catch (err) {
      console.error(err);
      return done(err, false);
    }
  }
));

// These functions are needed for session management, which we'll set up next
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
