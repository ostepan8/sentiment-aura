import { useEffect, useRef, useState } from "react";

/**
 * TranscriptDisplay Component
 * Displays live transcription with auto-scrolling and graceful word animations
 */
function TranscriptDisplay({ transcript, isRecording = false }) {
  const scrollRef = useRef(null);
  const [words, setWords] = useState([]);
  const previousTranscriptRef = useRef("");

  // Auto-scroll to bottom when new text arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  // Process transcript into animated words
  useEffect(() => {
    if (!transcript) {
      setWords([]);
      previousTranscriptRef.current = "";
      return;
    }

    const currentWords = transcript.split(/\s+/).filter(w => w.length > 0);
    const previousLength = previousTranscriptRef.current.split(/\s+/).filter(w => w.length > 0).length;

    // Map words with animation state
    const wordObjects = currentWords.map((word, index) => ({
      text: word,
      isNew: index >= previousLength,
      key: `${index}-${word}`,
    }));

    setWords(wordObjects);
    previousTranscriptRef.current = transcript;
  }, [transcript]);

  return (
    <div className="transcript-display">
      <div className="transcript-header">
        <span className="transcript-title">Live Transcript</span>
        {isRecording && (
          <div className="recording-indicator">
            <span className="recording-dot"></span>
            <span className="recording-text">LIVE</span>
          </div>
        )}
      </div>
      <div className="transcript-content" ref={scrollRef}>
        {words.length > 0 ? (
          <p className="transcript-text">
            {words.map((wordObj) => (
              <span
                key={wordObj.key}
                className={wordObj.isNew ? "word word-new" : "word"}
              >
                {wordObj.text}{" "}
              </span>
            ))}
          </p>
        ) : (
          <p className="transcript-placeholder">
            {isRecording ? "Listening..." : "Click 'Start Recording' to begin"}
          </p>
        )}
      </div>
    </div>
  );
}

export default TranscriptDisplay;
