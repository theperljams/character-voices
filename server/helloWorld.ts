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
    res.send({
      lines: [
        {
          character: "Character 1",
          text: "You asked if I’m a great warrior. Are you needing me to fight something, then?",
        },
        {
          character: "Character 2",
          text: "I don’t think it will require that. I don’t know, honestly. The spirits will need to be formed, and then asked. They said they’re trapped somehow; perhaps you can rescue them?",
        },
        {
          character: "Character 1",
          text: "By forming them? Does this require painting?",
        },
        {
          character: "Character 2",
          text: "Painting? We call them. Through art.",
        },
        {
          character: "Narrator",
          text: "Through art. Right. Okay. That he could do. Maybe even something other than bamboo. Was it true—had he been summoned to an entirely different world simply to . . . to paint? He should probably make sure, he thought. He looked to the girl to explain more, but . . . She was just so hopeful. Emotions flowed inside him like blood from wounds, warm and sharp. How long had it been since he’d felt needed, wanted? He didn’t mean to lie. He wasn’t really lying, was he? Her spirits had chosen him, brought him here, perhaps to paint them.",
        },
        {
          character: "Narrator",
          text: "In that moment, he wanted so badly to be the hero someone needed. To have a chance to make up for the mistakes of his past. To become something. It wasn’t arrogance, as some of you might assume. It was more desperation.",
        },
        {
          character: "Narrator",
          text: "Deep down, Painter saw himself as a ruined canvas—the painting spoiled by spilled ink, then tossed into the trash. This was his chance to spread himself out and start a new drawing on the back. He seized that opportunity like a ravenous man at his first bowl of rice in days.",
        },
      ],
    });

    // return;

    const story = req.body.story;
    const openai = new OpenAI();

    const StoryLines = z.object({
      lines: z.array(z.object({ character: z.string(), text: z.string() })),
    });

    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        {
          role: "system",
          content: `The following content contains a story. Parse out the story to list the speakers line by line. Keep the story the exact same, but create a list of lines and which character is saying that line. If no particular character is saying that line, put the character as "Narrator". If you don't know the character's names, you may label them "Character 1, Character 2, etc. If the same character/narrator says multiple lines in a row, combine it into one item with a longer "text" section. There should never be two text items in a row with the same character.`,
        },
        {
          role: "user",
          content: story,
        },
      ],
      response_format: zodResponseFormat(StoryLines, "story_lines"),
    });

    const list = completion.choices[0].message.parsed;
    console.log(list?.lines);
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

    const openai = new OpenAI();
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

// app.post("/chat-with-local-pdf", async (req, res) => {
//   try {
//     const openaiApiKey = process.env.OPENAI_API_KEY;
//     if (!openaiApiKey) {
//       res
//         .status(500)
//         .json({ error: "OPENAI_API_KEY not found in environment variables." });
//     }
//     const openai = new OpenAI({ apiKey: openaiApiKey });

//     const __filename = fileURLToPath(import.meta.url);
//     const __dirname = path.dirname(__filename);
//     const pdfFilePath = path.join(__dirname, "Yumi-Painter-Dialogue.pdf"); // Path to your PDF

//     // Check if the file exists
//     if (!fs.existsSync(pdfFilePath)) {
//       res.status(400).json({ error: "PDF file not found." });
//     }

//     let pdfText;
//     try {
//       const pdfBuffer = fs.readFileSync(pdfFilePath);
//       const pdfData = await PdfParse(pdfBuffer);
//         pdfText = pdfData.text;
//     } catch (pdfError) {
//       console.error("Error parsing PDF:", pdfError);
//       res.status(500).json({ error: `Error parsing PDF: ${pdfError}` });
//     }

//     console.log("PDF Text:", pdfText);

//     // Create a chat completion request to OpenAI
//     try {
//       const response = await openai.chat.completions.create({
//         model: "gpt-4o-2024-05-13",
//         messages: [
//           {
//             role: "system",
//             content: "You are an AI assistant that summarizes documents.",
//           },
//           {
//             role: "user",
//             content: `Summarize the following document: ${pdfText}`,
//           },
//         ],
//         max_tokens: 500,
//       });

//       res.json({ summary: response.choices[0].message.content });
//     } catch (openaiError) {
//       console.error("Error during OpenAI completion:", openaiError);
//       res
//         .status(500)
//         .json({ error: `Error during OpenAI completion: ${openaiError}` });
//     }
//   } catch (error) {
//     console.error("Error processing PDF:", error);
//     res.status(500).json({ error: `Error processing PDF: ${error}` });
//   }
// });


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
