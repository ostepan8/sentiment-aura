import TranscriptDisplay from "./components/TranscriptDisplay";
import { useAudioCapture } from "./hooks/useAudioCapture";
import { useDeepgram } from "./hooks/useDeepgram";
import "./App.css";

function App() {
  // Get Deepgram API key from environment variable
  const apiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;

  const { isRecording, error: audioError, startRecording, stopRecording } = useAudioCapture();
  const {
    isConnected,
    transcript,
    error: deepgramError,
    connect,
    sendAudio,
    disconnect,
    clearTranscript,
  } = useDeepgram(apiKey);

  // Handle start/stop recording
  const handleToggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      stopRecording();
      disconnect();
    } else {
      // Start recording
      try {
        // Connect to Deepgram first
        const connection = await connect();

        if (connection) {
          // Wait for connection to be fully open before starting audio
          // Check the connection's ready state directly
          const waitForConnection = new Promise((resolve, reject) => {
            let resolved = false;

            // If already connected, resolve immediately
            if (isConnected) {
              resolved = true;
              resolve();
              return;
            }

            // Poll the connection's ready state
            const checkInterval = setInterval(() => {
              if (connection.getReadyState && connection.getReadyState() === 1) {
                clearInterval(checkInterval);
                if (!resolved) {
                  resolved = true;
                  resolve();
                }
              }
            }, 100);

            // Timeout after 8 seconds
            setTimeout(() => {
              clearInterval(checkInterval);
              if (!resolved) {
                resolved = true;
                reject(new Error('Connection timeout'));
              }
            }, 8000);
          });

          await waitForConnection;

          // Now start capturing audio
          await startRecording((audioBlob) => {
            sendAudio(audioBlob);
          });
        }
      } catch (err) {
        console.error('Failed to start recording:', err);

        // Provide user-friendly error message
        if (err.message === 'Connection timeout') {
          // Error is already set, but ensure UI shows it properly
          console.log('Connection timed out after 8 seconds');
        }
      }
    }
  };

  const error = audioError || deepgramError;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
      }}
    >
      <h1 style={{ color: "#fff", textAlign: "center", marginBottom: "20px" }}>
        Sentiment Aura
      </h1>

      {/* Error message */}
      {error && (
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto 20px",
            padding: "12px 20px",
            background: "rgba(244, 67, 54, 0.15)",
            border: "1px solid rgba(244, 67, 54, 0.3)",
            borderRadius: "8px",
            color: "#fff",
          }}
        >
          <div style={{ fontWeight: "600", marginBottom: "8px" }}>
            ⚠️ Error
          </div>
          <div style={{ fontSize: "14px", lineHeight: "1.5" }}>
            {error}
          </div>
          {isRecording && (
            <div style={{ marginTop: "12px" }}>
              <button
                onClick={() => {
                  stopRecording();
                  disconnect();
                }}
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  background: "#f44336",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Stop & Retry
              </button>
            </div>
          )}
        </div>
      )}

      {/* API Key warning */}
      {!apiKey && (
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto 20px",
            padding: "12px 20px",
            background: "rgba(255, 152, 0, 0.15)",
            border: "1px solid rgba(255, 152, 0, 0.3)",
            borderRadius: "8px",
            color: "#fff",
            textAlign: "center",
          }}
        >
          ⚠️ Deepgram API key not found. Add VITE_DEEPGRAM_API_KEY to your .env file
        </div>
      )}

      {/* Control buttons */}
      <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "20px" }}>
        <button
          onClick={handleToggleRecording}
          disabled={!apiKey}
          style={{
            padding: "12px 32px",
            fontSize: "16px",
            cursor: apiKey ? "pointer" : "not-allowed",
            background: isRecording ? "#f44336" : "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "600",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            transition: "all 0.2s",
            opacity: apiKey ? 1 : 0.5,
          }}
        >
          {isRecording ? "⏹ Stop Recording" : "🎤 Start Recording"}
        </button>
        <button
          onClick={clearTranscript}
          disabled={!transcript}
          style={{
            padding: "12px 24px",
            fontSize: "16px",
            cursor: transcript ? "pointer" : "not-allowed",
            background: "#9E9E9E",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "600",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            transition: "all 0.2s",
            opacity: transcript ? 1 : 0.5,
          }}
        >
          Clear
        </button>
      </div>

      {/* Connection status */}
      {isRecording && (
        <div
          style={{
            textAlign: "center",
            color: "rgba(255, 255, 255, 0.8)",
            fontSize: "14px",
            marginBottom: "20px",
          }}
        >
          {isConnected ? "🟢 Connected to Deepgram" : "🟡 Connecting..."}
        </div>
      )}

      <TranscriptDisplay transcript={transcript} isRecording={isRecording} />
    </div>
  );
}

export default App;
