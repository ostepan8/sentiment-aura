import { useState } from "react";

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");

  const handleStart = () => {
    setIsRecording(true);
    // TODO: Start audio capture
  };

  const handleStop = () => {
    setIsRecording(false);
    // TODO: Stop audio capture
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Sentiment Aura</h1>
      <button onClick={isRecording ? handleStop : handleStart}>
        {isRecording ? "Stop" : "Start"}
      </button>
      <div
        style={{ marginTop: "20px", border: "1px solid #ccc", padding: "10px" }}
      >
        <h3>Transcript:</h3>
        <p>{transcript || "No transcript yet..."}</p>
      </div>
    </div>
  );
}

export default App;
