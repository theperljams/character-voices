import { useState } from "react";
import { Input, Button, Card, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";

interface StoryInputProps {
  onStart: (story: string) => void;
}

const StoryInput: React.FC<StoryInputProps> = ({ onStart }) => {
  const [story, setStory] = useState("");

  const handleUpload = () => {
    // const reader = new FileReader();
    // reader.onload = (e) => {
    //   if (e.target?.result) {
    //     setStory(e.target.result as string);
    //   }
    // };
    // reader.readAsText(file);
    return false; // Prevents automatic upload
  };

  return (
    <Card title="Character Voices" style={{ maxWidth: 600, margin: "auto" }}>
      <Input.TextArea
        placeholder="Input story..."
        rows={5}
        value={story}
        onChange={(e) => setStory(e.target.value)}
      />
      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <Upload
          beforeUpload={handleUpload}
          accept=".png,.jpg,.jpeg,.gif,.bmp"
          // showUploadList={false}
        >
          <Button icon={<UploadOutlined />}>Upload Story</Button>
        </Upload>
        <Button
          type="primary"
          style={{ flex: 1 }}
          onClick={() => onStart(story)}
          disabled={!story.trim()}
        >
          Begin
        </Button>
      </div>
    </Card>
  );
};

export default StoryInput;
