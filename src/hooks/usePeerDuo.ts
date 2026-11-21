import { useState, useRef, useCallback, useEffect } from 'react';
import Peer, { MediaConnection, DataConnection } from 'peerjs';
import { DuoSyncAction } from '../types';

export type DuoConnectionStatus =
  | 'idle' // No room active
  | 'creating' // Host initializing room
  | 'waiting' // Host waiting for friend to join
  | 'joining' // Guest connecting to host
  | 'connected' // Both peers connected with live video!
  | 'disconnected' // One peer disconnected
  | 'error';

export function usePeerDuo(onSyncAction?: (action: DuoSyncAction) => void) {
  const [status, setStatus] = useState<DuoConnectionStatus>('idle');
  const [roomId, setRoomId] = useState<string>('');
  const [isHost, setIsHost] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [remotePeerName, setRemotePeerName] = useState<string>('Bestie');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const peerRef = useRef<Peer | null>(null);
  const callRef = useRef<MediaConnection | null>(null);
  const dataConnRef = useRef<DataConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const onSyncActionRef = useRef(onSyncAction);

  useEffect(() => {
    onSyncActionRef.current = onSyncAction;
  }, [onSyncAction]);

  // Helper to generate a cute memorable room code (e.g. whimsy-cherry-88)
  const generateRoomCode = () => {
    const adjectives = ['cherry', 'sweet', 'pink', 'sparkle', 'angel', 'honey', 'cloud', 'daisy', 'peach', 'star'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const num = Math.floor(100 + Math.random() * 900);
    return `whimsy-${adj}-${num}`;
  };

  // Attach remote stream to remote video element
  const handleRemoteStream = useCallback((stream: MediaStream) => {
    remoteStreamRef.current = stream;
    setRemoteStream(stream);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
      remoteVideoRef.current.play().catch(() => {});
    }
    setStatus('connected');
  }, []);

  // Set up data channel listeners
  const setupDataConnection = useCallback((conn: DataConnection) => {
    dataConnRef.current = conn;

    conn.on('open', () => {
      // Connected!
    });

    conn.on('data', (data: unknown) => {
      try {
        const action = data as DuoSyncAction;
        if (onSyncActionRef.current) {
          onSyncActionRef.current(action);
        }
      } catch (err) {
        console.error('Failed to parse sync message:', err);
      }
    });

    conn.on('close', () => {
      setStatus('disconnected');
      setErrorMessage('Your friend disconnected.');
    });
  }, []);

  // Send synchronized action to the other friend
  const sendSyncAction = useCallback((action: DuoSyncAction) => {
    if (dataConnRef.current && dataConnRef.current.open) {
      dataConnRef.current.send(action);
    }
  }, []);

  // HOST: Create a Room
  const createRoom = useCallback(
    async (userStream: MediaStream, customId?: string) => {
      localStreamRef.current = userStream;
      setIsHost(true);
      setStatus('creating');
      setErrorMessage(null);

      const chosenRoomId = customId || generateRoomCode();
      setRoomId(chosenRoomId);

      try {
        const peer = new Peer(chosenRoomId, {
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' },
              { urls: 'stun:stun3.l.google.com:19302' },
              { urls: 'stun:stun4.l.google.com:19302' },
              { urls: 'stun:stun.cloudflare.com:3478' },
            ],
          },
        });
        peerRef.current = peer;

        peer.on('open', (id) => {
          setRoomId(id);
          setStatus('waiting');
        });

        // Answer incoming video call from friend
        peer.on('call', (incomingCall) => {
          callRef.current = incomingCall;
          incomingCall.answer(userStream);

          incomingCall.on('stream', (remoteStream) => {
            handleRemoteStream(remoteStream);
          });

          incomingCall.on('close', () => {
            setStatus('disconnected');
          });
        });

        // Listen for data channel connection
        peer.on('connection', (conn) => {
          setupDataConnection(conn);
        });

        peer.on('error', (err) => {
          console.error('Peer error:', err);
          if (err.type === 'unavailable-id') {
            // ID already taken, retry with new random ID
            peer.destroy();
            createRoom(userStream);
          } else {
            setStatus('error');
            setErrorMessage(err.message || 'Unable to create photobooth room.');
          }
        });
      } catch (err: unknown) {
        setStatus('error');
        setErrorMessage((err as Error).message || 'Failed to start video call.');
      }
    },
    [handleRemoteStream, setupDataConnection]
  );

  // GUEST: Join an existing room
  const joinRoom = useCallback(
    async (targetRoomId: string, userStream: MediaStream) => {
      localStreamRef.current = userStream;
      setIsHost(false);
      setStatus('joining');
      setErrorMessage(null);
      const cleanId = targetRoomId.trim().toLowerCase();
      setRoomId(cleanId);

      try {
        const peer = new Peer({
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' },
              { urls: 'stun:stun3.l.google.com:19302' },
              { urls: 'stun:stun4.l.google.com:19302' },
              { urls: 'stun:stun.cloudflare.com:3478' },
            ],
          },
        });
        peerRef.current = peer;

        peer.on('open', () => {
          // Call the host with user's video stream
          const outgoingCall = peer.call(cleanId, userStream);
          callRef.current = outgoingCall;

          outgoingCall.on('stream', (remoteStream) => {
            handleRemoteStream(remoteStream);
          });

          outgoingCall.on('close', () => {
            setStatus('disconnected');
          });

          // Connect data channel
          const dataConn = peer.connect(cleanId);
          setupDataConnection(dataConn);
        });

        peer.on('error', (err) => {
          console.error('Peer join error:', err);
          setStatus('error');
          if (err.type === 'peer-unavailable') {
            setErrorMessage('Room not found. Please check the code or ask your friend to create a new room.');
          } else {
            setErrorMessage(err.message || 'Unable to join photobooth room.');
          }
        });
      } catch (err: unknown) {
        setStatus('error');
        setErrorMessage((err as Error).message || 'Failed to connect to friend.');
      }
    },
    [handleRemoteStream, setupDataConnection]
  );

  // Mute / Unmute Mic
  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const nextState = !audioTracks[0].enabled;
        audioTracks.forEach((track) => {
          track.enabled = nextState;
        });
        setIsMicMuted(!nextState);
      } else {
        setIsMicMuted(!isMicMuted);
      }
    }
  }, [isMicMuted]);

  // Leave room & clean up
  const leaveRoom = useCallback(() => {
    if (dataConnRef.current) {
      dataConnRef.current.close();
      dataConnRef.current = null;
    }
    if (callRef.current) {
      callRef.current.close();
      callRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((t) => t.stop());
      remoteStreamRef.current = null;
    }
    setStatus('idle');
    setRoomId('');
    setErrorMessage(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveRoom();
    };
  }, [leaveRoom]);

  return {
    status,
    roomId,
    isHost,
    errorMessage,
    isMicMuted,
    remotePeerName,
    remoteVideoRef,
    remoteStream,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleMic,
    sendSyncAction,
  };
}
