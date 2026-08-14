import express from "express";
import bcrypt from "bcryptjs";
import passport from "../config/passport.js";
import User from "../models/user.js";

const router = express.Router();


// =========================================
// REGISTER
// =========================================

router.post("/register", async (req, res) => {

    try {

        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                error: "All fields are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: "Password must be at least 6 characters"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                error: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(
            password,
            12
        );

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword
        });

        res.status(201).json({
            message: "User registered successfully"
        });

    } catch (error) {

        console.error("Register Error:", error);

        res.status(500).json({
            error: "Registration failed"
        });

    }
});


// =========================================
// LOGIN
// =========================================

router.post(
    "/login",

    passport.authenticate("local"),

    (req, res) => {

        res.json({
            message: "Login successful",

            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email
            }
        });

    }
);


// =========================================
// CURRENT USER
// =========================================

router.get("/me", (req, res) => {

    if (!req.isAuthenticated()) {

        return res.status(401).json({
            error: "Not authenticated"
        });

    }

    res.json({
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email
        }
    });

});


// =========================================
// LOGOUT
// =========================================

router.post("/logout", (req, res, next) => {

    req.logout((error) => {

        if (error) {
            return next(error);
        }

        res.json({
            message: "Logged out successfully"
        });

    });

});

router.post("/logout", (req, res, next) => {

    req.logout((err) => {

        if (err) {
            return next(err);
        }

        req.session.destroy((err) => {

            if (err) {
                return res.status(500).json({
                    error: "Failed to logout"
                });
            }

            res.clearCookie("connect.sid");

            res.json({
                message: "Logout successful"
            });

        });

    });

});

export default router;