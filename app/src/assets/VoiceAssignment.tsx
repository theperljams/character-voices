import { useState } from "react";
import { Card, Button, Select } from "antd";

interface VoiceAssignmentProps {
  story: string;
  onGenerate: () => void;
}

const sampleVoices = ["Voice A", "Voice B", "Voice C"];

const parseStory = (story: string) => {
  const lines = story.split("\n").filter((line) => line.trim() !== "");
  return lines.map((line, index) => {
    const parts = line.split(":");
    return {
      id: index,
      character: parts[0].trim(),
      text: parts.slice(1).join(":").trim(),
    };
  });
};

const VoiceAssignment: React.FC<VoiceAssignmentProps> = ({
  story,
  onGenerate,
}) => {
  const parsedStory = parseStory(story);
  const [voiceMap, setVoiceMap] = useState<{ [key: string]: string }>({});

  return (
    <Card title="Assign Voices" style={{}}>
      {parsedStory.map(({ id, character, text }) => (
        <div
          key={id}
          style={{ display: "flex", alignItems: "center" }}
        >
          <span style={{ flex: 1 }}>
            <strong>{character}:</strong> {text}
          </span>
          <Select
            placeholder="Select voice"
            style={{ width: 120 }}
            onChange={(value) =>
              setVoiceMap({ ...voiceMap, [character]: value })
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
