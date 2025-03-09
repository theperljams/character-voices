import { Button } from "antd";
import { useState, useRef, useEffect } from "react";

const AudioPlayer = ({ audioFiles }: { audioFiles: string[] }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return;

    // Set up the ended event to play the next file
    const handleEnded = () => {
      if (currentIndex < audioFiles.length - 1) {
        setCurrentIndex((prevIndex) => prevIndex + 1);
      } else {
        // Reset when all files have been played
        setIsPlaying(false);
        setCurrentIndex(0);
      }
    };

    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentIndex, audioFiles]);

  // Handle play/pause when state or current file changes
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.play().catch((err) => {
        console.error("Playback failed:", err);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentIndex]);

  const playAll = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setCurrentIndex(0);
      setIsPlaying(true);
    }
  };

  return (
    <div className="audio-player">
      <Button
        type="primary"
        style={{ marginTop: 16, width: "100%" }}
        onClick={playAll}
      >
        {isPlaying ? "Stop" : "Play"}
      </Button>

      {audioFiles.length > 0 && (
        <audio ref={audioRef} src={audioFiles[currentIndex]} preload="auto" />
      )}
    </div>
  );
};

export default AudioPlayer;
