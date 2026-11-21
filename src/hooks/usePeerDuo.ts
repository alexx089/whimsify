import { useState, useRef, useCallback, useEffect } from 'react';
import Peer, { MediaConnection, DataConnection } from 'peerjs';
import { DuoSyncAction, GroupPeer } from '../types';

export type DuoConnectionStatus =
  | 'idle' // No room active
  | 'creating' // Host initializing room
  | 'waiting' // Host waiting for friends to join
  | 'joining' // Guest connecting to host
  | 'connected' // 1 or more friends connected with live video!
  | 'disconnected' // Disconnected
  | 'error';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
];

export function usePeerDuo(onSyncAction?: (action: DuoSyncAction) => void) {
  const [status, setStatus] = useState<DuoConnectionStatus>('idle');
  const [roomId, setRoomId] = useState<string>('');
  const [isHost, setIsHost] = useState<boolean>(false);
  const [maxPeople, setMaxPeople] = useState<number>(5); // Adjustable up to 5 people!
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [remotePeers, setRemotePeers] = useState<GroupPeer[]>([]);

  const peerRef = useRef<Peer | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callsMapRef = useRef<Map<string, MediaConnection>>(new Map());
  const dataConnsMapRef = useRef<Map<string, DataConnection>>(new Map());
  const streamsMapRef = useRef<Map<string, MediaStream>>(new Map());
  const maxPeopleRef = useRef<number>(5);
  const isHostRef = useRef<boolean>(false);
  const onSyncActionRef = useRef(onSyncAction);

  useEffect(() => {
    onSyncActionRef.current = onSyncAction;
  }, [onSyncAction]);

  useEffect(() => {
    maxPeopleRef.current = maxPeople;
  }, [maxPeople]);

  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  // Generate cute room code
  const generateRoomCode = () => {
    const adjectives = ['cherry', 'sweet', 'pink', 'sparkle', 'angel', 'honey', 'cloud', 'daisy', 'peach', 'star'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const num = Math.floor(100 + Math.random() * 900);
    return `whimsy-${adj}-${num}`;
  };

  // Add a remote peer stream
  const addRemotePeer = useCallback((peerId: string, stream: MediaStream) => {
    streamsMapRef.current.set(peerId, stream);
    setRemotePeers((prev) => {
      const filtered = prev.filter((p) => p.peerId !== peerId);
      const peerNumber = filtered.length + 1;
      return [...filtered, { peerId, stream, name: `Bestie ${peerNumber}` }];
    });
    setStatus('connected');
  }, []);

  // Remove a remote peer
  const removeRemotePeer = useCallback((peerId: string) => {
    streamsMapRef.current.delete(peerId);

    const call = callsMapRef.current.get(peerId);
    if (call) {
      call.close();
      callsMapRef.current.delete(peerId);
    }

    const dataConn = dataConnsMapRef.current.get(peerId);
    if (dataConn) {
      dataConn.close();
      dataConnsMapRef.current.delete(peerId);
    }

    setRemotePeers((prev) => {
      const updated = prev.filter((p) => p.peerId !== peerId);
      if (updated.length === 0 && isHostRef.current) {
        setStatus('waiting');
      }
      return updated;
    });
  }, []);

  // Broadcast sync action to all connected peers
  const sendSyncAction = useCallback((action: DuoSyncAction) => {
    dataConnsMapRef.current.forEach((conn) => {
      if (conn.open) {
        try {
          conn.send(action);
        } catch (e) {
          console.warn('Failed to send to peer:', conn.peer, e);
        }
      }
    });
  }, []);

  // Set up data connection listeners
  const setupDataConnection = useCallback(
    (conn: DataConnection) => {
      const peerId = conn.peer;
      dataConnsMapRef.current.set(peerId, conn);

      conn.on('data', (data: unknown) => {
        try {
          const action = data as DuoSyncAction;

          if (action.type === 'CHANGE_MAX_PEOPLE') {
            setMaxPeople(action.maxPeople);
          }

          if (action.type === 'ROSTER_UPDATE') {
            // New peers joined the room, connect to any we aren't connected with yet
            const myId = peerRef.current?.id;
            const myStream = localStreamRef.current;
            if (myId && myStream) {
              action.peerIds.forEach((targetId) => {
                if (targetId !== myId && !callsMapRef.current.has(targetId)) {
                  // Connect if my ID is greater to avoid duplicate calling
                  if (myId > targetId && peerRef.current) {
                    const outgoingCall = peerRef.current.call(targetId, myStream);
                    callsMapRef.current.set(targetId, outgoingCall);

                    outgoingCall.on('stream', (remoteStream) => {
                      addRemotePeer(targetId, remoteStream);
                    });

                    outgoingCall.on('close', () => {
                      removeRemotePeer(targetId);
                    });

                    const meshDataConn = peerRef.current.connect(targetId);
                    setupDataConnection(meshDataConn);
                  }
                }
              });
            }
          }

          // Forward to caller's handler
          if (onSyncActionRef.current) {
            onSyncActionRef.current(action);
          }

          // If Host, forward action to all other peers
          if (isHostRef.current) {
            dataConnsMapRef.current.forEach((otherConn) => {
              if (otherConn.peer !== peerId && otherConn.open) {
                otherConn.send(action);
              }
            });
          }
        } catch (err) {
          console.error('Data error from peer:', peerId, err);
        }
      });

      conn.on('close', () => {
        removeRemotePeer(peerId);
      });
    },
    [addRemotePeer, removeRemotePeer]
  );

  // HOST: Create a Room
  const createRoom = useCallback(
    async (userStream: MediaStream, customId?: string, capacity: number = 5) => {
      localStreamRef.current = userStream;
      setIsHost(true);
      setMaxPeople(capacity);
      setStatus('creating');
      setErrorMessage(null);
      setRemotePeers([]);

      const chosenRoomId = customId || generateRoomCode();
      setRoomId(chosenRoomId);

      try {
        const peer = new Peer(chosenRoomId, {
          debug: 1,
          config: { iceServers: ICE_SERVERS },
        });
        peerRef.current = peer;

        peer.on('open', (id) => {
          setRoomId(id);
          setStatus('waiting');
        });

        // Answer incoming video calls from friends
        peer.on('call', (incomingCall) => {
          const callerId = incomingCall.peer;

          // Check room capacity limit
          if (callsMapRef.current.size >= maxPeopleRef.current - 1) {
            incomingCall.close();
            return;
          }

          callsMapRef.current.set(callerId, incomingCall);
          incomingCall.answer(userStream);

          incomingCall.on('stream', (remoteStream) => {
            addRemotePeer(callerId, remoteStream);

            // Broadcast full roster of connected peers to all participants
            const allRoster = [peer.id, ...Array.from(callsMapRef.current.keys())];
            sendSyncAction({ type: 'ROSTER_UPDATE', peerIds: allRoster });
          });

          incomingCall.on('close', () => {
            removeRemotePeer(callerId);
          });
        });

        // Listen for data channel connection
        peer.on('connection', (conn) => {
          setupDataConnection(conn);
        });

        peer.on('error', (err) => {
          console.error('Peer host error:', err);
          if (err.type === 'unavailable-id') {
            peer.destroy();
            createRoom(userStream, undefined, capacity);
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
    [addRemotePeer, removeRemotePeer, setupDataConnection, sendSyncAction]
  );

  // GUEST: Join an existing room
  const joinRoom = useCallback(
    async (targetRoomId: string, userStream: MediaStream) => {
      localStreamRef.current = userStream;
      setIsHost(false);
      setStatus('joining');
      setErrorMessage(null);
      setRemotePeers([]);

      const cleanId = targetRoomId.trim().toLowerCase();
      setRoomId(cleanId);

      try {
        const peer = new Peer({
          debug: 1,
          config: { iceServers: ICE_SERVERS },
        });
        peerRef.current = peer;

        peer.on('open', () => {
          // Call the host with user's video stream
          const outgoingCall = peer.call(cleanId, userStream);
          callsMapRef.current.set(cleanId, outgoingCall);

          outgoingCall.on('stream', (remoteStream) => {
            addRemotePeer(cleanId, remoteStream);
          });

          outgoingCall.on('close', () => {
            removeRemotePeer(cleanId);
          });

          // Connect data channel to host
          const dataConn = peer.connect(cleanId);
          setupDataConnection(dataConn);
        });

        peer.on('call', (incomingCall) => {
          // Other peers in mesh calling us
          const callerId = incomingCall.peer;
          callsMapRef.current.set(callerId, incomingCall);
          incomingCall.answer(userStream);

          incomingCall.on('stream', (remoteStream) => {
            addRemotePeer(callerId, remoteStream);
          });

          incomingCall.on('close', () => {
            removeRemotePeer(callerId);
          });
        });

        peer.on('connection', (conn) => {
          setupDataConnection(conn);
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
    [addRemotePeer, removeRemotePeer, setupDataConnection]
  );

  // Change room capacity (Host only)
  const updateMaxPeople = useCallback(
    (count: number) => {
      const clamped = Math.max(2, Math.min(5, count));
      setMaxPeople(clamped);
      maxPeopleRef.current = clamped;
      sendSyncAction({ type: 'CHANGE_MAX_PEOPLE', maxPeople: clamped });
    },
    [sendSyncAction]
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
    dataConnsMapRef.current.forEach((conn) => conn.close());
    dataConnsMapRef.current.clear();

    callsMapRef.current.forEach((call) => call.close());
    callsMapRef.current.clear();

    streamsMapRef.current.clear();

    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    setRemotePeers([]);
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
    maxPeople,
    errorMessage,
    isMicMuted,
    remotePeers,
    remoteStream: remotePeers[0]?.stream || null,
    totalPeople: 1 + remotePeers.length,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleMic,
    updateMaxPeople,
    sendSyncAction,
  };
}
