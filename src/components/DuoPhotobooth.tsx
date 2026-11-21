import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCamera } from '../hooks/useCamera';
import { usePeerDuo, DuoConnectionStatus } from '../hooks/usePeerDuo';
import { FrameId, LayoutMode, CapturedPhoto, DuoSyncAction } from '../types';
import { FRAMES } from '../utils/framesAndStickers';
import { sounds } from '../utils/audio';
import {
  Camera,
  Users,
  Mic,
  MicOff,
  Copy,
  Check,
  Share2,
  RotateCcw,
  Sparkles,
  ArrowRight,
  PhoneOff,
  RefreshCw,
  AlertCircle,
  Timer,
  Heart,
  Smile,
  Video,
  ExternalLink,
} from 'lucide-react';

interface DuoPhotoboothProps {
  initialFrameId?: FrameId;
  onFinishSession: (photos: CapturedPhoto[], frameId: FrameId, layout: LayoutMode) => void;
  onNavigateHome: () => void;
}

export const DuoPhotobooth: React.FC<DuoPhotoboothProps> = ({
  initialFrameId = 'classic-white',
  onFinishSession,
  onNavigateHome,
}) => {
  const [selectedFrameId, setSelectedFrameId] = useState<FrameId>(initialFrameId);
  const [layoutMode] = useState<LayoutMode>('strip');
  const [targetPhotoCount, setTargetPhotoCount] = useState<number>(4);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(3);
  const [currentCountdown, setCurrentCountdown] = useState<number | null>(null);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [isFlashing, setIsFlashing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [joinInputCode, setJoinInputCode] = useState('');
  const [userRole, setUserRole] = useState<'lobby' | 'host' | 'guest'>('lobby');

  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync action handler received over WebRTC data channel
  const handleSyncAction = useCallback(
    (action: DuoSyncAction) => {
      switch (action.type) {
        case 'START_COUNTDOWN':
          triggerCountdownSequence(action.seconds, false);
          break;
        case 'PHOTO_CAPTURED':
          break;
        case 'CHANGE_FRAME':
          setSelectedFrameId(action.frameId);
          break;
        case 'CHANGE_POSES_COUNT':
          setTargetPhotoCount(action.count);
          setCapturedPhotos([]);
          break;
        case 'FINISH_SESSION':
          // Finish session with current photos
          onFinishSession(capturedPhotos, selectedFrameId, layoutMode);
          break;
        case 'RETAKE_ALL':
          setCapturedPhotos([]);
          break;
      }
    },
    [capturedPhotos, selectedFrameId, layoutMode, onFinishSession]
  );

  const camera = useCamera();
  const duo = usePeerDuo(handleSyncAction);

  // Auto-fill room code from URL params if present (e.g. ?duo=whimsy-cherry-88)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const duoCode = params.get('duo') || params.get('room');
    if (duoCode) {
      setJoinInputCode(duoCode.trim().toLowerCase());
      setUserRole('guest');
    }
  }, []);

  // Sync video streams to video elements whenever elements or streams update
  useEffect(() => {
    if (camera.videoRef.current && camera.stream) {
      if (camera.videoRef.current.srcObject !== camera.stream) {
        camera.videoRef.current.srcObject = camera.stream;
      }
      camera.videoRef.current.setAttribute('playsinline', 'true');
      camera.videoRef.current.play().catch(() => {});
    }
  }, [camera.stream, duo.status]);

  useEffect(() => {
    if (duo.remoteVideoRef.current && duo.remoteStream) {
      if (duo.remoteVideoRef.current.srcObject !== duo.remoteStream) {
        duo.remoteVideoRef.current.srcObject = duo.remoteStream;
      }
      duo.remoteVideoRef.current.setAttribute('playsinline', 'true');
      duo.remoteVideoRef.current.play().catch(() => {});
    }
  }, [duo.remoteStream, duo.status]);

  // Clean up camera and duo call on unmount
  useEffect(() => {
    return () => {
      camera.stopCamera();
      duo.leaveRoom();
    };
  }, []);

  // Helper: Draw video onto canvas with 'cover' aspect ratio
  const drawVideoCover = (
    ctx: CanvasRenderingContext2D,
    video: HTMLVideoElement,
    dx: number,
    dy: number,
    dWidth: number,
    dHeight: number,
    mirror: boolean
  ) => {
    const vw = video.videoWidth || 1280;
    const vh = video.videoHeight || 720;
    const videoAspect = vw / vh;
    const destAspect = dWidth / dHeight;

    let sx = 0,
      sy = 0,
      sWidth = vw,
      sHeight = vh;

    if (videoAspect > destAspect) {
      sWidth = vh * destAspect;
      sx = (vw - sWidth) / 2;
    } else {
      sHeight = vw / destAspect;
      sy = (vh - sHeight) / 2;
    }

    ctx.save();
    // Clip to bounding box
    ctx.beginPath();
    ctx.rect(dx, dy, dWidth, dHeight);
    ctx.clip();

    if (mirror) {
      ctx.translate(dx + dWidth, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, dWidth, dHeight);
    } else {
      ctx.drawImage(video, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
    }
    ctx.restore();
  };

  // Capture both local video and remote video side-by-side into a single photo
  const takeDualSnapshot = (): string | null => {
    const localVideo = camera.videoRef.current;
    const remoteVideo = duo.remoteVideoRef.current;

    if (!localVideo) return null;

    let canvas = captureCanvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      captureCanvasRef.current = canvas;
    }

    // High resolution duo photo (1280 x 960 -> 4:3 aspect ratio)
    const W = 1280;
    const H = 960;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Fill background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);

    const halfW = W / 2;

    // Host on Left half, Guest on Right half
    if (duo.isHost) {
      // Local is Host (Left), Remote is Guest (Right)
      drawVideoCover(ctx, localVideo, 0, 0, halfW, H, camera.facingMode === 'user');
      if (remoteVideo && remoteVideo.readyState >= remoteVideo.HAVE_CURRENT_DATA) {
        drawVideoCover(ctx, remoteVideo, halfW, 0, halfW, H, true);
      } else {
        ctx.fillStyle = '#FCE7F3';
        ctx.fillRect(halfW, 0, halfW, H);
      }
    } else {
      // Remote is Host (Left), Local is Guest (Right)
      if (remoteVideo && remoteVideo.readyState >= remoteVideo.HAVE_CURRENT_DATA) {
        drawVideoCover(ctx, remoteVideo, 0, 0, halfW, H, true);
      } else {
        ctx.fillStyle = '#FCE7F3';
        ctx.fillRect(0, 0, halfW, H);
      }
      drawVideoCover(ctx, localVideo, halfW, 0, halfW, H, camera.facingMode === 'user');
    }

    // Draw aesthetic center divider line
    ctx.save();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(halfW, 0);
    ctx.lineTo(halfW, H);
    ctx.stroke();

    // Center cute heart icon badge
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(halfW, H / 2, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#EC4899';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('♡', halfW, H / 2);
    ctx.restore();

    return canvas.toDataURL('image/jpeg', 0.95);
  };

  // Perform single capture
  const executeCapture = () => {
    setIsFlashing(true);
    sounds.playShutter();
    setTimeout(() => setIsFlashing(false), 400);

    const dataUrl = takeDualSnapshot();
    if (!dataUrl) return;

    const newPhoto: CapturedPhoto = {
      id: Math.random().toString(36).substring(2, 9),
      dataUrl,
      timestamp: Date.now(),
    };

    setCapturedPhotos((prev) => [...prev, newPhoto]);
  };

  // Trigger countdown sequence
  const triggerCountdownSequence = (seconds: number, isInitiator = true) => {
    if (isCountingDown) return;
    setIsCountingDown(true);

    if (isInitiator) {
      duo.sendSyncAction({ type: 'START_COUNTDOWN', seconds });
    }

    let count = seconds;
    if (count === 0) {
      executeCapture();
      setIsCountingDown(false);
      return;
    }

    setCurrentCountdown(count);
    sounds.playCountdown(count);

    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCurrentCountdown(count);
        sounds.playCountdown(count);
      } else {
        clearInterval(interval);
        setCurrentCountdown(null);
        setIsCountingDown(false);
        executeCapture();
      }
    }, 1000);
  };

  // Host button click: Start room
  const handleHostCreateRoom = async () => {
    setUserRole('host');
    await camera.startCamera('user', true);
  };

  // Guest button click: Join room
  const handleGuestJoinRoom = async () => {
    if (!joinInputCode.trim()) return;
    setUserRole('guest');
    await camera.startCamera('user', true);
  };

  // When camera stream becomes ready, trigger room creation or join
  useEffect(() => {
    if (camera.status === 'ready' && camera.stream && duo.status === 'idle') {
      if (userRole === 'host') {
        duo.createRoom(camera.stream);
      } else if (userRole === 'guest' && joinInputCode.trim()) {
        duo.joinRoom(joinInputCode.trim(), camera.stream);
      }
    }
  }, [camera.status, camera.stream, duo.status, userRole, joinInputCode]);

  // Copy invitation link to clipboard
  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?duo=${duo.roomId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    });
  };

  // Change frame and sync
  const handleSelectFrame = (id: FrameId) => {
    setSelectedFrameId(id);
    duo.sendSyncAction({ type: 'CHANGE_FRAME', frameId: id });
  };

  // Change pose count and sync
  const handleSelectPoseCount = (cnt: number) => {
    setTargetPhotoCount(cnt);
    setCapturedPhotos([]);
    duo.sendSyncAction({ type: 'CHANGE_POSES_COUNT', count: cnt });
  };

  // Finish session
  const handleFinish = () => {
    duo.sendSyncAction({ type: 'FINISH_SESSION' });
    onFinishSession(capturedPhotos, selectedFrameId, layoutMode);
  };

  // Retake all photos
  const handleRetakeAll = () => {
    setCapturedPhotos([]);
    duo.sendSyncAction({ type: 'RETAKE_ALL' });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 select-none">
      {/* Hidden audio element for remote stream call audio */}
      <audio
        ref={(audioEl) => {
          if (audioEl && duo.remoteStream) {
            audioEl.srcObject = duo.remoteStream;
            audioEl.play().catch(() => {});
          }
        }}
        autoPlay
      />

      {/* Screen flash effect */}
      <div
        className={`fixed inset-0 bg-white z-50 pointer-events-none transition-opacity duration-300 ${
          isFlashing ? 'opacity-90' : 'opacity-0'
        }`}
      />

      {/* Sub Header & Room Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#F6DCE5] pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              duo.leaveRoom();
              camera.stopCamera();
              onNavigateHome();
            }}
            className="text-stone-500 hover:text-stone-800 transition-colors p-2 rounded-full hover:bg-stone-100 flex items-center gap-1"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-xs font-hand text-stone-600">Home</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">👯‍♀️</span>
              <span className="font-handwritten text-3xl font-bold text-[#51465A]">
                Together Booth
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F6DCE5] text-[#8C4D64] font-bold">
                Online Call ♡
              </span>
            </div>
            <p className="text-xs text-[#7B6F85] mt-0.5 font-medium">
              Snap live photos with your friend from anywhere in the world.
            </p>
          </div>
        </div>

        {/* Room status badge & Call Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {duo.status === 'connected' ? (
            <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Connected with Friend ♡</span>
            </div>
          ) : duo.status === 'waiting' ? (
            <div className="flex items-center space-x-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1 rounded-full text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Waiting for friend...</span>
            </div>
          ) : null}

          {duo.roomId && (
            <button
              onClick={handleCopyLink}
              title="Copy invite link to share with your friend"
              className="flex items-center space-x-1 bg-pink-50 border border-pink-200 hover:bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-xs transition-colors font-mono"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : duo.roomId}</span>
            </button>
          )}

          {duo.status === 'connected' && (
            <button
              onClick={duo.toggleMic}
              title={duo.isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
              className={`p-2 rounded-full transition-colors border ${
                duo.isMicMuted
                  ? 'bg-rose-100 border-rose-300 text-rose-600'
                  : 'bg-stone-100 border-stone-200 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {duo.isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Main Duo Area */}
      <div className="w-full flex flex-col items-center">
        {/* LOBBY: User not yet in call */}
        {duo.status === 'idle' || duo.status === 'creating' || duo.status === 'joining' ? (
          <div className="w-full max-w-xl my-auto py-8">
            <div className="bg-white rounded-3xl p-8 border-2 border-dashed border-pink-200 shadow-xl text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-300 via-purple-300 to-amber-200" />

              <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-pink-100 shadow-sm text-3xl">
                💌
              </div>

              <h2 className="text-2xl font-hand font-bold text-stone-800 mb-2">
                Snap Photobooth Pictures Together!
              </h2>
              <p className="text-stone-500 text-sm max-w-md mx-auto mb-8 leading-relaxed">
                Connect live with your best friend, partner, or sibling from anywhere in the world. See each other, chat with audio, and snap matching split-screen photobooth strips together in real-time!
              </p>

              {/* Host / Create Room Option */}
              <div className="space-y-4">
                <button
                  onClick={handleHostCreateRoom}
                  disabled={camera.status === 'requesting'}
                  className="w-full py-4 px-6 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white rounded-2xl font-bold shadow-md hover:shadow-lg transition-all transform active:scale-98 flex items-center justify-center space-x-3 text-base"
                >
                  <Users className="w-5 h-5" />
                  <span>Create a Duo Room & Invite Friend</span>
                </button>

                <div className="flex items-center my-4">
                  <div className="flex-1 border-t border-stone-200" />
                  <span className="px-4 text-xs font-mono uppercase text-stone-400">or join a friend</span>
                  <div className="flex-1 border-t border-stone-200" />
                </div>

                {/* Join Existing Room Option */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={joinInputCode}
                    onChange={(e) => setJoinInputCode(e.target.value)}
                    placeholder="Enter Room Code (e.g. whimsy-cherry-88)"
                    className="flex-1 px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm font-mono"
                  />
                  <button
                    onClick={handleGuestJoinRoom}
                    disabled={!joinInputCode.trim() || camera.status === 'requesting'}
                    className="px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-sm transition-all flex items-center space-x-2"
                  >
                    <span>Join</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Error alerts */}
              {(camera.errorMessage || duo.errorMessage) && (
                <div className="mt-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs text-left flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{camera.errorMessage || duo.errorMessage}</span>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* WAITING ROOM: Host is waiting for Friend to connect */}
        {duo.status === 'waiting' && (
          <div className="w-full max-w-lg my-auto py-8">
            <div className="bg-white rounded-3xl p-8 border border-pink-200 shadow-xl text-center">
              <div className="inline-block p-4 bg-pink-50 rounded-full mb-4 animate-bounce">
                <Smile className="w-10 h-10 text-pink-500" />
              </div>

              <h2 className="text-2xl font-hand font-bold text-stone-800 mb-1">
                Your Photobooth Room is Ready!
              </h2>
              <p className="text-stone-500 text-xs mb-6">
                Send this invite link or room code to your friend to start your video call:
              </p>

              <div className="bg-pink-50/70 p-4 rounded-2xl border border-pink-200 mb-6 flex flex-col items-center">
                <span className="text-xs font-mono text-pink-500 uppercase tracking-widest mb-1">Room Code</span>
                <span className="text-2xl font-mono font-bold text-pink-700 tracking-wider mb-3">
                  {duo.roomId}
                </span>

                <button
                  onClick={handleCopyLink}
                  className="w-full py-2.5 px-4 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-2"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Invite Link Copied!' : 'Copy Shareable Link ♡'}</span>
                </button>
              </div>

              {/* Live camera preview for host while waiting */}
              <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-stone-200 aspect-video max-w-xs mx-auto mb-6 bg-stone-100 shadow-inner flex items-center justify-center">
                <video
                  ref={(el) => {
                    camera.videoRef.current = el;
                    if (el) {
                      el.muted = true;
                      if (camera.stream && el.srcObject !== camera.stream) {
                        el.srcObject = camera.stream;
                        el.setAttribute('playsinline', 'true');
                        el.play().catch(() => {});
                      }
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${camera.facingMode === 'user' ? '-scale-x-100' : ''}`}
                />
                {!camera.stream && (
                  <div className="absolute inset-0 flex items-center justify-center bg-stone-100 text-stone-400 text-xs">
                    <Camera className="w-4 h-4 mr-1 animate-pulse" />
                    <span>Camera loading...</span>
                  </div>
                )}
                <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                  Your Camera Preview
                </span>
              </div>

              <div className="flex items-center justify-center space-x-2 text-stone-400 text-xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-pink-400" />
                <span>Waiting for your friend to enter the room...</span>
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE DUO CALL & PHOTOBOOTH */}
        {duo.status === 'connected' && (
          <div className="w-full flex flex-col items-center">
            {/* Viewfinder Split Screen: Side-by-Side Dual Video */}
            <div className="w-full max-w-4xl bg-stone-900 rounded-3xl p-3 shadow-2xl relative border-4 border-white mb-4 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 relative rounded-2xl overflow-hidden aspect-[4/3] md:aspect-[16/9] bg-stone-950">
                {/* Local Video Panel */}
                <div className="relative w-full h-full overflow-hidden bg-stone-900 flex items-center justify-center">
                  <video
                    ref={(el) => {
                      camera.videoRef.current = el;
                      if (el) {
                        el.muted = true;
                        if (camera.stream && el.srcObject !== camera.stream) {
                          el.srcObject = camera.stream;
                          el.setAttribute('playsinline', 'true');
                          el.play().catch(() => {});
                        }
                      }
                    }}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${camera.facingMode === 'user' ? '-scale-x-100' : ''}`}
                  />
                  {!camera.stream && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-stone-900/90 text-stone-400">
                      <Camera className="w-8 h-8 text-pink-400 mb-2 animate-bounce" />
                      <span className="text-xs font-hand text-pink-200">Starting your camera...</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-full flex items-center space-x-1.5 border border-white/20">
                    <span className="w-2 h-2 rounded-full bg-pink-400" />
                    <span className="font-medium">You</span>
                  </div>

                  {camera.hasMultipleCameras && (
                    <button
                      onClick={camera.switchCamera}
                      title="Flip camera"
                      className="absolute top-3 right-3 p-1.5 bg-black/60 backdrop-blur-md text-white rounded-full hover:bg-black/80 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Remote Video Panel */}
                <div className="relative w-full h-full overflow-hidden bg-stone-900 flex items-center justify-center">
                  <video
                    ref={(el) => {
                      duo.remoteVideoRef.current = el;
                      if (el) {
                        el.setAttribute('playsinline', 'true');
                        if (duo.remoteStream && el.srcObject !== duo.remoteStream) {
                          el.srcObject = duo.remoteStream;
                          el.play().catch(() => {});
                        }
                      }
                    }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover -scale-x-100"
                  />
                  {!duo.remoteStream && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-stone-900/90">
                      <div className="w-10 h-10 rounded-full bg-purple-900/50 flex items-center justify-center mb-2 animate-pulse">
                        <Sparkles className="w-5 h-5 text-purple-300" />
                      </div>
                      <span className="text-xs font-hand text-purple-200 font-bold mb-0.5">
                        Connecting to bestie's camera...
                      </span>
                      <span className="text-[10px] text-stone-400">
                        Almost ready to snap together ♡
                      </span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-full flex items-center space-x-1.5 border border-white/20">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span className="font-medium">Bestie ♡</span>
                  </div>
                </div>

                {/* Big Animated Countdown Overlay */}
                {currentCountdown !== null && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-20 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-pink-500/90 text-white flex items-center justify-center text-7xl font-hand font-bold shadow-2xl border-4 border-white animate-ping-once">
                      {currentCountdown}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="w-full max-w-4xl bg-white rounded-3xl p-4 shadow-lg border border-pink-100 flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Photo Count & Timer Settings */}
              <div className="flex items-center space-x-4">
                {/* Number of Poses Selector */}
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-mono text-stone-400 mb-1">Poses</span>
                  <div className="flex bg-stone-100 p-1 rounded-xl">
                    {[2, 3, 4, 5, 6].map((count) => (
                      <button
                        key={count}
                        onClick={() => handleSelectPoseCount(count)}
                        className={`w-7 h-7 text-xs font-bold rounded-lg transition-all ${
                          targetPhotoCount === count
                            ? 'bg-pink-500 text-white shadow-sm'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Countdown Timer Selector */}
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-mono text-stone-400 mb-1">Timer</span>
                  <div className="flex bg-stone-100 p-1 rounded-xl">
                    {[0, 3, 5, 10].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => setCountdownSeconds(sec)}
                        className={`px-2 h-7 text-xs font-bold rounded-lg transition-all ${
                          countdownSeconds === sec
                            ? 'bg-purple-500 text-white shadow-sm'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        {sec === 0 ? 'Off' : `${sec}s`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Shutter Button */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => triggerCountdownSequence(countdownSeconds, true)}
                  disabled={isCountingDown || capturedPhotos.length >= targetPhotoCount}
                  className="px-8 py-3.5 bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 disabled:opacity-50 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex items-center space-x-2 text-base font-hand"
                >
                  <Camera className="w-5 h-5" />
                  <span>
                    {isCountingDown
                      ? 'Posing...'
                      : capturedPhotos.length >= targetPhotoCount
                      ? 'All Poses Captured! ♡'
                      : `Snap Together (${capturedPhotos.length}/${targetPhotoCount})`}
                  </span>
                </button>
              </div>

              {/* Frame selection pill */}
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-mono text-stone-400">Frame:</span>
                <select
                  value={selectedFrameId}
                  onChange={(e) => handleSelectFrame(e.target.value as FrameId)}
                  className="bg-stone-100 text-stone-700 text-xs font-medium px-3 py-1.5 rounded-xl border-none focus:ring-2 focus:ring-pink-300 cursor-pointer"
                >
                  {FRAMES.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Captured Photos Preview Tray */}
            <div className="w-full max-w-4xl mt-6 bg-white/90 backdrop-blur-sm rounded-3xl p-5 border border-pink-100 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-pink-500" />
                  <span className="font-hand font-bold text-stone-800 text-base">
                    Captured Poses ({capturedPhotos.length}/{targetPhotoCount})
                  </span>
                </div>

                {capturedPhotos.length > 0 && (
                  <button
                    onClick={handleRetakeAll}
                    className="text-xs text-stone-400 hover:text-stone-700 flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Retake All</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {Array.from({ length: targetPhotoCount }).map((_, idx) => {
                  const photo = capturedPhotos[idx];
                  return (
                    <div
                      key={idx}
                      className="aspect-[4/3] rounded-xl overflow-hidden border-2 border-stone-200 bg-stone-50 flex items-center justify-center relative shadow-sm"
                    >
                      {photo ? (
                        <img
                          src={photo.dataUrl}
                          alt={`Pose ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-2 text-stone-300">
                          <Heart className="w-5 h-5 mx-auto mb-1 stroke-stone-300" />
                          <span className="text-[10px] font-mono">Pose {idx + 1}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Ready to Edit & Decorate Button */}
              {capturedPhotos.length >= targetPhotoCount && (
                <div className="mt-5 text-center">
                  <button
                    onClick={handleFinish}
                    className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl font-bold shadow-md hover:shadow-lg transition-all transform active:scale-95 inline-flex items-center justify-center space-x-2 text-base font-hand"
                  >
                    <span>Design & Decorate Our Strip ♡</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DISCONNECTED OR ERROR STATE */}
        {(duo.status === 'error' || duo.status === 'disconnected') && (
          <div className="w-full max-w-xl mx-auto py-8">
            <div className="bg-white rounded-3xl p-8 border-2 border-dashed border-rose-200 shadow-xl text-center">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                💔
              </div>
              <h2 className="text-2xl font-hand font-bold text-stone-800 mb-2">
                {duo.status === 'disconnected' ? 'Call Ended' : 'Connection Notice'}
              </h2>
              <p className="text-stone-600 text-sm max-w-md mx-auto mb-6">
                {duo.errorMessage || 'The connection was closed or could not be established.'}
              </p>
              <button
                onClick={() => {
                  duo.leaveRoom();
                  camera.stopCamera();
                  setUserRole('lobby');
                }}
                className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-bold text-sm shadow-md transition-all inline-flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Return to Lobby ♡</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
