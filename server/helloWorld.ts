import express from "express";
import { ElevenLabsClient } from "elevenlabs";
import dotenv from "dotenv";
import OpenAI from "openai";
import cors from "cors";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const port = 3000;

// Middleware to parse JSON request bodies
app.use(express.json());
app.use(cors());

// Function to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const savedVoiceIds: string[] = []; // Array to store saved voice IDs

app.post("/generate-previews", async (req, res) => {
  try {
    const apiKey = process.env.ELEVEN_LABS_API_KEY;
    const voiceDescription = req.body.voiceDescription;
    const text = req.body.text;

    if (!apiKey) {
      res.status(500).send("API key not found in environment variables.");
      return;
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

app.post("/generate-and-create-voice", async (req, res) => {
  try {
    const apiKey = process.env.ELEVEN_LABS_API_KEY;
    const voiceName = req.body.voiceName;
    const voiceDescription = req.body.voiceDescription;
    const text = req.body.text;

    if (!apiKey) {
      res.status(500).send("API key not found in environment variables.");
      return;
    }

    if (!voiceName || !voiceDescription || !text) {
      res
        .status(400)
        .send(
          "Missing voiceName, voiceDescription, or text in request body."
        );
      return;
    }

    const client = new ElevenLabsClient({ apiKey: apiKey });

    // Generate voice previews
    const previewsResponse = await client.textToVoice.createPreviews({
      voice_description: voiceDescription,
      text: text,
    });

    console.log("Previews Response:", JSON.stringify(previewsResponse));

    if (!previewsResponse || !previewsResponse.previews || previewsResponse.previews.length === 0 || !previewsResponse.previews[0].generated_voice_id) {
      res
        .status(500)
        .send("Failed to generate voice previews or missing generated_voice_id.");
      return;
    }

    // Create voice from preview
    const createVoiceResponse = await client.textToVoice.createVoiceFromPreview({
      voice_name: voiceName,
      voice_description: voiceDescription,
      generated_voice_id: previewsResponse.previews[0].generated_voice_id,
    });

    console.log("Create Voice Response:", JSON.stringify(createVoiceResponse));

    if (!createVoiceResponse || !createVoiceResponse.voice_id) {
      res.status(500).send("Failed to create voice or missing voice_id.");
      return;
    }

    savedVoiceIds.push(createVoiceResponse.voice_id); // Store the voice ID

    res.json({
      message: "Voice generated and created successfully!",
      voiceId: createVoiceResponse.voice_id,
      savedVoiceIds: savedVoiceIds, // Return the list of saved voice IDs
    });
  } catch (error) {
    console.error("Error generating and creating voice:", error);
    res
      .status(500)
      .send(`Error generating and creating voice: ${error}`);
  }
});

app.post("/edit-voice", async (req, res) => {
  try {
    const apiKey = process.env.ELEVEN_LABS_API_KEY;
    const voiceId = req.body.voiceId;
    const voiceName = req.body.voiceName;
    const voiceDescription = req.body.voiceDescription;
    const text = "Get on my level, noob! Seriously, are you even trying? This is a longer text to meet the minimum length requirement. We need at least 100 characters, so I'm adding more to ensure it's sufficient.";

    if (!apiKey) {
      res.status(500).send("API key not found in environment variables.");
      return;
    }

    if (!voiceId || !voiceName || !voiceDescription) {
      res
        .status(400)
        .send(
          "Missing voiceId, voiceName, or voiceDescription in request body."
        );
      return;
    }

    const client = new ElevenLabsClient({ apiKey: apiKey });

    // Delete the existing voice
    try {
      await client.voices.delete(voiceId);
      console.log(`Voice with ID ${voiceId} deleted successfully.`);

      // Remove the voice ID from the savedVoiceIds array
      const index = savedVoiceIds.indexOf(voiceId);
      if (index > -1) {
        savedVoiceIds.splice(index, 1);
      }
    } catch (deleteError) {
      console.error(`Error deleting voice with ID ${voiceId}:`, deleteError);
      res
        .status(500)
        .send(`Error deleting voice with ID ${voiceId}: ${deleteError}`);
      return;
    }

    // Generate voice previews
    const previewsResponse = await client.textToVoice.createPreviews({
      voice_description: voiceDescription,
      text: text,
    });

    console.log("Previews Response:", JSON.stringify(previewsResponse));

    if (!previewsResponse || !previewsResponse.previews || previewsResponse.previews.length === 0 || !previewsResponse.previews[0].generated_voice_id) {
      res
        .status(500)
        .send("Failed to generate voice previews or missing generated_voice_id.");
      return;
    }

    // Create voice from preview
    const createVoiceResponse = await client.textToVoice.createVoiceFromPreview({
      voice_name: voiceName,
      voice_description: voiceDescription,
      generated_voice_id: previewsResponse.previews[0].generated_voice_id,
    });

    console.log("Create Voice Response:", JSON.stringify(createVoiceResponse));

    if (!createVoiceResponse || !createVoiceResponse.voice_id) {
      res.status(500).send("Failed to create voice or missing voice_id.");
      return;
    }

    savedVoiceIds.push(createVoiceResponse.voice_id); // Store the new voice ID

    res.json({
      message: "Voice edited successfully!",
      oldVoiceId: voiceId,
      newVoiceId: createVoiceResponse.voice_id,
      savedVoiceIds: savedVoiceIds, // Return the list of saved voice IDs
    });
  } catch (error) {
    console.error("Error editing voice:", error);
    res.status(500).send(`Error editing voice: ${error}`);
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

app.post("/analyze-image", async (req, res) => {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      res
        .status(500)
        .json({ error: "OPENAI_API_KEY not found in environment variables." });
    }

    const openai = new OpenAI({ apiKey: openaiApiKey });

    // Function to encode the image
    const encodeImage = (imagePath: string) => {
      try {
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString("base64");
        return base64Image;
      } catch (error) {
        console.error("Error encoding image:", error);
        throw new Error(`Error encoding image: ${error}`); // Re-throw to be caught by the main catch block
      }
    };

    // Path to your image
    const imagePath = "/home/pearlhulbert/character-voices/server/Yumi-Painter.png"; // Hardcoded path

    // Check if the file exists
    if (!fs.existsSync(imagePath)) {
      res.status(400).json({ error: "Image file not found." });
    }

    // Getting the Base64 string
    let base64Image: string = "";
    try {
      base64Image = encodeImage(imagePath);
    } catch (encodingError: any) {
      res.status(500).json({ error: encodingError.message });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          "role": "user",
          "content": [
            {
              "type": "text",
              "text": "What is in this image?",
            },
            {
              "type": "image_url",
              "image_url": {
                "url": `data:image/png;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    res.json({ analysis: response.choices[0].message.content });
  } catch (error) {
    console.error("Error analyzing image:", error);
    res.status(500).json({ error: `Error analyzing image: ${error}` });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
