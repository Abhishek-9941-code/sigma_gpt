import "dotenv/config";
import { getData } from "./utils/geminiAPI.js";

const test = async () => {
    try {
        const result = await getData("Hello Gemini, tell me a short joke");
        console.log("Gemini Response:");
        console.log(result);
    } catch (error) {
        console.error("Gemini API Error:");
        console.error(error);
    }
};

test();