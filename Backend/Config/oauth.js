require("dotenv").config({ quiet: true });
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../Models/user.Model");
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 1. Check if the user already exists
        const email = profile.emails[0].value;
        // let user = await User.findOne({ googleId: profile.id });

        let user = await User.findOne({ email });
        if (user) {
          return done(null, user);
        }

        // 2. If not, create a new user

        user = new User({
          googleId: profile.id,
          fullName: profile.displayName,
          email: profile.emails[0].value,
          role: "user",
        });

        await user.save();
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);
