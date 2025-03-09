import { useState } from "react";
import { Input, Button, Card } from "antd";

interface StoryInputProps {
  onStart: (story: string) => void;
}

const StoryInput: React.FC<StoryInputProps> = ({ onStart }) => {
  const [story, setStory] = useState("");

  return (
    <Card title="Character Voices" style={{ margin: "auto" }}>
      <Input.TextArea
        placeholder="Input story..."
        rows={5}
        value={story}
        onChange={(e) => setStory(e.target.value)}
      />
      <Button
        type="primary"
        style={{ marginTop: 16, width: "100%" }}
        onClick={() => onStart(story)}
        disabled={!story.trim()}
      >
        Begin
      </Button>
    </Card>
  );
};

export default StoryInput;
