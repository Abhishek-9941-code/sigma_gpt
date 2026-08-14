import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";

import User from "../models/user.js";


// =========================================
// LOCAL STRATEGY
// =========================================

passport.use(
    new LocalStrategy(
        {
            usernameField: "email",
            passwordField: "password"
        },

        async (email, password, done) => {

            try {

                // Find user by email
                const user = await User.findOne({
                    email: email.toLowerCase()
                });

                // User doesn't exist
                if (!user) {

                    return done(null, false, {
                        message: "Invalid email or password"
                    });

                }


                // Compare password
                const isMatch = await bcrypt.compare(
                    password,
                    user.password
                );


                // Password doesn't match
                if (!isMatch) {

                    return done(null, false, {
                        message: "Invalid email or password"
                    });

                }


                // Authentication successful
                return done(null, user);

            } catch (error) {

                return done(error);

            }

        }
    )
);


// =========================================
// SERIALIZE USER
// =========================================

passport.serializeUser((user, done) => {

    done(null, user.id);

});


// =========================================
// DESERIALIZE USER
// =========================================

passport.deserializeUser(async (id, done) => {

    try {

        const user = await User.findById(id);

        done(null, user);

    } catch (error) {

        done(error);

    }

});


export default passport;