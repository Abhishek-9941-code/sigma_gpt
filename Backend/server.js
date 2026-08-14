import express from "express";
import "dotenv/config";
import cors from "cors";
import mongoose from "mongoose";

import session from "express-session";
import passport from "./config/passport.js";

import chatRoutes from "./routes/chat.js";
import authRoutes from "./routes/auth.js";

const app = express();
const PORT = 8080;


// ===============================
// BODY PARSER
// ===============================

app.use(express.json());


// ===============================
// CORS


app.use(
    cors({
        origin: [
            "http://127.0.0.1:5500",
            "https://sigma-gpt-livid.vercel.app"
        ],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);


// ===============================
// SESSION
// ===============================

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,

        cookie: {
            httpOnly: true,
            secure: false,
            sameSite: "none",
            maxAge: 1000 * 60 * 60 * 24
        }
    })
);


// ===============================
// PASSPORT
// ===============================

app.use(passport.initialize());
app.use(passport.session());


// ===============================
// ROUTES
// ===============================

app.use("/api/auth", authRoutes);
app.use("/api", chatRoutes);


// ===============================
// DATABASE
// ===============================

const connectDB = async () => {

    try {

        await mongoose.connect(
            process.env.MONGODB_URI
        );
        console.log(process.env.MONGODB_URI)
        console.log("Connected with Database!");

        app.listen(PORT, () => {
            console.log(`server running on ${PORT}`);
        });

    } catch (err) {

        console.log(
            "Failed to connect with DB:",
            err
        );

    }
};

connectDB();