
async function getData(messages) {

    const contents = messages.map((message) => ({
        role: message.role === "assistant" ? "model" : "user",

        parts: [
            {
                text: message.content
            }
        ]
    }));


    const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "X-goog-api-key": process.env.GEMINI_API_KEY
            },

            body: JSON.stringify({
                contents: contents
            })
        }
    );


    const data = await res.json();


    if (!res.ok) {

        throw new Error(
            data.error?.message ||
            "Gemini API request failed"
        );

    }


    return data.candidates[0].content.parts[0].text;
}


export { getData };

