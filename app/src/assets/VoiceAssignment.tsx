import { useState, useEffect } from "react";
import { Card, Button, Spin, Alert, Input } from "antd";
import AudioPlayer from "./AudioPlayer";

interface VoiceAssignmentProps {
  story: string;
}
interface StoryLine {
  character: string;
  text: string;
}

const fetchStoryData = async (story: string) => {
  try {
    const response = await fetch("http://localhost:3000/openai-json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ story }),
    });
    return ((await response.json()) as { lines: StoryLine[] }).lines;
  } catch (error) {
    console.error("Error fetching story data:", error);
    return null;
  }
};

const VoiceAssignment: React.FC<VoiceAssignmentProps> = ({ story }) => {
  const [parsedStory, setParsedStory] = useState<StoryLine[]>([]);
  const [customNames, setCustomNames] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVoiceInputs, setShowVoiceInputs] = useState(false);

  async function onGenerate() {
    console.log("Generated audio...");
    try {
      const response = await fetch("http://localhost:3000/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: parsedStory }),
      });
      const audioData = await response.json();
      console.log("Audio data:", audioData);
      // return ((await response.json()) as { lines: StoryLine[] }).lines;
    } catch (error) {
      console.error("Error fetching story data:", error);
      return null;
    }
  }

  useEffect(() => {
    console.log("Fetching story data...");
    setLoading(true);
    fetchStoryData(story)
      .then((data) => {
        if (data) {
          setParsedStory(data);
        } else {
          setError("Failed to load story data.");
        }
      })
      .finally(() => setLoading(false));
  }, [story]);

  if (loading)
    return (
      <Spin size="large" style={{ display: "block", margin: "50px auto" }} />
    );
  if (error) return <Alert type="error" message={error} showIcon />;

  const uniqueCharacters = Array.from(
    new Set(parsedStory.map(({ character }) => character))
  );

  return (
    <Card title="View Story" style={{ maxWidth: 800, margin: "auto" }}>
      {/* Story Display */}
      <div style={{ marginBottom: 16 }}>
        {parsedStory.map(({ character, text }, index) => (
          <div key={index} style={{ marginBottom: 8 }}>
            <strong>{character}:</strong> {text}
          </div>
        ))}
      </div>

      {/* Generate Button */}
      {showVoiceInputs && (
        <>
          {/* Voice Inputs */}
          <div style={{ marginTop: 16 }}>
            {uniqueCharacters.map((character) => (
              <div key={character} style={{ marginBottom: 12 }}>
                <strong>{character}</strong>
                <Input
                  placeholder="Voice Description"
                  style={{ marginTop: 4 }}
                  value={customNames[character] || ""}
                  onChange={(e) =>
                    setCustomNames((prev) => ({
                      ...prev,
                      [character]: e.target.value,
                    }))
                  }
                />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Final Submit Button */}
      <Button
        type="primary"
        style={{ marginTop: 16, width: "100%" }}
        onClick={() => {
          setShowVoiceInputs(true);
          onGenerate();
        }}
      >
        Submit Voices
      </Button>
      <AudioPlayer
        audioFiles={[0, 1, 2, 3, 4, 5, 6].map(
          (val) => `./audio/speech_${val}.mp3`
        )}
      />
    </Card>
  );
};

export default VoiceAssignment;
