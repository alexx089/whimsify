import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useCamera } from '../hooks/useCamera';
import { WebGLFisheyeRenderer } from '../utils/webglFisheye';
import { renderMirrorSelfieKeepsake } from '../utils/mirrorRenderer';
import { sounds } from '../utils/audio';
import {
  CircleDot,
  Camera,
  Download,
  RotateCcw,
  Sparkles,
  Sliders,
  Timer,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Type,
  Upload
} from 'lucide-react';

interface MirrorMagicProps {
  onNavigateHome: () => void;
}

export const MirrorMagic: React.FC<MirrorMagicProps> = ({ onNavigateHome }) => {
  const {
    status,
    errorMessage,
    videoRef,
    startCamera,
    stopCamera,
    facingMode,
    switchCamera,
    hasMultipleCameras,
  } = useCamera();

  const [isConvexActive, setIsConvexActive] = useState<boolean>(true);
  const [isUpsideDown, setIsUpsideDown] = useState<boolean>(false);
  const [distortionLevel, setDistortionLevel] = useState<number>(0.75); // 0.2 to 1.2
  const [mirrorFrameStyle, setMirrorFrameStyle] = useState<'traffic-red' | 'vintage-gold' | 'pearl-bubble' | 'pastel-ribbon'>('traffic-red');
  const [countdownSeconds, setCountdownSeconds] = useState<number>(3);
  const [currentCountdown, setCurrentCountdown] = useState<number | null>(null);
  const [isCountingDown, setIsCountingDown] = useState<boolean>(false);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);

  // Captured selfie state
  const [capturedMirrorDataUrl, setCapturedMirrorDataUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState<string>('road convex mirror selfie ♡');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Canvas refs
  const glCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<WebGLFisheyeRenderer | null>(null);

  // Setup WebGL renderer on canvas mount
  useEffect(() => {
    if (glCanvasRef.current && !rendererRef.current) {
      rendererRef.current = new WebGLFisheyeRenderer(glCanvasRef.current);
    }

    return () => {
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
    };
  }, []);

  // Start or restart WebGL render loop when camera is ready
  useEffect(() => {
    if (status === 'ready' && videoRef.current && rendererRef.current) {
      const renderer = rendererRef.current;
      const video = videoRef.current;

      renderer.startLoop(
        video,
        () => distortionLevel,
        () => isConvexActive,
        () => isUpsideDown
      );

      return () => {
        renderer.stopLoop();
      };
    }
  }, [status, distortionLevel, isConvexActive, isUpsideDown, videoRef]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Capture mirror selfie snapshot
  const executeMirrorCapture = () => {
    setIsFlashing(true);
    sounds.playShutter();
    setTimeout(() => setIsFlashing(false), 400);

    const canvas = glCanvasRef.current;
    if (!canvas) return;

    // Render keepsake image with mirror border
    const finalDataUrl = renderMirrorSelfieKeepsake({
      sourceCanvas: canvas,
      caption,
      frameStyle: mirrorFrameStyle,
    });

    setCapturedMirrorDataUrl(finalDataUrl);
    sounds.playCelebration();
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#FFF0B8', '#F6DCE5', '#DDD5F5', '#DCEBFA'],
    });
  };

  // Countdown timer trigger
  const handleStartCapture = () => {
    if (status !== 'ready' || isCountingDown) return;

    if (countdownSeconds === 0) {
      executeMirrorCapture();
      return;
    }

    setIsCountingDown(true);
    let count = countdownSeconds;
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
        executeMirrorCapture();
      }
    }, 1000);
  };

  // Download high-res keepsake
  const handleDownload = () => {
    if (!capturedMirrorDataUrl) return;
    const a = document.createElement('a');
    a.href = capturedMirrorDataUrl;
    a.download = `whimsy_mirror_selfie_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Retake mirror selfie
  const handleRetake = () => {
    setCapturedMirrorDataUrl(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-20 space-y-8">
      
      {/* Shutter Flash */}
      {isFlashing && (
        <div className="fixed inset-0 bg-white z-50 pointer-events-none animate-flash" />
      )}

      {/* Top Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF0B8] text-[#735F1A] text-xs font-bold">
          <CircleDot className="w-3.5 h-3.5" />
          <span>Mirror Magic Studio</span>
        </div>
        <h1 className="font-handwritten text-4xl sm:text-5xl font-bold text-[#51465A]">
          Convex Mirror Selfie ♡
        </h1>
        <p className="text-xs sm:text-sm text-[#7B6F85]">
          Aesthetic spherical fisheye distortion that curves and wraps your selfie like a vintage convex mirror.
        </p>
      </div>

      {/* MAIN MIRROR INTERACTION AREA */}
      <div className="flex flex-col items-center">
        
        {/* Hidden video tag for camera feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="hidden"
        />

        {/* IF A PHOTO IS CAPTURED: Show Review & Download Card */}
        {capturedMirrorDataUrl ? (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-[#DDD5F5] shadow-soft-lg max-w-md w-full text-center space-y-5 animate-fadeIn">
            
            <div className="flex items-center justify-between border-b border-[#F6DCE5] pb-3">
              <span className="font-handwritten text-2xl font-bold text-[#51465A]">
                Your Mirror Keepsake
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FFF0B8] text-[#735F1A] font-bold">
                Ready to Save ♡
              </span>
            </div>

            {/* Rendered Keepsake Image */}
            <div className="rounded-2xl overflow-hidden shadow-soft border border-black/5 bg-[#FFF9F0] p-2">
              <img
                src={capturedMirrorDataUrl}
                alt="Convex Mirror Keepsake"
                className="w-full h-auto rounded-xl"
              />
            </div>

            {/* Custom caption re-render */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-[#51465A] flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-[#E89CB5]" />
                <span>Caption on Keepsake:</span>
              </label>
              <input
                type="text"
                maxLength={35}
                value={caption}
                onChange={(e) => {
                  setCaption(e.target.value);
                  // Update current render
                  if (glCanvasRef.current) {
                    const updated = renderMirrorSelfieKeepsake({
                      sourceCanvas: glCanvasRef.current,
                      caption: e.target.value,
                      frameStyle: mirrorFrameStyle,
                    });
                    setCapturedMirrorDataUrl(updated);
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-[#DDD5F5] text-xs font-handwritten text-base font-bold text-[#51465A]"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleDownload}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#FFF0B8] via-[#DDD5F5] to-[#F6DCE5] hover:from-[#fceba7] hover:to-[#ecc7d4] text-[#51465A] font-bold text-base shadow-soft hover:shadow-soft-lg transition-all hover:scale-105 flex items-center justify-center gap-2 border-2 border-white"
              >
                <Download className="w-4 h-4 text-[#8C4D64]" />
                <span>Download Mirror Keepsake</span>
              </button>

              <button
                onClick={handleRetake}
                className="w-full py-2.5 rounded-full bg-white hover:bg-[#FFF5F8] text-[#7B6F85] hover:text-[#51465A] text-xs font-semibold border border-[#DDD5F5] transition-all flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Selfie</span>
              </button>
            </div>

          </div>
        ) : (
          /* LIVE CONVEX MIRROR VIEWFINDER */
          <div className="space-y-8 w-full flex flex-col items-center">
            
            {/* THE CIRCULAR CONVEX MIRROR */}
            <div className="relative">
              
              {/* Top Deco: Curved Road Mirror Sun Visor Hood OR Ribbon Bow */}
              {mirrorFrameStyle === 'traffic-red' ? (
                <div className="absolute -top-7 sm:-top-9 left-1/2 -translate-x-1/2 w-[114%] h-24 sm:h-28 pointer-events-none z-30 drop-shadow-md">
                  <svg viewBox="0 0 340 100" className="w-full h-full">
                    <defs>
                      <linearGradient id="visorGradLive" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#FA542A" />
                        <stop offset="35%" stopColor="#DE3B1B" />
                        <stop offset="85%" stopColor="#B8280C" />
                        <stop offset="100%" stopColor="#7E1705" />
                      </linearGradient>
                      <linearGradient id="visorLipLive" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#DE3B1B" />
                        <stop offset="50%" stopColor="#FFA694" />
                        <stop offset="100%" stopColor="#DE3B1B" />
                      </linearGradient>
                    </defs>
                    {/* Outer curved visor hood shape */}
                    <path
                      d="M 12 85 C 20 28, 85 8, 170 8 C 255 8, 320 28, 328 85 C 300 48, 240 30, 170 30 C 100 30, 40 48, 12 85 Z"
                      fill="url(#visorGradLive)"
                      stroke="#9E1F08"
                      strokeWidth="2.5"
                    />
                    {/* Specular highlight ridge on visor lip */}
                    <path
                      d="M 22 78 C 45 34, 105 14, 170 14 C 235 14, 295 34, 318 78"
                      fill="none"
                      stroke="url(#visorLipLive)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              ) : (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl z-20 animate-float pointer-events-none">
                  🎀
                </div>
              )}

              {/* Mirror Outer Vintage / Road Traffic Border */}
              <div
                className={`w-72 h-72 sm:w-96 sm:h-96 md:w-[420px] md:h-[420px] rounded-full p-4 sm:p-5 shadow-soft-lg flex items-center justify-center border-4 border-white transition-all duration-500 relative ${
                  mirrorFrameStyle === 'traffic-red'
                    ? 'bg-gradient-to-br from-[#FA542A] via-[#E03816] to-[#991B05] shadow-[0_20px_50px_rgba(216,58,30,0.35)]'
                    : mirrorFrameStyle === 'vintage-gold'
                    ? 'bg-gradient-to-br from-[#E6CA65] via-[#FFF3A8] to-[#B89228]'
                    : mirrorFrameStyle === 'pearl-bubble'
                    ? 'bg-gradient-to-br from-[#DDD5F5] via-[#F6DCE5] to-[#C2B3EB]'
                    : 'bg-gradient-to-br from-[#F6DCE5] via-[#FFF0F5] to-[#E89CB5]'
                }`}
              >
                
                {/* Mirror Inner Bevel / Reflection Rim */}
                <div className="w-full h-full rounded-full p-2 bg-[#1C1822] shadow-inner flex items-center justify-center relative overflow-hidden">
                  
                  {/* WebGL Canvas for 60fps Fisheye Shader */}
                  <canvas
                    ref={glCanvasRef}
                    className={`w-full h-full rounded-full object-cover transition-transform duration-300 ${
                      status === 'ready' ? 'block' : 'hidden'
                    }`}
                  />

                  {/* Top Visor Cast Shadow on mirror surface (when in traffic-red mode) */}
                  {mirrorFrameStyle === 'traffic-red' && (
                    <div className="absolute inset-x-0 top-0 h-24 sm:h-32 bg-gradient-to-b from-black/60 via-black/25 to-transparent pointer-events-none rounded-t-full z-10" />
                  )}

                  {/* Glass Glossy Crescent Sheen Overlay */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-white/5 to-transparent pointer-events-none" />

                  {/* Spherical Rim Vignette */}
                  <div className="absolute inset-0 rounded-full shadow-[inset_0_0_40px_rgba(0,0,0,0.5)] pointer-events-none" />

                  {/* COUNTDOWN OVERLAY */}
                  {currentCountdown !== null && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-30 flex flex-col items-center justify-center">
                      <div className="text-7xl sm:text-8xl font-bold font-display text-white animate-bounce drop-shadow-lg">
                        {currentCountdown}
                      </div>
                      <p className="font-handwritten text-2xl font-bold text-[#FFF0B8] mt-2 animate-pulse">
                        Smile in the mirror! ♡
                      </p>
                    </div>
                  )}

                  {/* STATE 1: IDLE - Camera Permission Prompt */}
                  {status === 'idle' && (
                    <div className="p-6 text-center max-w-xs text-white z-10 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md mx-auto flex items-center justify-center text-2xl">
                        🪞
                      </div>
                      <h4 className="font-handwritten text-2xl font-bold text-[#FFF0B8]">
                        Mirror Mirror...
                      </h4>
                      <p className="text-xs text-white/80 leading-relaxed">
                        Click below to enable your camera and step into the convex mirror!
                      </p>
                      <button
                        onClick={() => startCamera('user')}
                        className="w-full py-2.5 px-4 rounded-full bg-gradient-to-r from-[#FFF0B8] to-[#DDD5F5] hover:scale-105 text-[#51465A] font-bold text-xs shadow transition-all border border-white"
                      >
                        Activate Mirror Camera
                      </button>
                    </div>
                  )}

                  {/* STATE 2: REQUESTING */}
                  {status === 'requesting' && (
                    <div className="p-6 text-center text-white z-10 space-y-2">
                      <div className="w-8 h-8 border-3 border-[#FFF0B8] border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-xs font-semibold">
                        Requesting camera permission...
                      </p>
                    </div>
                  )}

                  {/* STATE 3: DENIED */}
                  {status === 'denied' && (
                    <div className="p-6 text-center text-white z-10 space-y-2">
                      <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                      <h4 className="font-bold text-xs">Permission Denied</h4>
                      <p className="text-[11px] text-white/70">
                        Please enable camera access in your browser settings.
                      </p>
                      <button
                        onClick={() => startCamera('user')}
                        className="px-4 py-1.5 rounded-full bg-white text-[#51465A] text-xs font-bold"
                      >
                        Try Again
                      </button>
                    </div>
                  )}

                </div>
              </div>

              {/* Little Star Sparkle Deco */}
              <div className="absolute -bottom-3 -right-3 text-3xl animate-float-slow pointer-events-none">
                ✨
              </div>
            </div>

            {/* MIRROR CONTROLS TOOLBAR */}
            <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl border-2 border-[#DDD5F5] shadow-sm max-w-xl w-full space-y-5">
              
              {/* Row 1: Effect Mode & Timer */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                
                {/* Convex Effect Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#51465A]">
                    Mirror Effect:
                  </span>
                  <div className="flex bg-[#FFF9F0] p-1 rounded-full border border-[#DDD5F5]">
                    <button
                      onClick={() => setIsConvexActive(true)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                        isConvexActive
                          ? 'bg-[#BA751B] text-white shadow-xs'
                          : 'text-[#7B6F85] hover:text-[#51465A]'
                      }`}
                    >
                      Convex Fisheye 🪞
                    </button>
                    <button
                      onClick={() => setIsConvexActive(false)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                        !isConvexActive
                          ? 'bg-[#51465A] text-white shadow-xs'
                          : 'text-[#7B6F85] hover:text-[#51465A]'
                      }`}
                    >
                      Normal Flat
                    </button>
                  </div>
                </div>

                {/* Orientation (Upside Down) Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#51465A]">
                    Orientation:
                  </span>
                  <button
                    onClick={() => setIsUpsideDown(!isUpsideDown)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border ${
                      isUpsideDown
                        ? 'bg-[#8C4D64] text-white border-[#8C4D64] shadow-xs'
                        : 'bg-[#FFF9F0] text-[#7B6F85] border-[#DDD5F5] hover:text-[#51465A]'
                    }`}
                    title="Toggle Upside Down Orientation"
                  >
                    <span>🙃</span>
                    <span>{isUpsideDown ? 'Upside Down: ON' : 'Upside Down: OFF'}</span>
                  </button>
                </div>

                {/* Timer selector */}
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

              </div>

              {/* Row 2: Fisheye Distortion Slider (when active) */}
              {isConvexActive && (
                <div className="p-3 bg-[#FFF9F0] rounded-2xl border border-[#FFF0B8] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#BA751B]" />
                    <span className="text-xs font-bold text-[#51465A]">
                      Fisheye Bulge Intensity:
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[#7B6F85]">Subtle</span>
                    <input
                      type="range"
                      min="0.2"
                      max="1.2"
                      step="0.05"
                      value={distortionLevel}
                      onChange={(e) => setDistortionLevel(parseFloat(e.target.value))}
                      className="w-32 h-1.5 bg-[#DDD5F5] rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-[11px] text-[#7B6F85]">Bubble</span>
                  </div>
                </div>
              )}

              {/* Row 3: Mirror Frame Style */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#51465A]">
                  Mirror Frame Style:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'traffic-red', label: 'Classic Road Red', color: 'bg-[#DE3B1B]', badge: 'Road Mirror' },
                    { id: 'vintage-gold', label: 'Vintage Gold', color: 'bg-[#E6CA65]' },
                    { id: 'pearl-bubble', label: 'Pearl Beads', color: 'bg-[#DDD5F5]' },
                    { id: 'pastel-ribbon', label: 'Pink Lace', color: 'bg-[#F6DCE5]' },
                  ].map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setMirrorFrameStyle(style.id as typeof mirrorFrameStyle)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                        mirrorFrameStyle === style.id
                          ? 'border-[#DE3B1B] bg-white text-[#51465A] font-bold shadow-xs ring-2 ring-[#DE3B1B]/30'
                          : 'border-gray-200 text-[#7B6F85] hover:bg-gray-50'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${style.color}`} />
                      <span>{style.label}</span>
                      {style.badge && (
                        <span className="text-[9px] bg-[#FFF0B8] text-[#735F1A] font-bold px-1.5 py-0.5 rounded-full">
                          {style.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shutter Action Button */}
              <div className="pt-2">
                <button
                  disabled={status !== 'ready' || isCountingDown}
                  onClick={handleStartCapture}
                  className={`w-full py-4 rounded-full font-bold text-base sm:text-lg flex items-center justify-center gap-2.5 transition-all duration-300 shadow-soft border-2 border-white ${
                    status === 'ready' && !isCountingDown
                      ? 'bg-gradient-to-r from-[#FFF0B8] via-[#DDD5F5] to-[#F6DCE5] hover:scale-105 hover:shadow-soft-lg text-[#51465A] cursor-pointer'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Camera className="w-5 h-5 text-[#8C4D64]" />
                  <span>
                    {status === 'ready'
                      ? 'Take Convex Mirror Selfie 📸'
                      : 'Allow Camera Access First'}
                  </span>
                </button>
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
};
