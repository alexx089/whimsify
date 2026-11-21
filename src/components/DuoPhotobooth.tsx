import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCamera } from '../hooks/useCamera';
import { usePeerDuo, DuoConnectionStatus } from '../hooks/usePeerDuo';
import { FrameId, LayoutMode, CapturedPhoto, DuoSyncAction, GroupPeer } from '../types';
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
  RefreshCw,
  AlertCircle,
  Timer,
  Heart,
  Smile,
  UserPlus,
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
  const [selectedCapacity, setSelectedCapacity] = useState<number>(5); // Default 5 people
  const [userRole, setUserRole] = useState<'lobby' | 'host' | 'guest'>('lobby');

  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const remoteVideosMapRef = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Handle sync actions received across WebRTC mesh
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
        case 'CHANGE_MAX_PEOPLE':
          setSelectedCapacity(action.maxPeople);
          break;
        case 'FINISH_SESSION':
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

  // Sync local camera stream
  useEffect(() => {
    if (camera.videoRef.current && camera.stream) {
      if (camera.videoRef.current.srcObject !== camera.stream) {
        camera.videoRef.current.srcObject = camera.stream;
      }
      camera.videoRef.current.muted = true;
      camera.videoRef.current.setAttribute('playsinline', 'true');
      camera.videoRef.current.play().catch(() => {});
    }
  }, [camera.stream, duo.status]);

  // Sync all remote peers' video streams
  useEffect(() => {
    duo.remotePeers.forEach((peer) => {
      const videoEl = remoteVideosMapRef.current.get(peer.peerId);
      if (videoEl && peer.stream && videoEl.srcObject !== peer.stream) {
        videoEl.srcObject = peer.stream;
        videoEl.setAttribute('playsinline', 'true');
        videoEl.play().catch(() => {});
      }
    });
  }, [duo.remotePeers]);

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

  // Helper: Draw cute heart badge between grid panels
  const drawHeartBadge = (ctx: CanvasRenderingContext2D, cx: number, cy: number) => {
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#EC4899';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('♡', cx, cy);
    ctx.restore();
  };

  // Composite all connected participants (1 to 5 people) into a single photo
  const takeGroupSnapshot = (): string | null => {
    const localVideo = camera.videoRef.current;
    if (!localVideo) return null;

    let canvas = captureCanvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      captureCanvasRef.current = canvas;
    }

    // High resolution standard 4:3 canvas (1280 x 960)
    const W = 1280;
    const H = 960;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Fill background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);

    // Collect all active video elements
    const remoteVideos: HTMLVideoElement[] = [];
    duo.remotePeers.forEach((p) => {
      const v = remoteVideosMapRef.current.get(p.peerId);
      if (v && v.readyState >= v.HAVE_CURRENT_DATA) {
        remoteVideos.push(v);
      }
    });

    const allVideos: { video: HTMLVideoElement; mirror: boolean }[] = [
      { video: localVideo, mirror: camera.facingMode === 'user' },
      ...remoteVideos.map((v) => ({ video: v, mirror: true })),
    ];

    const N = allVideos.length;

    if (N === 1) {
      // Single person
      drawVideoCover(ctx, allVideos[0].video, 0, 0, W, H, allVideos[0].mirror);
    } else if (N === 2) {
      // 2 People: Split-screen (Left & Right)
      const halfW = W / 2;
      drawVideoCover(ctx, allVideos[0].video, 0, 0, halfW, H, allVideos[0].mirror);
      drawVideoCover(ctx, allVideos[1].video, halfW, 0, halfW, H, allVideos[1].mirror);

      // Divider line
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(halfW, 0);
      ctx.lineTo(halfW, H);
      ctx.stroke();

      drawHeartBadge(ctx, halfW, H / 2);
    } else if (N === 3) {
      // 3 People: 3 vertical strips side-by-side
      const colW = W / 3;
      for (let i = 0; i < 3; i++) {
        drawVideoCover(ctx, allVideos[i].video, i * colW, 0, colW, H, allVideos[i].mirror);
      }

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 6;
      for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(i * colW, 0);
        ctx.lineTo(i * colW, H);
        ctx.stroke();
        drawHeartBadge(ctx, i * colW, H / 2);
      }
    } else if (N === 4) {
      // 4 People: 2x2 Grid
      const halfW = W / 2;
      const halfH = H / 2;

      drawVideoCover(ctx, allVideos[0].video, 0, 0, halfW, halfH, allVideos[0].mirror);
      drawVideoCover(ctx, allVideos[1].video, halfW, 0, halfW, halfH, allVideos[1].mirror);
      drawVideoCover(ctx, allVideos[2].video, 0, halfH, halfW, halfH, allVideos[2].mirror);
      drawVideoCover(ctx, allVideos[3].video, halfW, halfH, halfW, halfH, allVideos[3].mirror);

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 6;
      // Vertical divider
      ctx.beginPath();
      ctx.moveTo(halfW, 0);
      ctx.lineTo(halfW, H);
      ctx.stroke();
      // Horizontal divider
      ctx.beginPath();
      ctx.moveTo(0, halfH);
      ctx.lineTo(W, halfH);
      ctx.stroke();

      drawHeartBadge(ctx, halfW, halfH);
    } else {
      // 5 People: Top row has 3, bottom row has 2
      const topColW = W / 3;
      const halfH = H / 2;
      const botColW = W / 2;

      // Top 3
      drawVideoCover(ctx, allVideos[0].video, 0, 0, topColW, halfH, allVideos[0].mirror);
      drawVideoCover(ctx, allVideos[1].video, topColW, 0, topColW, halfH, allVideos[1].mirror);
      drawVideoCover(ctx, allVideos[2].video, topColW * 2, 0, topColW, halfH, allVideos[2].mirror);

      // Bottom 2
      drawVideoCover(ctx, allVideos[3].video, 0, halfH, botColW, halfH, allVideos[3].mirror);
      drawVideoCover(ctx, allVideos[4].video, botColW, halfH, botColW, halfH, allVideos[4].mirror);

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 6;
      // Horizontal divider
      ctx.beginPath();
      ctx.moveTo(0, halfH);
      ctx.lineTo(W, halfH);
      ctx.stroke();

      // Top vertical dividers
      ctx.beginPath();
      ctx.moveTo(topColW, 0);
      ctx.lineTo(topColW, halfH);
      ctx.moveTo(topColW * 2, 0);
      ctx.lineTo(topColW * 2, halfH);
      ctx.stroke();

      // Bottom vertical divider
      ctx.beginPath();
      ctx.moveTo(botColW, halfH);
      ctx.lineTo(botColW, H);
      ctx.stroke();

      drawHeartBadge(ctx, W / 2, halfH);
    }

    return canvas.toDataURL('image/jpeg', 0.95);
  };

  // Perform single flash & capture
  const executeCapture = () => {
    setIsFlashing(true);
    sounds.playShutter();
    setTimeout(() => setIsFlashing(false), 400);

    const dataUrl = takeGroupSnapshot();
    if (!dataUrl) return;

    const newPhoto: CapturedPhoto = {
      id: Math.random().toString(36).substring(2, 9),
      dataUrl,
      timestamp: Date.now(),
    };

    setCapturedPhotos((prev) => [...prev, newPhoto]);
  };

  // Trigger synchronized countdown sequence
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

  // Host: Create Room with chosen capacity (audio + video enabled)
  const handleHostCreateRoom = async () => {
    setUserRole('host');
    await camera.startCamera('user', true);
  };

  // Guest: Join Room (audio + video enabled)
  const handleGuestJoinRoom = async () => {
    if (!joinInputCode.trim()) return;
    setUserRole('guest');
    await camera.startCamera('user', true);
  };

  // When camera stream becomes ready, trigger room creation or join
  useEffect(() => {
    if (camera.status === 'ready' && camera.stream && duo.status === 'idle') {
      if (userRole === 'host') {
        duo.createRoom(camera.stream, undefined, selectedCapacity);
      } else if (userRole === 'guest' && joinInputCode.trim()) {
        duo.joinRoom(joinInputCode.trim(), camera.stream);
      }
    }
  }, [camera.status, camera.stream, duo.status, userRole, joinInputCode, selectedCapacity]);

  // Copy invitation link to clipboard
  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?duo=${duo.roomId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    });
  };

  // Change frame & sync
  const handleSelectFrame = (id: FrameId) => {
    setSelectedFrameId(id);
    duo.sendSyncAction({ type: 'CHANGE_FRAME', frameId: id });
  };

  // Change pose count & sync
  const handleSelectPoseCount = (cnt: number) => {
    setTargetPhotoCount(cnt);
    setCapturedPhotos([]);
    duo.sendSyncAction({ type: 'CHANGE_POSES_COUNT', count: cnt });
  };

  // Change room capacity (Host only)
  const handleSelectCapacity = (cap: number) => {
    setSelectedCapacity(cap);
    duo.updateMaxPeople(cap);
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
      {/* Background audio elements for all remote peers to guarantee audible call voice */}
      {duo.remotePeers.map((peer) => (
        <audio
          key={`audio-${peer.peerId}`}
          ref={(audioEl) => {
            if (audioEl && peer.stream && audioEl.srcObject !== peer.stream) {
              audioEl.srcObject = peer.stream;
              audioEl.play().catch((e) => {
                console.warn('Audio play pending user interaction:', e);
              });
            }
          }}
          autoPlay
        />
      ))}

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
                Party Booth
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F6DCE5] text-[#8C4D64] font-bold">
                Up to {duo.maxPeople} Friends ♡
              </span>
            </div>
            <p className="text-xs text-[#7B6F85] mt-0.5 font-medium">
              Snap photobooth poses with your besties live from anywhere in the world!
            </p>
          </div>
        </div>

        {/* Room status badge & Call Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {duo.status === 'connected' ? (
            <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{duo.totalPeople} of {duo.maxPeople} Friends in Room ♡</span>
            </div>
          ) : duo.status === 'waiting' ? (
            <div className="flex items-center space-x-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1 rounded-full text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Waiting for friends... (1/{duo.maxPeople})</span>
            </div>
          ) : null}

          {duo.roomId && (
            <button
              onClick={handleCopyLink}
              title="Copy invite link to share with your friends"
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
                Group Photobooth Video Call!
              </h2>
              <p className="text-stone-500 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                Connect live with 2 to 5 friends from anywhere in the world. See each other live on video, chat, and snap matching group photobooth strips together in real-time!
              </p>

              {/* Room Capacity Selector (Host sets up to 5 people) */}
              <div className="bg-pink-50/60 p-4 rounded-2xl border border-pink-100 mb-6 text-left">
                <span className="text-xs font-bold text-pink-700 block mb-2">
                  👯‍♀️ How many people in your photobooth session?
                </span>
                <div className="flex gap-2">
                  {[2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSelectedCapacity(num)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                        selectedCapacity === num
                          ? 'bg-pink-500 border-pink-500 text-white shadow-sm'
                          : 'bg-white border-pink-200 text-stone-700 hover:bg-pink-100'
                      }`}
                    >
                      {num} People {num === 2 ? '(Duo)' : num === 5 ? '(Squad ♡)' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Host / Create Room Option */}
              <div className="space-y-4">
                <button
                  onClick={handleHostCreateRoom}
                  disabled={camera.status === 'requesting'}
                  className="w-full py-4 px-6 bg-gradient-to-r from-pink-400 via-rose-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white rounded-2xl font-bold shadow-md hover:shadow-lg transition-all transform active:scale-98 flex items-center justify-center space-x-3 text-base"
                >
                  <Users className="w-5 h-5" />
                  <span>Create {selectedCapacity}-Player Room & Invite Friends</span>
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

        {/* WAITING ROOM: Host waiting for Friends */}
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
                Share this link with up to {duo.maxPeople - 1} friends to join your group session:
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
                <span>Waiting for friends to join... (1 of {duo.maxPeople})</span>
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE GROUP CALL & PHOTOBOOTH */}
        {duo.status === 'connected' && (
          <div className="w-full flex flex-col items-center">
            {/* Dynamic Viewfinder: Adapts from 2 to 5 People */}
            <div className="w-full max-w-5xl bg-stone-900 rounded-3xl p-3 shadow-2xl relative border-4 border-white mb-4 overflow-hidden">
              <div
                className={`grid gap-2 relative rounded-2xl overflow-hidden aspect-[4/3] md:aspect-[16/9] bg-stone-950 ${
                  duo.totalPeople === 2
                    ? 'grid-cols-1 md:grid-cols-2'
                    : duo.totalPeople === 3
                    ? 'grid-cols-1 sm:grid-cols-3'
                    : duo.totalPeople === 4
                    ? 'grid-cols-2'
                    : 'grid-cols-2 md:grid-cols-3'
                }`}
              >
                {/* 1. Local Video Panel (You) */}
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

                {/* 2..N. Connected Remote Friends */}
                {duo.remotePeers.map((peer, idx) => (
                  <div
                    key={peer.peerId}
                    className="relative w-full h-full overflow-hidden bg-stone-900 flex items-center justify-center"
                  >
                    <video
                      ref={(el) => {
                        if (el) {
                          remoteVideosMapRef.current.set(peer.peerId, el);
                          el.muted = false;
                          el.volume = 1.0;
                          el.setAttribute('playsinline', 'true');
                          if (peer.stream && el.srcObject !== peer.stream) {
                            el.srcObject = peer.stream;
                            el.play().catch(() => {});
                          }
                        } else {
                          remoteVideosMapRef.current.delete(peer.peerId);
                        }
                      }}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover -scale-x-100"
                    />
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-full flex items-center space-x-1.5 border border-white/20">
                      <span className="w-2 h-2 rounded-full bg-purple-400" />
                      <span className="font-medium">{peer.name} ♡</span>
                    </div>
                  </div>
                ))}

                {/* Extra Slot Placeholder if room has open capacity */}
                {duo.totalPeople < duo.maxPeople && (
                  <div
                    onClick={handleCopyLink}
                    className="relative w-full h-full border-2 border-dashed border-stone-700 rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:bg-stone-800/50 transition-colors group"
                  >
                    <UserPlus className="w-7 h-7 text-pink-400 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-hand text-pink-300 font-bold">
                      {copiedLink ? 'Link Copied!' : '+ Invite Friend'}
                    </span>
                    <span className="text-[10px] text-stone-500 font-mono mt-0.5">
                      ({duo.maxPeople - duo.totalPeople} slot remaining)
                    </span>
                  </div>
                )}

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
            <div className="w-full max-w-5xl bg-white rounded-3xl p-4 shadow-lg border border-pink-100 flex flex-col lg:flex-row items-center justify-between gap-4">
              {/* Photo Count & Timer Settings */}
              <div className="flex flex-wrap items-center gap-4">
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

                {/* Room Capacity (Host can adjust 2 to 5) */}
                {duo.isHost && (
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-mono text-stone-400 mb-1">Max Friends</span>
                    <div className="flex bg-stone-100 p-1 rounded-xl">
                      {[2, 3, 4, 5].map((cap) => (
                        <button
                          key={cap}
                          onClick={() => handleSelectCapacity(cap)}
                          className={`w-7 h-7 text-xs font-bold rounded-lg transition-all ${
                            duo.maxPeople === cap
                              ? 'bg-rose-500 text-white shadow-sm'
                              : 'text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          {cap}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Shutter Button */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => triggerCountdownSequence(countdownSeconds, true)}
                  disabled={isCountingDown || capturedPhotos.length >= targetPhotoCount}
                  className="px-8 py-3.5 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex items-center space-x-2 text-base font-hand"
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
            <div className="w-full max-w-5xl mt-6 bg-white/90 backdrop-blur-sm rounded-3xl p-5 border border-pink-100 shadow-md">
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
                    className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 hover:from-purple-600 hover:to-rose-600 text-white rounded-2xl font-bold shadow-md hover:shadow-lg transition-all transform active:scale-95 inline-flex items-center justify-center space-x-2 text-base font-hand"
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
