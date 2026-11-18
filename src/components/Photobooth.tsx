import React, { useState, useEffect, useRef } from 'react';
import { useCamera } from '../hooks/useCamera';
import { FrameId, LayoutMode, CapturedPhoto } from '../types';
import { FRAMES } from '../utils/framesAndStickers';
import { sounds } from '../utils/audio';
import {
  Camera,
  RefreshCw,
  Timer,
  Sparkles,
  Layers,
  ArrowRight,
  RotateCcw,
  Upload,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

interface PhotoboothProps {
  initialFrameId?: FrameId;
  onFinishSession: (photos: CapturedPhoto[], frameId: FrameId, layout: LayoutMode) => void;
  onNavigateHome: () => void;
}

export const Photobooth: React.FC<PhotoboothProps> = ({
  initialFrameId = 'classic-white',
  onFinishSession,
  onNavigateHome,
}) => {
  const {
    status,
    errorMessage,
    facingMode,
    hasMultipleCameras,
    videoRef,
    startCamera,
    stopCamera,
    switchCamera,
  } = useCamera();

  const [selectedFrameId, setSelectedFrameId] = useState<FrameId>(initialFrameId);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('strip');
  const [countdownSeconds, setCountdownSeconds] = useState<number>(3); // 0, 3, 5, 10
  const [currentCountdown, setCurrentCountdown] = useState<number | null>(null);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [targetPhotoCount, setTargetPhotoCount] = useState<number>(4); // User can choose from 2 to 6!
  const [isFlashing, setIsFlashing] = useState(false);
  const [selectedPoseSlot, setSelectedPoseSlot] = useState<number | null>(null);

  // Hidden canvas for taking high-res snapshot from video stream
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Clean up camera when unmounting
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Trigger snapshot from video
  const takeSnapshot = (): string | null => {
    const video = videoRef.current;
    if (!video || video.readyState < video.HAVE_CURRENT_DATA) return null;

    let canvas = captureCanvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      captureCanvasRef.current = canvas;
    }

    const vw = video.videoWidth || 1280;
    const vh = video.videoHeight || 720;
    canvas.width = vw;
    canvas.height = vh;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Flip horizontally if front-facing camera
    if (facingMode === 'user') {
      ctx.translate(vw, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, vw, vh);

    return canvas.toDataURL('image/jpeg', 0.95);
  };

  // Perform single flash & capture
  const executeCapture = (slotIndex?: number) => {
    setIsFlashing(true);
    sounds.playShutter();
    setTimeout(() => setIsFlashing(false), 400);

    const dataUrl = takeSnapshot();
    if (!dataUrl) return;

    const newPhoto: CapturedPhoto = {
      id: Math.random().toString(36).substring(2, 9),
      dataUrl,
      timestamp: Date.now(),
    };

    setCapturedPhotos((prev) => {
      if (typeof slotIndex === 'number' && slotIndex < prev.length) {
        // Retake a specific slot
        const updated = [...prev];
        updated[slotIndex] = newPhoto;
        return updated;
      } else {
        return [...prev, newPhoto];
      }
    });
  };

  // Multi-shot countdown sequence
  const startCaptureSequence = () => {
    if (status !== 'ready') return;
    setIsCountingDown(true);

    const shootNext = (currentCount: number) => {
      if (currentCount >= targetPhotoCount) {
        setIsCountingDown(false);
        setCurrentCountdown(null);
        return;
      }

      let count = countdownSeconds;
      if (count === 0) {
        // Instant snapshot
        executeCapture(currentCount);
        if (currentCount + 1 < targetPhotoCount) {
          setTimeout(() => shootNext(currentCount + 1), 1200);
        } else {
          setIsCountingDown(false);
        }
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
          executeCapture(currentCount);

          if (currentCount + 1 < targetPhotoCount) {
            // Give 1.5 seconds breather before next countdown
            setTimeout(() => {
              shootNext(currentCount + 1);
            }, 1400);
          } else {
            setIsCountingDown(false);
          }
        }
      }, 1000);
    };

    // If starting fresh
    if (capturedPhotos.length >= targetPhotoCount) {
      setCapturedPhotos([]);
    }
    shootNext(capturedPhotos.length >= targetPhotoCount ? 0 : capturedPhotos.length);
  };

  // Retake a single slot with countdown
  const retakeSingleSlot = (slotIdx: number) => {
    setSelectedPoseSlot(slotIdx);
    let count = countdownSeconds;
    if (count === 0) {
      executeCapture(slotIdx);
      setSelectedPoseSlot(null);
      return;
    }
    setIsCountingDown(true);
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
        executeCapture(slotIdx);
        setSelectedPoseSlot(null);
      }
    }, 1000);
  };

  // File upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCapturedPhotos((prev) => [
            ...prev,
            {
              id: Math.random().toString(36).substring(2, 9),
              dataUrl: event.target!.result as string,
              timestamp: Date.now(),
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const selectedFrame = FRAMES.find((f) => f.id === selectedFrameId) || FRAMES[0];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-20 space-y-8">
      
      {/* Shutter White Flash Overlay */}
      {isFlashing && (
        <div className="fixed inset-0 bg-white z-50 pointer-events-none animate-flash" />
      )}

      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#F6DCE5] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📸</span>
            <span className="font-handwritten text-3xl font-bold text-[#51465A]">
              Photobooth Studio
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F6DCE5] text-[#8C4D64] font-bold">
              Pose & Smile ♡
            </span>
          </div>
          <p className="text-xs text-[#7B6F85] mt-0.5 font-medium">
            Take {targetPhotoCount} poses for your {selectedFrame.name} photostrip.
          </p>
        </div>

        {/* Number of Photos (2 - 6) & Layout Style */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Photos Count Selector (2 - 6) */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-full border border-[#DDD5F5] shadow-xs">
            <span className="text-[11px] font-bold text-[#8C4D64] pl-2 pr-1">
              Photos:
            </span>
            {[2, 3, 4, 5, 6].map((count) => (
              <button
                key={count}
                disabled={isCountingDown}
                onClick={() => {
                  setTargetPhotoCount(count);
                  if (capturedPhotos.length > count) {
                    setCapturedPhotos(capturedPhotos.slice(0, count));
                  }
                }}
                className={`w-7 h-7 rounded-full text-xs font-bold transition-all flex items-center justify-center ${
                  targetPhotoCount === count
                    ? 'bg-[#8C4D64] text-white shadow-xs'
                    : 'text-[#7B6F85] hover:text-[#51465A] hover:bg-[#F6DCE5]/40'
                }`}
                title={`Select ${count} photos`}
              >
                {count}
              </button>
            ))}
          </div>

          {/* Layout Mode Selector */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-[#DDD5F5] shadow-xs">
            {[
              { id: 'strip', label: 'Strip' },
              { id: 'grid', label: 'Grid' },
              { id: 'polaroid', label: 'Polaroid' },
            ].map((mode) => (
              <button
                key={mode.id}
                disabled={isCountingDown}
                onClick={() => {
                  setLayoutMode(mode.id as LayoutMode);
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  layoutMode === mode.id || (mode.id === 'strip' && layoutMode.startsWith('strip')) || (mode.id === 'grid' && layoutMode.startsWith('grid'))
                    ? 'bg-[#51465A] text-white shadow-xs'
                    : 'text-[#7B6F85] hover:text-[#51465A] hover:bg-gray-100'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN VIEWPORT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT / CENTER: Camera Viewfinder & Controls (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* CAMERA CONTAINER */}
          <div className="relative aspect-[4/3] w-full rounded-3xl overflow-hidden bg-[#2D2833] border-4 border-white shadow-soft-lg flex items-center justify-center">
            
            {/* Hidden video element that streams the webcam */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${
                facingMode === 'user' ? '-scale-x-100' : ''
              } ${status === 'ready' ? 'block' : 'hidden'}`}
            />

            {/* Live Camera Viewfinder Overlay when ready */}
            {status === 'ready' && (
              <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
                
                {/* Top Viewfinder HUD */}
                <div className="flex items-center justify-between text-white/90 drop-shadow-md">
                  <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>LIVE 30FPS</span>
                  </div>

                  <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium">
                    <span>Frame:</span>
                    <span className="font-bold text-[#FFF0B8]">{selectedFrame.name}</span>
                  </div>
                </div>

                {/* Center Framing Guides */}
                <div className="absolute inset-12 border border-white/20 rounded-2xl pointer-events-none flex items-center justify-center">
                  <div className="w-6 h-6 border-t-2 border-l-2 border-white/60 absolute top-0 left-0" />
                  <div className="w-6 h-6 border-t-2 border-r-2 border-white/60 absolute top-0 right-0" />
                  <div className="w-6 h-6 border-b-2 border-l-2 border-white/60 absolute bottom-0 left-0" />
                  <div className="w-6 h-6 border-b-2 border-r-2 border-white/60 absolute bottom-0 right-0" />
                  <div className="w-3 h-3 rounded-full border border-white/40" />
                </div>

                {/* Bottom Viewfinder Progress */}
                <div className="flex items-center justify-between text-white/90 drop-shadow-md">
                  <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono">
                    Pose {capturedPhotos.length} / {targetPhotoCount}
                  </div>
                  <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono">
                    Timer: {countdownSeconds}s
                  </div>
                </div>
              </div>
            )}

            {/* COUNTDOWN NUMBER OVERLAY */}
            {currentCountdown !== null && (
              <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px] z-30 flex flex-col items-center justify-center">
                <div className="text-8xl sm:text-9xl font-bold font-display text-white animate-bounce drop-shadow-lg">
                  {currentCountdown}
                </div>
                <p className="font-handwritten text-3xl font-bold text-[#FFF0B8] mt-3 animate-pulse">
                  Get ready to pose! ♡
                </p>
              </div>
            )}

            {/* STATE 1: IDLE - Friendly Camera Request Prompt */}
            {status === 'idle' && (
              <div className="p-8 text-center max-w-md bg-[#FFF9F0]/95 backdrop-blur-md rounded-2xl border-2 border-[#F6DCE5] shadow-sm m-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#F6DCE5] to-[#DDD5F5] mx-auto flex items-center justify-center text-3xl shadow-sm mb-4">
                  🎀
                </div>
                <h3 className="font-handwritten text-3xl font-bold text-[#51465A] mb-2">
                  Ready for your close-up?
                </h3>
                <p className="text-xs sm:text-sm text-[#7B6F85] leading-relaxed mb-6">
                  Whimsy Booth needs camera permission to snap your cute photobooth photos.
                  All images stay 100% private in your browser.
                </p>
                <button
                  onClick={() => startCamera('user')}
                  className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#F6DCE5] via-[#DDD5F5] to-[#DCEBFA] hover:from-[#f3cbd8] hover:via-[#d0c6f1] text-[#51465A] font-bold text-base shadow-soft hover:shadow-soft-lg transition-all hover:scale-105 flex items-center justify-center gap-2 border border-white"
                >
                  <Camera className="w-5 h-5 text-[#8C4D64]" />
                  <span>Allow Camera Access</span>
                </button>

                <div className="mt-4 pt-4 border-t border-[#F6DCE5] flex items-center justify-center gap-2">
                  <label className="cursor-pointer text-xs font-semibold text-[#8C4D64] hover:underline flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Or upload photos from device</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* STATE 2: REQUESTING */}
            {status === 'requesting' && (
              <div className="p-8 text-center text-white space-y-3">
                <div className="w-12 h-12 border-4 border-[#DDD5F5] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-semibold">
                  Waiting for browser camera permission...
                </p>
                <p className="text-xs text-white/70">
                  Please click &ldquo;Allow&rdquo; in the pop-up prompt in your browser address bar.
                </p>
              </div>
            )}

            {/* STATE 3: DENIED */}
            {status === 'denied' && (
              <div className="p-8 text-center max-w-md bg-white rounded-2xl border-2 border-[#E89CB5] shadow-lg m-4 space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#FFF5F8] text-[#8C4D64] mx-auto flex items-center justify-center">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-lg text-[#51465A]">
                  Camera Access Denied
                </h3>
                <p className="text-xs text-[#7B6F85] leading-relaxed">
                  {errorMessage ||
                    'Camera permission was blocked. To fix this, click the lock or camera icon in your address bar and select &ldquo;Allow&rdquo;.'}
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => startCamera('user')}
                    className="px-5 py-2.5 rounded-full bg-[#51465A] text-white text-xs font-bold hover:bg-black transition-all"
                  >
                    Try Again
                  </button>
                  <label className="cursor-pointer px-5 py-2.5 rounded-full bg-[#F6DCE5] text-[#8C4D64] text-xs font-bold hover:bg-[#ecc7d4] transition-all flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Instead</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* STATE 4: UNAVAILABLE / ERROR */}
            {(status === 'unavailable' || status === 'error') && (
              <div className="p-8 text-center max-w-md bg-white rounded-2xl border-2 border-[#DDD5F5] shadow-lg m-4 space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#F5F2FC] text-[#584C7B] mx-auto flex items-center justify-center">
                  <HelpCircle className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-lg text-[#51465A]">
                  Camera Unavailable
                </h3>
                <p className="text-xs text-[#7B6F85] leading-relaxed">
                  {errorMessage || 'Unable to connect to a camera.'}
                </p>
                <div className="pt-2">
                  <label className="cursor-pointer px-6 py-3 rounded-full bg-gradient-to-r from-[#F6DCE5] to-[#DDD5F5] text-[#51465A] font-bold text-sm hover:scale-105 transition-all inline-flex items-center gap-2 border border-white">
                    <Upload className="w-4 h-4 text-[#8C4D64]" />
                    <span>Upload Photos from Device</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </div>
            )}

          </div>

          {/* CAMERA CONTROLS TOOLBAR */}
          <div className="bg-white/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-[#F6DCE5] shadow-sm flex flex-wrap items-center justify-between gap-4">
            
            {/* Timer Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#7B6F85] flex items-center gap-1">
                <Timer className="w-3.5 h-3.5 text-[#E89CB5]" />
                <span>Timer:</span>
              </span>
              <div className="flex bg-[#FFF9F0] p-1 rounded-full border border-[#DDD5F5]">
                {[0, 3, 5, 10].map((t) => (
                  <button
                    key={t}
                    disabled={isCountingDown}
                    onClick={() => setCountdownSeconds(t)}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                      countdownSeconds === t
                        ? 'bg-[#E89CB5] text-white shadow-xs'
                        : 'text-[#7B6F85] hover:text-[#51465A]'
                    }`}
                  >
                    {t === 0 ? 'Off' : `${t}s`}
                  </button>
                ))}
              </div>
            </div>

            {/* Poses Count (2 - 6) */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#7B6F85] flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-[#A78BFA]" />
                <span>Poses:</span>
              </span>
              <div className="flex bg-[#FFF9F0] p-1 rounded-full border border-[#DDD5F5]">
                {[2, 3, 4, 5, 6].map((count) => (
                  <button
                    key={count}
                    disabled={isCountingDown}
                    onClick={() => {
                      setTargetPhotoCount(count);
                      if (capturedPhotos.length > count) {
                        setCapturedPhotos(capturedPhotos.slice(0, count));
                      }
                    }}
                    className={`w-7 h-7 rounded-full text-xs font-bold transition-all flex items-center justify-center ${
                      targetPhotoCount === count
                        ? 'bg-[#8C4D64] text-white shadow-xs'
                        : 'text-[#7B6F85] hover:text-[#51465A]'
                    }`}
                    title={`Snap ${count} photos`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Central Big Capture Button */}
            <div className="flex items-center gap-3 mx-auto sm:mx-0">
              <button
                disabled={status !== 'ready' || isCountingDown}
                onClick={startCaptureSequence}
                className={`group px-7 py-3.5 rounded-full font-bold text-base sm:text-lg flex items-center gap-3 transition-all duration-300 shadow-soft border-2 border-white ${
                  status === 'ready' && !isCountingDown
                    ? 'bg-gradient-to-r from-[#F6DCE5] via-[#DDD5F5] to-[#DCEBFA] hover:scale-105 hover:shadow-soft-lg text-[#51465A] cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-sm group-hover:scale-110 transition-transform">
                  📸
                </div>
                <span>
                  {capturedPhotos.length === 0
                    ? `Snap ${targetPhotoCount} Poses`
                    : capturedPhotos.length < targetPhotoCount
                    ? `Snap Pose ${capturedPhotos.length + 1}`
                    : 'Retake Session'}
                </span>
              </button>
            </div>

            {/* Switch Camera (if available) / Stop Camera */}
            <div className="flex items-center gap-2">
              {hasMultipleCameras && (
                <button
                  disabled={isCountingDown}
                  onClick={switchCamera}
                  title="Flip camera"
                  className="p-2.5 rounded-full bg-[#FFF9F0] hover:bg-[#F6DCE5] text-[#51465A] border border-[#DDD5F5] transition-all hover:scale-105"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}

              {status === 'ready' && (
                <button
                  onClick={stopCamera}
                  title="Pause Camera"
                  className="px-3.5 py-2 rounded-full bg-[#FFF9F0] hover:bg-gray-100 text-[#7B6F85] hover:text-[#51465A] text-xs font-semibold border border-gray-200"
                >
                  Turn Off
                </button>
              )}
            </div>
          </div>

          {/* Quick Frame Palette Drawer */}
          <div className="bg-white/70 p-4 rounded-2xl border border-[#DDD5F5] space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-[#51465A]">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#A78BFA]" />
                <span>Selected Frame: {selectedFrame.name}</span>
              </span>
              <span className="text-[11px] text-[#7B6F85] font-normal">
                (Can be changed anytime in the editor)
              </span>
            </div>

            <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
              {FRAMES.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFrameId(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all border ${
                    selectedFrameId === f.id
                      ? 'border-[#51465A] bg-[#51465A] text-white shadow-xs'
                      : 'border-[#DDD5F5] bg-white text-[#7B6F85] hover:bg-[#F6DCE5]/40'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT: Live Captured Strip Preview & Action Card (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          
          <div className="bg-white p-5 rounded-3xl border-2 border-[#F6DCE5] shadow-soft space-y-4">
            
            <div className="flex items-center justify-between border-b border-[#F6DCE5] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎞️</span>
                <h4 className="font-handwritten text-2xl font-bold text-[#51465A]">
                  Your Photostrip
                </h4>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#F6DCE5] text-[#8C4D64]">
                {capturedPhotos.length} / {targetPhotoCount}
              </span>
            </div>

            {/* Strip Mini Slots */}
            <div
              className="p-3.5 rounded-2xl shadow-inner border border-black/5 space-y-2.5 transition-colors"
              style={{
                backgroundColor: selectedFrame.backgroundColor,
                borderColor: selectedFrame.borderColor,
              }}
            >
              {Array.from({ length: targetPhotoCount }).map((_, idx) => {
                const photo = capturedPhotos[idx];
                return (
                  <div
                    key={idx}
                    className="aspect-[4/3] rounded-lg bg-white/70 overflow-hidden relative border border-black/5 flex items-center justify-center group"
                  >
                    {photo ? (
                      <>
                        <img
                          src={photo.dataUrl}
                          alt={`Pose ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {/* Hover Retake button */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={() => retakeSingleSlot(idx)}
                            disabled={isCountingDown || status !== 'ready'}
                            className="p-1.5 rounded-full bg-white text-[#51465A] hover:scale-110 transition-all text-xs font-bold shadow flex items-center gap-1"
                            title="Retake this pose"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-[#8C4D64]" />
                            <span className="text-[10px]">Retake</span>
                          </button>
                        </div>
                        <div className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/80 text-[#51465A]">
                          0{idx + 1}
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-2">
                        <span className="text-lg opacity-40">✨</span>
                        <p className="text-[10px] font-mono text-[#7B6F85] opacity-70">
                          Pose 0{idx + 1}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Completion & Next Action */}
            {capturedPhotos.length >= targetPhotoCount ? (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>All poses snapped! Ready to customize.</span>
                </div>

                <button
                  onClick={() =>
                    onFinishSession(capturedPhotos, selectedFrameId, layoutMode)
                  }
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#F6DCE5] via-[#DDD5F5] to-[#DCEBFA] hover:from-[#f3cbd8] hover:via-[#d0c6f1] text-[#51465A] font-bold text-base shadow-soft hover:shadow-soft-lg transition-all hover:scale-105 flex items-center justify-center gap-2 border-2 border-white"
                >
                  <Sparkles className="w-4 h-4 text-[#8C4D64]" />
                  <span>Customize & Download</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setCapturedPhotos([])}
                  className="w-full py-2 text-xs font-semibold text-[#7B6F85] hover:text-[#51465A] flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake entire session</span>
                </button>
              </div>
            ) : (
              <div className="p-3 bg-[#FFF9F0] rounded-xl border border-[#F6DCE5] text-center">
                <p className="text-xs text-[#7B6F85]">
                  Snap {targetPhotoCount - capturedPhotos.length} more {targetPhotoCount - capturedPhotos.length === 1 ? 'photo' : 'photos'} to complete your strip.
                </p>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};
