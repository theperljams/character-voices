import { useState } from "react";
// import "./App.css";
import VoiceAssignment from "./assets/VoiceAssignment";
import StoryInput from "./assets/StoryInput";

function App() {
  const [story, setStory] = useState("");

  // function playBase64Audio(base64String: string) {
  //   const audio = new Audio(`data:audio/mp3;base64,${base64String}`);
  //   audio.play().catch((error) => console.error("Error playing audio:", error));
  // }

  // function play() {
  //   playBase64Audio("the base64 string");
  // }

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {story ? (
        <VoiceAssignment
          story={story}
          onGenerate={() => alert("Generating audio...")}
        />
      ) : (
        <StoryInput onStart={setStory} />
      )}
    </div>
  );
}

export default App;
