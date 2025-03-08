import express from "express";
import { ElevenLabsClient } from "elevenlabs";
import dotenv from "dotenv";
import OpenAI from "openai";
import cors from "cors";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

dotenv.config();

const app = express();
const port = 3000;

// Middleware to parse JSON request bodies
app.use(express.json());
app.use(cors());


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
    // res.send({
    //   nouns: [
    //     {
    //       value: "Alice",
    //     },
    //     {
    //       value: "Bob",
    //     },
    //     {
    //       value: "science",
    //     },
    //     {
    //       value: "fair",
    //     },
    //     {
    //       value: "Friday",
    //     },
    //   ],
    // });

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

app.post("/text-to-speech", async (req, res) => {
  try {
    const apiKey = process.env.ELEVEN_LABS_API_KEY;
    const voiceId = "emOjs6yVnpSwYGjisfVV"; // Replace with the actual mouse voice ID
    const text = req.body.text;
    const modelId = "eleven_multilingual_v2";
    const outputFormat = "mp3_44100_128";

    if (!apiKey) {
      res.status(500).send("API key not found in environment variables.");
      return;
    }

    if (!text) {
      res.status(400).send("Missing text in request body.");
      return;
    }

    const client = new ElevenLabsClient({ apiKey: apiKey });

    const audioStream = await client.textToSpeech.convert(voiceId, {
      output_format: outputFormat,
      text: text,
      model_id: modelId,
    });

    // Set appropriate headers for audio streaming
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Disposition", 'inline; filename="speech.mp3"');

    // Pipe the audio stream directly to the response
    audioStream.pipe(res);

  } catch (error) {
    console.error("Error converting text to speech:", error);
    res.status(500).send(`Error converting text to speech: ${error}`);
  }
});

app.post("/chat-with-local-pdf", async (req, res) => {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return res.status(500).json({ error: "OPENAI_API_KEY not found in environment variables." });
    }

    const openai = new OpenAI({ apiKey: openaiApiKey });

    const pdfFilePath = path.join(__dirname, 'document.pdf'); // Path to your PDF

    // Check if the file exists
    if (!fs.existsSync(pdfFilePath)) {
      return res.status(400).json({ error: "PDF file not found." });
    }

    let pdfText;
    try {
      const pdfBuffer = fs.readFileSync(pdfFilePath);
      const pdfData = await pdfParse(pdfBuffer);
      pdfText = pdfData.text;
    } catch (pdfError) {
      console.error("Error parsing PDF:", pdfError);
      return res.status(500).json({ error: `Error parsing PDF: ${pdfError}` });
    }

    console.log("PDF Text:", pdfText);

    // Create a chat completion request to OpenAI
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-2024-05-13",
        messages: [
          { role: "system", content: "You are an AI assistant that summarizes documents." },
          { role: "user", content: `Summarize the following document: ${pdfText}` },
        ],
        max_tokens: 500,
      });

      res.json({ summary: response.choices[0].message.content });
    } catch (openaiError) {
      console.error("Error during OpenAI completion:", openaiError);
      return res.status(500).json({ error: `Error during OpenAI completion: ${openaiError}` });
    }

  } catch (error) {
    console.error("Error processing PDF:", error);
    res.status(500).json({ error: `Error processing PDF: ${error}` });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
