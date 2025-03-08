import express from "express";
import { ElevenLabsClient } from "elevenlabs";
import dotenv from "dotenv";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

dotenv.config();

const app = express();
const port = 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

app.post("/generate-previews", async (req, res) => {
  try {
    const apiKey = process.env.ELEVEN_LABS_API_KEY;
    const voiceDescription = req.body.voiceDescription;
    const text = req.body.text;

    if (!apiKey) {
      res.status(500).send("API key not found in environment variables.");
    }

    if (!voiceDescription || !text) {
      res.status(400).send("Missing voiceDescription or text in request body.");
    }

    const client = new ElevenLabsClient({ apiKey: apiKey });

    // const voices = await client.voices.getAll({});

    // Use the createPreviews endpoint
    const response = await client.textToVoice.createPreviews({
      voice_description: voiceDescription,
      text: text,
    });

    console.log("Previews Response:", JSON.stringify(response));
    res.json(response);
  } catch (error) {
    console.error("Error generating previews:", error);
    res.status(500).send(`Error generating previews: ${error}`);
  }
});

app.post("/create-voice-from-preview", async (req, res) => {
  try {
    const apiKey = process.env.ELEVEN_LABS_API_KEY;
    const voiceName = req.body.voiceName;
    const voiceDescription = req.body.voiceDescription;
    const generatedVoiceId = req.body.generatedVoiceId;

    if (!apiKey) {
      res.status(500).send("API key not found in environment variables.");
      return;
    }

    if (!voiceName || !voiceDescription || !generatedVoiceId) {
      res
        .status(400)
        .send(
          "Missing voiceName, voiceDescription, or generatedVoiceId in request body."
        );
      return;
    }

    const client = new ElevenLabsClient({ apiKey: apiKey });

    const response = await client.textToVoice.createVoiceFromPreview({
      voice_name: voiceName,
      voice_description: voiceDescription,
      generated_voice_id: generatedVoiceId,
    });

    console.log("Create Voice Response:", JSON.stringify(response));
    res.json(response);
  } catch (error) {
    console.error("Error creating voice:", error);
    res.status(500).send(`Error creating voice: ${error}`);
  }
});

app.post("/openai-json", async (req, res) => {
  try {
    const openai = new OpenAI();

    const NounList = z.object({
      nouns: z.array(z.object({ value: z.string() })),
    });

    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        { role: "system", content: "List the nouns in the following content" },
        {
          role: "user",
          content: "Alice and Bob are going to a science fair on Friday.",
        },
      ],
      response_format: zodResponseFormat(NounList, "noun_list"),
    });

    const list = completion.choices[0].message.parsed;
    res.send(list);
  } catch (error) {
    console.error("Error generating response:", error);
    res.status(500).send(`Error generating response: ${error}`);
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
