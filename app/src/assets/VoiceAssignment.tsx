import { useState, useEffect } from "react";
import { Card, Button, Select, Spin, Alert } from "antd";

interface VoiceAssignmentProps {
  story: string;
  onGenerate: () => void;
}

const sampleVoices = ["Voice A", "Voice B", "Voice C"];

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

const VoiceAssignment: React.FC<VoiceAssignmentProps> = ({
  story,
  onGenerate,
}) => {
  const [parsedStory, setParsedStory] = useState<StoryLine[]>([]);
  const [voiceMap, setVoiceMap] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Fetching story data...");
    setLoading(true);
    fetchStoryData(story)
      .then((data) => {
        if (data) {
          setParsedStory(data);
          const uniqueCharacters = Array.from(
            new Set(data.map((line: StoryLine) => line.character))
          );
          setVoiceMap(
            Object.fromEntries(uniqueCharacters.map((char) => [char, ""]))
          );
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

  return (
    <Card title="Assign Voices" style={{ maxWidth: 600, margin: "auto" }}>
      {parsedStory.map(({ character, text }, index) => (
        <div
          key={index}
          style={{ display: "flex", alignItems: "center", marginBottom: 8 }}
        >
          <span style={{ flex: 1 }}>
            <strong>{character}:</strong> {text}
          </span>
          <Select
            placeholder="Select voice"
            style={{ width: 120 }}
            onChange={(value) =>
              setVoiceMap((prev) => ({ ...prev, [character]: value }))
            }
            value={voiceMap[character]}
            options={sampleVoices.map((voice) => ({
              label: voice,
              value: voice,
            }))}
          />
        </div>
      ))}
      <Button
        type="primary"
        style={{ marginTop: 16, width: "100%" }}
        onClick={onGenerate}
      >
        Generate
      </Button>
    </Card>
  );
};

export default VoiceAssignment;
