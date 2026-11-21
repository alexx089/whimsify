import { useState, useRef, useCallback, useEffect } from 'react';

export type CameraStatus =
  | 'idle' // Not started yet (user needs to click "Allow Camera Access")
  | 'requesting' // Native browser permission prompt is active
  | 'ready' // Camera is streaming live
  | 'denied' // User denied permission
  | 'unavailable' // No camera hardware found or in use by another app
  | 'error'; // Other unexpected error

export function useCamera() {
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Check if multiple video devices exist (e.g. front & back on mobile)
  const checkMultipleCameras = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setHasMultipleCameras(videoInputs.length > 1);
    } catch {
      // Non-critical, ignore
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    setStream(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus('idle');
    setErrorMessage(null);
  }, []);

  const startCamera = useCallback(
    async (mode: 'user' | 'environment' = facingMode, enableAudio: boolean = false) => {
      // First stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setStream(null);

      setStatus('requesting');
      setErrorMessage(null);

      // Verify browser support for mediaDevices
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatus('unavailable');
        setErrorMessage(
          'Camera access is not supported by this browser. Please use Chrome, Safari, Edge, or Firefox.'
        );
        return;
      }

      try {
        let activeStream: MediaStream;
        try {
          const constraints: MediaStreamConstraints = {
            audio: enableAudio
              ? {
                  echoCancellation: true,
                  noiseSuppression: true,
                  autoGainControl: true,
                }
              : false,
            video: {
              facingMode: mode,
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
            },
          };
          activeStream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (audioOrVidErr) {
          // If audio was requested but failed (e.g. mic denied/unavailable), fallback to video only
          if (enableAudio) {
            console.warn('Audio capture failed, falling back to video only:', audioOrVidErr);
            activeStream = await navigator.mediaDevices.getUserMedia({
              audio: false,
              video: {
                facingMode: mode,
                width: { ideal: 1280, max: 1920 },
                height: { ideal: 720, max: 1080 },
              },
            });
          } else {
            throw audioOrVidErr;
          }
        }

        streamRef.current = activeStream;
        setStream(activeStream);

        if (videoRef.current) {
          videoRef.current.srcObject = activeStream;
          videoRef.current.setAttribute('playsinline', 'true');
          // Wait for video to actually start playing
          try {
            await videoRef.current.play();
          } catch {
            // Some browsers require explicit user touch/play
          }
        }

        setFacingMode(mode);
        setStatus('ready');
        checkMultipleCameras();
      } catch (err: unknown) {
        console.error('Camera error:', err);
        const error = err as Error;

        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setStatus('denied');
          setErrorMessage(
            'Camera permission was denied. Please click the camera/lock icon in your browser address bar and enable camera access for Whimsy Booth ♡'
          );
        } else if (
          error.name === 'NotFoundError' ||
          error.name === 'DevicesNotFoundError'
        ) {
          setStatus('unavailable');
          setErrorMessage(
            'No camera device was detected. Please plug in or connect a webcam.'
          );
        } else if (
          error.name === 'NotReadableError' ||
          error.name === 'TrackStartError'
        ) {
          setStatus('unavailable');
          setErrorMessage(
            'Camera is currently in use by another app or browser tab. Please close any other app using your camera.'
          );
        } else {
          setStatus('error');
          setErrorMessage(
            error.message ||
              'Unable to access camera. Please check your browser permissions.'
          );
        }
      }
    },
    [facingMode, checkMultipleCameras]
  );

  const switchCamera = useCallback(async () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    await startCamera(nextMode);
  }, [facingMode, startCamera]);

  // Keep videoRef.current in sync with active stream
  useEffect(() => {
    if (videoRef.current && stream) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play().catch(() => {});
      }
    }
  }, [stream]);

  // Clean up all tracks on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    status,
    errorMessage,
    facingMode,
    hasMultipleCameras,
    videoRef,
    stream,
    startCamera,
    stopCamera,
    switchCamera,
  };
}
