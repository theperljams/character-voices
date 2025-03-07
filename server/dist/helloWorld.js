import express from 'express';
import { ElevenLabsClient } from "elevenlabs";
import dotenv from 'dotenv';
dotenv.config();
const app = express();
const port = 3000; // Or any other port you prefer
// Middleware to parse JSON request bodies
app.use(express.json());
app.post('/generate-previews', async (req, res) => {
    const apiKey = process.env.ELEVEN_LABS_API_KEY;
    const voiceDescription = req.body.voiceDescription;
    const text = req.body.text;
    if (!apiKey) {
        return res.status(500).send('API key not found in environment variables.');
    }
    if (!voiceDescription || !text) {
        return res.status(400).send('Missing voiceDescription or text in request body.');
    }
    try {
        const client = new ElevenLabsClient({ apiKey: apiKey });
        // Use the createPreviews endpoint
        const response = await client.textToVoice.createPreviews({
            voice_description: voiceDescription,
            text: text,
        });
        console.log("Previews Response:", JSON.stringify(response, null, 2));
        res.json(response); // Send the response back to the client
    }
    catch (error) {
        console.error("Error generating previews:", error);
        res.status(500).send(`Error generating previews: ${error}`);
    }
});
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
//# sourceMappingURL=helloWorld.js.map