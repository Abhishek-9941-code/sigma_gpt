import express from "express";
import Thread from "../models/Threads.js";
import isAuthenticated from "../middleware/auth.js";
import { getData } from "../utils/geminiAPI.js";

const router = express.Router();

//test
router.post("/test", async(req, res) => {
    try {
        const thread = new Thread({
            threadId: "abc",
            title: "Testing New Thread2"
        });

        const response = await thread.save();
        res.send(response);
    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to save in DB"});
    }
});

//Get all threads
router.get("/thread",isAuthenticated, async(req, res) => {
    try {
        const threads = await Thread.find({
    userId: req.user._id
}).sort({
    updatedAt: -1
});
        //descending order of updatedAt...most recent data on top
        res.json(threads);
    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to fetch threads"});
    }
});

router.get("/thread/:threadId", isAuthenticated,async(req, res) => {
    const {threadId} = req.params;

    try {
        const thread = await Thread.findOne({
    threadId,
    userId: req.user._id
});

        if(!thread) {
            return res.status(404).json({error: "Thread not found"});
        }

        res.json(thread.messages);
    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to fetch chat"});
    }
});

router.delete("/thread/:threadId", isAuthenticated, async (req, res) => {
    const {threadId} = req.params;

    try {
        const deletedThread = await Thread.findOneAndDelete({
    threadId,
    userId: req.user._id
});

        if(!deletedThread) {
            return res.status(404).json({error: "Thread not found"});
        }

        res.status(200).json({success : "Thread deleted successfully"});

    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to delete thread"});
    }
});


router.post("/chat",isAuthenticated, async (req, res) => {

    const { threadId, message } = req.body;


    // ===============================
    // VALIDATION
    // ===============================

    if (!threadId || !message) {

        return res.status(400).json({
            error: "Missing required fields"
        });

    }


    try {

        // ===============================
        // FIND THREAD
        // ===============================

      let thread = await Thread.findOne({
    threadId,
    userId: req.user._id
});


        // ===============================
        // CREATE NEW THREAD
        // ===============================

        if (!thread) {

            thread = new Thread({

                threadId,
                userId: req.user._id,
                title: message,

                messages: [
                    {
                        role: "user",
                        content: message
                    }
                ]

            });

        }

        // ===============================
        // EXISTING THREAD
        // ===============================

        else {

            thread.messages.push({

                role: "user",

                content: message

            });

        }


        // ===============================
        // SEND COMPLETE CONVERSATION
        // TO GEMINI
        // ===============================

        const assistantReply = await getData(
            thread.messages
        );


        // ===============================
        // SAVE GEMINI RESPONSE
        // ===============================

        thread.messages.push({

            role: "assistant",

            content: assistantReply

        });


        // ===============================
        // UPDATE TIME
        // ===============================

        thread.updatedAt = new Date();


        // ===============================
        // SAVE THREAD
        // ===============================

        await thread.save();


        // ===============================
        // SEND RESPONSE
        // ===============================

        res.json({

            reply: assistantReply

        });


    } catch (err) {

        console.log("Chat Error:", err);

        res.status(500).json({

            error: "Something went wrong"

        });

    }

});


export default router;