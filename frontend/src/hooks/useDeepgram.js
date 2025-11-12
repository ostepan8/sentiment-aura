import { useState, useRef, useCallback } from "react";
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";

/**
 * Custom hook for managing Deepgram live transcription
 * @param {string} apiKey - Deepgram API key
 * @returns {Object} Transcription state and control functions
 */
export const useDeepgram = (apiKey) => {
  const [isConnected, setIsConnected] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState(null);

  const deepgramRef = useRef(null);
  const connectionRef = useRef(null);
  const finalTranscriptRef = useRef("");
  const keepAliveIntervalRef = useRef(null);

  const connect = useCallback(async () => {
    if (!apiKey) {
      setError("Deepgram API key is missing");
      return null;
    }

    try {
      setError(null);

      // Initialize Deepgram client
      const deepgram = createClient(apiKey);
      deepgramRef.current = deepgram;

      // Create live transcription connection
      const connection = deepgram.listen.live({
        model: "nova-2",
        language: "en-US",
        smart_format: true,
        interim_results: true,
        endpointing: 200,
      });

      connectionRef.current = connection;

      // Handle connection open
      connection.on(LiveTranscriptionEvents.Open, () => {
        setIsConnected(true);

        // Start sending KeepAlive messages every 5 seconds to prevent timeout
        keepAliveIntervalRef.current = setInterval(() => {
          if (
            connectionRef.current &&
            connectionRef.current.getReadyState() === 1
          ) {
            connectionRef.current.send(JSON.stringify({ type: "KeepAlive" }));
          }
        }, 5000);
      });

      // Handle incoming transcripts
      connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        const transcriptText = data.channel?.alternatives?.[0]?.transcript;

        if (transcriptText && transcriptText.trim() !== "") {
          if (data.is_final) {
            // Append final transcript
            finalTranscriptRef.current = finalTranscriptRef.current
              ? `${finalTranscriptRef.current} ${transcriptText}`
              : transcriptText;
            setTranscript(finalTranscriptRef.current);
          } else {
            // Show interim results
            const interimText = finalTranscriptRef.current
              ? `${finalTranscriptRef.current} ${transcriptText}`
              : transcriptText;
            setTranscript(interimText);
          }
        }
      });

      // Handle errors
      connection.on(LiveTranscriptionEvents.Error, (err) => {
        console.error("Deepgram error:", err);

        // Provide specific error messages
        let errorMessage = "Transcription error occurred";
        if (err.message) {
          if (
            err.message.includes("401") ||
            err.message.includes("Unauthorized")
          ) {
            errorMessage =
              "Invalid API key. Please check your Deepgram credentials.";
          } else if (
            err.message.includes("429") ||
            err.message.includes("rate limit")
          ) {
            errorMessage = "Rate limit exceeded. Please try again later.";
          } else if (
            err.message.includes("network") ||
            err.message.includes("timeout")
          ) {
            errorMessage = "Network error. Please check your connection.";
          } else {
            errorMessage = `Transcription error: ${err.message}`;
          }
        }

        setError(errorMessage);
      });

      // Handle connection close
      connection.on(LiveTranscriptionEvents.Close, (closeEvent) => {
        console.log("Deepgram connection closed:", closeEvent);

        // Clean up KeepAlive interval when connection closes
        if (keepAliveIntervalRef.current) {
          clearInterval(keepAliveIntervalRef.current);
          keepAliveIntervalRef.current = null;
        }

        setIsConnected(false);

        // Check if this was an unexpected close
        if (closeEvent && closeEvent.code !== 1000) {
          setError(
            `Connection closed unexpectedly (code ${closeEvent.code}). Please try reconnecting.`
          );
        }
      });

      return connection;
    } catch (err) {
      console.error("Error connecting to Deepgram:", err);
      setError(err.message || "Failed to connect to Deepgram");
      return null;
    }
  }, [apiKey]);

  const sendAudio = useCallback((audioBlob) => {
    if (!connectionRef.current) {
      console.warn("Cannot send audio: no connection reference");
      return;
    }

    const readyState = connectionRef.current.getReadyState();

    if (readyState !== 1) {
      console.warn(
        `Cannot send audio: connection not ready (state: ${readyState})`
      );
      return;
    }

    audioBlob
      .arrayBuffer()
      .then((buffer) => {
        if (
          connectionRef.current &&
          connectionRef.current.getReadyState() === 1
        ) {
          connectionRef.current.send(buffer);
        }
      })
      .catch((err) => {
        console.error("Error converting audio blob to buffer:", err);
        setError("Failed to process audio data");
      });
  }, []);

  const disconnect = useCallback(() => {
    // Clear KeepAlive interval
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
    }

    if (connectionRef.current) {
      connectionRef.current.finish();
      connectionRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript("");
    finalTranscriptRef.current = "";
  }, []);

  return {
    isConnected,
    transcript,
    error,
    connect,
    sendAudio,
    disconnect,
    clearTranscript,
  };
};
