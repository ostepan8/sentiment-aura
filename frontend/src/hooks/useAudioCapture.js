import { useState, useRef, useCallback } from 'react';

/**
 * Custom hook for capturing audio from the microphone
 * @returns {Object} Recording state and control functions
 */
export const useAudioCapture = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const onDataAvailableRef = useRef(null);

  const startRecording = useCallback(async (onDataAvailable) => {
    try {
      setError(null);

      // Check if browser supports audio/webm
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        throw new Error('Browser does not support audio/webm format');
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000, // Deepgram works well with 16kHz
        },
      });

      audioStreamRef.current = stream;
      onDataAvailableRef.current = onDataAvailable;

      // Create MediaRecorder to capture audio chunks
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && onDataAvailableRef.current) {
          onDataAvailableRef.current(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);

        // Provide specific error message
        let errorMessage = 'Recording error occurred';
        if (event.error) {
          const errorName = event.error.name;
          if (errorName === 'NotAllowedError') {
            errorMessage = 'Microphone access denied. Please allow microphone permissions.';
          } else if (errorName === 'NotFoundError') {
            errorMessage = 'No microphone found. Please connect a microphone.';
          } else if (errorName === 'NotReadableError') {
            errorMessage = 'Microphone is already in use by another application.';
          } else {
            errorMessage = `Recording error: ${event.error.message || errorName}`;
          }
        }

        setError(errorMessage);
      };

      mediaRecorderRef.current = mediaRecorder;

      // Start recording with chunks every 100ms for lower latency
      mediaRecorder.start(100);
      setIsRecording(true);

      return stream;
    } catch (err) {
      console.error('Error starting recording:', err);

      // Provide specific error messages for getUserMedia failures
      let errorMessage = 'Failed to access microphone';
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Microphone access denied. Please allow microphone permissions in your browser.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone and try again.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Microphone is already in use. Please close other applications using it.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Microphone does not support the required settings. Try a different microphone.';
      } else if (err.name === 'TypeError') {
        errorMessage = 'Browser error. Please try using a modern browser like Chrome or Firefox.';
      } else {
        errorMessage = err.message || 'Failed to access microphone';
      }

      setError(errorMessage);
      throw err;
    }
  }, []);

  const stopRecording = useCallback(() => {
    try {
      if (mediaRecorderRef.current && isRecording) {
        // Check if recorder is in a valid state to stop
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
      }

      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (trackErr) {
            console.error('Error stopping audio track:', trackErr);
          }
        });
        audioStreamRef.current = null;
      }

      onDataAvailableRef.current = null;
    } catch (err) {
      console.error('Error stopping recording:', err);
      // Still set isRecording to false even if there's an error
      setIsRecording(false);
      setError('Error stopping recording. Please refresh the page.');
    }
  }, [isRecording]);

  return {
    isRecording,
    error,
    startRecording,
    stopRecording,
  };
};
