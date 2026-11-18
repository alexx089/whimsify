import React, { useState } from 'react';
import { NavigationTab, FrameId } from '../types';
import { FRAMES } from '../utils/framesAndStickers';
import { Camera, Sparkles, CircleDot, ArrowRight, Heart, Smile, Palette, Download, Wand2 } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (tab: NavigationTab) => void;
  onSelectFrame: (frameId: FrameId) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onSelectFrame,
}) => {
  const [activeFramePreview, setActiveFramePreview] = useState<FrameId>('classic-white');
  const [isMirrorFisheyeDemo, setIsMirrorFisheyeDemo] = useState(true);

  const selectedFrame = FRAMES.find((f) => f.id === activeFramePreview) || FRAMES[0];

  const handleFrameClick = (frameId: FrameId) => {
    setActiveFramePreview(frameId);
  };

  const handleEnterWithFrame = (frameId: FrameId) => {
    onSelectFrame(frameId);
    onNavigate('photobooth');
  };

  return (
    <div className="relative overflow-hidden space-y-20 pb-20">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-10 sm:pt-16 pb-12 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        
        {/* Cute Top Ribbon Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-[#F6DCE5] text-xs font-semibold text-[#8C4D64] shadow-sm mb-6 animate-pulse-glow">
          <span>🎀</span>
          <span>Online Dreamy Vintage Photobooth</span>
          <span>✨</span>
        </div>

        {/* Welcoming Heading */}
        <h1 className="font-handwritten text-4xl sm:text-6xl md:text-7xl font-bold text-[#51465A] tracking-tight leading-[1.1] mb-5">
          A little corner for your <br className="hidden sm:inline" />
          <span className="relative inline-block px-2">
            <span className="relative z-10 text-[#8C4D64]">cutest memories ♡</span>
            <span className="absolute bottom-2 left-0 right-0 h-4 bg-[#F6DCE5]/70 rounded-full -rotate-1 -z-0"></span>
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-[#7B6F85] font-medium leading-relaxed mb-10">
          Strike a pose, pick a frame, and keep a little piece of the moment.
          Vintage camera charm, cute scrapbook stickers, and nostalgic photo strips in seconds.
        </p>

        {/* Primary CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5 mb-14">
          <button
            onClick={() => onNavigate('photobooth')}
            className="group relative px-8 py-4 rounded-full bg-gradient-to-r from-[#F6DCE5] via-[#DDD5F5] to-[#DCEBFA] hover:from-[#f3cbd8] hover:via-[#d0c6f1] hover:to-[#c8e2fb] text-[#51465A] font-bold text-base sm:text-lg shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:scale-105 border-2 border-white flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-sm group-hover:rotate-12 transition-transform shadow-xs">
              📸
            </div>
            <span>Enter Photobooth</span>
            <ArrowRight className="w-5 h-5 text-[#8C4D64] group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => onNavigate('mirror')}
            className="px-7 py-4 rounded-full bg-white/90 hover:bg-white text-[#51465A] font-bold text-base sm:text-lg shadow-sm hover:shadow-soft transition-all duration-300 hover:scale-105 border-2 border-[#DDD5F5] flex items-center gap-2.5"
          >
            <CircleDot className="w-5 h-5 text-[#F59E0B]" />
            <span>Mirror Magic Selfie</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#FFF0B8] text-[#735F1A] font-bold">
              New!
            </span>
          </button>
        </div>

        {/* Washi Tape Strip Hero Preview */}
        <div className="relative max-w-md mx-auto mt-6">
          {/* Top Washi Tape Deco */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-7 bg-[#FFF0B8]/90 rotate-1 shadow-xs border-y border-[#E5CD6B]/50 z-20 flex items-center justify-center text-[10px] font-mono text-[#735F1A] tracking-widest uppercase">
            whimsy • strip
          </div>

          {/* Hero Photostrip Card */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-soft-lg border-4 border-[#FFF9F0] rotate-[-1.5deg] hover:rotate-0 transition-transform duration-500">
            <div className="space-y-3">
              {/* 3 Cute Illustrative Sample Snaps */}
              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gradient-to-br from-[#F6DCE5] to-[#FFF0B8] flex items-center justify-center relative group">
                <div className="text-center">
                  <span className="text-4xl block group-hover:scale-125 transition-transform">✨ ✌️ ♡</span>
                  <span className="text-xs font-handwritten text-[#51465A] font-bold mt-1 block">Pose 01: Peace Sign</span>
                </div>
                <div className="absolute top-2 right-2 text-xs bg-white/80 px-2 py-0.5 rounded-full text-[#8C4D64] font-bold">
                  01
                </div>
              </div>

              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gradient-to-br from-[#DDD5F5] to-[#DCEBFA] flex items-center justify-center relative group">
                <div className="text-center">
                  <span className="text-4xl block group-hover:scale-125 transition-transform">🌸 😽 🎀</span>
                  <span className="text-xs font-handwritten text-[#51465A] font-bold mt-1 block">Pose 02: Cheek Wink</span>
                </div>
                <div className="absolute top-2 right-2 text-xs bg-white/80 px-2 py-0.5 rounded-full text-[#584C7B] font-bold">
                  02
                </div>
              </div>

              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gradient-to-br from-[#D8EBDD] to-[#F6DCE5] flex items-center justify-center relative group">
                <div className="text-center">
                  <span className="text-4xl block group-hover:scale-125 transition-transform">🍒 💖 💫</span>
                  <span className="text-xs font-handwritten text-[#51465A] font-bold mt-1 block">Pose 03: Big Smile</span>
                </div>
                <div className="absolute top-2 right-2 text-xs bg-white/80 px-2 py-0.5 rounded-full text-[#3E5E45] font-bold">
                  03
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS / SCRAPBOOK STEPS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs uppercase tracking-widest font-bold text-[#8C4D64] bg-[#F6DCE5] px-3 py-1 rounded-full">
            Quick & Magical
          </span>
          <h2 className="font-handwritten text-4xl sm:text-5xl font-bold text-[#51465A] mt-3">
            How Whimsy Booth Works ♡
          </h2>
          <p className="text-sm text-[#7B6F85] mt-2">
            No app downloads or sign-ups needed. Everything runs right here in your browser.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Pick a Frame',
              desc: 'Choose from 10+ nostalgic frames, including vintage photobooth strips, Y2K digicams, & polaroids.',
              icon: <Palette className="w-6 h-6 text-[#E89CB5]" />,
              bg: 'bg-[#FFF5F8]',
              border: 'border-[#F6DCE5]',
              emoji: '🎨',
            },
            {
              step: '02',
              title: 'Pose with Countdown',
              desc: 'Allow camera access, select 3s, 5s or 10s timer, and snap cute poses with mechanical shutter flash.',
              icon: <Camera className="w-6 h-6 text-[#A78BFA]" />,
              bg: 'bg-[#F7F5FE]',
              border: 'border-[#DDD5F5]',
              emoji: '📸',
            },
            {
              step: '03',
              title: 'Decorate & Filter',
              desc: 'Add pastel washi tape, sparkling stickers, cute handwritten captions, and dreamy vintage film filters.',
              icon: <Wand2 className="w-6 h-6 text-[#10B981]" />,
              bg: 'bg-[#F2FAF4]',
              border: 'border-[#D8EBDD]',
              emoji: '✨',
            },
            {
              step: '04',
              title: 'Save & Share',
              desc: 'Download your high-resolution photobooth strip or mirror keepsake ready to print or share with friends.',
              icon: <Download className="w-6 h-6 text-[#F59E0B]" />,
              bg: 'bg-[#FFFDF2]',
              border: 'border-[#FFF0B8]',
              emoji: '🎀',
            },
          ].map((card, i) => (
            <div
              key={i}
              className={`${card.bg} p-6 rounded-2xl border-2 ${card.border} shadow-sm hover:shadow-soft transition-all duration-300 hover:-translate-y-1 relative`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white shadow-xs flex items-center justify-center text-xl">
                  {card.emoji}
                </div>
                <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-white text-[#7B6F85] border border-gray-100">
                  STEP {card.step}
                </span>
              </div>
              <h3 className="font-display text-lg font-bold text-[#51465A] mb-1.5">
                {card.title}
              </h3>
              <p className="text-xs leading-relaxed text-[#7B6F85]">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. INTERACTIVE FRAME SHOWCASE PREVIEW */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-white/70 backdrop-blur-sm p-6 sm:p-10 rounded-3xl border-2 border-[#DDD5F5] shadow-soft">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🎞️</span>
                <span className="text-xs uppercase tracking-widest font-bold text-[#584C7B] bg-[#DDD5F5] px-3 py-1 rounded-full">
                  Frame Collection
                </span>
              </div>
              <h2 className="font-handwritten text-3xl sm:text-4xl font-bold text-[#51465A] mt-2">
                Explore Whimsical Frames
              </h2>
              <p className="text-sm text-[#7B6F85]">
                Click any frame to preview its aesthetic style before stepping into the booth.
              </p>
            </div>

            <button
              onClick={() => onNavigate('frames')}
              className="px-5 py-2.5 rounded-full bg-white hover:bg-[#F6DCE5]/40 text-[#51465A] font-semibold text-sm border border-[#DDD5F5] transition-all hover:scale-105 flex items-center gap-2"
            >
              <span>View Full Gallery (10 Frames)</span>
              <ArrowRight className="w-4 h-4 text-[#8C4D64]" />
            </button>
          </div>

          {/* Frame Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {FRAMES.slice(0, 6).map((f) => (
              <button
                key={f.id}
                onClick={() => handleFrameClick(f.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  activeFramePreview === f.id
                    ? 'bg-[#51465A] text-white shadow-sm'
                    : 'bg-white hover:bg-[#FFF0F5] text-[#7B6F85] border border-[#DDD5F5]'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>

          {/* Interactive Frame Preview Box */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-[#FFF9F0] p-6 sm:p-8 rounded-2xl border border-[#F6DCE5]">
            {/* Left: Frame Info & Description */}
            <div className="md:col-span-5 space-y-4">
              <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#F6DCE5] text-[#8C4D64]">
                {selectedFrame.badge || 'Aesthetic'}
              </div>
              <h3 className="font-handwritten text-3xl font-bold text-[#51465A]">
                {selectedFrame.name}
              </h3>
              <p className="text-sm text-[#7B6F85] leading-relaxed">
                {selectedFrame.description}
              </p>
              
              <div className="pt-4">
                <button
                  onClick={() => handleEnterWithFrame(selectedFrame.id)}
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-gradient-to-r from-[#F6DCE5] to-[#DDD5F5] hover:from-[#f3cbd8] hover:to-[#d0c6f1] text-[#51465A] font-bold text-sm shadow-sm transition-all hover:scale-105 flex items-center justify-center gap-2 border border-white"
                >
                  <Camera className="w-4 h-4 text-[#8C4D64]" />
                  <span>Use This Frame in Photobooth</span>
                </button>
              </div>
            </div>

            {/* Right: Realistic Strip Preview */}
            <div className="md:col-span-7 flex justify-center">
              <div
                className="w-64 sm:w-72 p-4 rounded-xl shadow-soft-lg border border-black/5 transition-all duration-300"
                style={{
                  backgroundColor: selectedFrame.backgroundColor,
                  borderColor: selectedFrame.borderColor,
                }}
              >
                <div className="space-y-2.5">
                  {[1, 2, 3].map((slotIdx) => (
                    <div
                      key={slotIdx}
                      className="aspect-[4/3] rounded bg-white/70 overflow-hidden relative flex items-center justify-center border border-black/5"
                    >
                      <div className="text-center">
                        <span className="text-2xl">📸</span>
                        <p className="text-[10px] font-mono text-[#7B6F85] mt-1">
                          Pose 0{slotIdx}
                        </p>
                      </div>
                      {selectedFrame.id === 'y2k-digicam' && (
                        <div className="absolute inset-1.5 border border-[#5EA3E8]/60 pointer-events-none flex justify-between p-1">
                          <span className="text-[9px] text-[#5EA3E8] font-mono">REC</span>
                          <span className="text-[9px] text-[#5EA3E8] font-mono">30fps</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CONVEX MIRROR SPOTLIGHT SECTION */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-br from-[#FFFCEB] via-[#FFF9F0] to-[#DDD5F5]/40 p-8 sm:p-12 rounded-3xl border-2 border-[#FFF0B8] shadow-soft">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left: Info & Interactive Toggle */}
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF0B8] text-[#735F1A] text-xs font-bold">
                <CircleDot className="w-3.5 h-3.5" />
                <span>Feature Spotlight: Mirror Magic</span>
              </div>

              <h2 className="font-handwritten text-4xl sm:text-5xl font-bold text-[#51465A] leading-tight">
                Step inside the <br />
                <span className="text-[#BA751B]">Convex Mirror Selfie</span> ♡
              </h2>

              <p className="text-sm sm:text-base text-[#7B6F85] leading-relaxed">
                Remember those dreamy curved convenience store mirrors and aesthetic elevator selfies? 
                Whimsy Booth simulates realistic spherical convex fisheye optics using custom WebGL shaders, 
                giving your selfie that iconic, playful curved bubble look.
              </p>

              {/* Demo Mode Toggle */}
              <div className="p-4 rounded-2xl bg-white/80 border border-[#DDD5F5] space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#51465A]">
                  <span>Fisheye Distortion Preview:</span>
                  <button
                    onClick={() => setIsMirrorFisheyeDemo(!isMirrorFisheyeDemo)}
                    className="px-3 py-1 rounded-full bg-[#DDD5F5] hover:bg-[#c8bdf0] text-[#584C7B] text-xs font-bold transition-all"
                  >
                    {isMirrorFisheyeDemo ? 'Switch to Flat' : 'Switch to Fisheye'}
                  </button>
                </div>
                <p className="text-xs text-[#7B6F85]">
                  Status: <span className="font-semibold text-[#8C4D64]">{isMirrorFisheyeDemo ? 'Convex Spherical Bulge Active (WebGL)' : 'Standard Flat Reflection'}</span>
                </p>
              </div>

              <button
                onClick={() => onNavigate('mirror')}
                className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#FFF0B8] to-[#DDD5F5] hover:from-[#fceba7] hover:to-[#cebfee] text-[#51465A] font-bold text-base shadow-sm hover:shadow-soft transition-all hover:scale-105 flex items-center gap-2 border border-white"
              >
                <CircleDot className="w-5 h-5 text-[#BA751B]" />
                <span>Take a Convex Mirror Selfie</span>
                <ArrowRight className="w-4 h-4 text-[#51465A]" />
              </button>
            </div>

            {/* Right: Visual Simulation of the Classic Road Traffic Convex Mirror */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="relative group">
                
                {/* Curved Road Visor Sun Cap */}
                <div className="absolute -top-7 sm:-top-8 left-1/2 -translate-x-1/2 w-[114%] h-24 pointer-events-none z-20 drop-shadow-md">
                  <svg viewBox="0 0 340 100" className="w-full h-full">
                    <defs>
                      <linearGradient id="landingVisor" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#FA542A" />
                        <stop offset="35%" stopColor="#DE3B1B" />
                        <stop offset="85%" stopColor="#B8280C" />
                        <stop offset="100%" stopColor="#7E1705" />
                      </linearGradient>
                      <linearGradient id="landingVisorLip" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#DE3B1B" />
                        <stop offset="50%" stopColor="#FFA694" />
                        <stop offset="100%" stopColor="#DE3B1B" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 12 85 C 20 28, 85 8, 170 8 C 255 8, 320 28, 328 85 C 300 48, 240 30, 170 30 C 100 30, 40 48, 12 85 Z"
                      fill="url(#landingVisor)"
                      stroke="#9E1F08"
                      strokeWidth="2.5"
                    />
                    <path
                      d="M 22 78 C 45 34, 105 14, 170 14 C 235 14, 295 34, 318 78"
                      fill="none"
                      stroke="url(#landingVisorLip)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                {/* Circular Road Traffic Red Mirror Frame */}
                <div className="w-72 h-72 sm:w-80 sm:h-80 rounded-full p-4 bg-gradient-to-br from-[#FA542A] via-[#E03816] to-[#991B05] shadow-[0_20px_50px_rgba(216,58,30,0.35)] flex items-center justify-center border-4 border-white">
                  
                  {/* Inner Dark Gasket Bevel */}
                  <div className="w-full h-full rounded-full p-2 bg-[#261F1E] shadow-inner flex items-center justify-center relative overflow-hidden">
                    
                    {/* Simulated Mirror Surface with Fisheye Bulge */}
                    <div
                      className={`w-full h-full rounded-full bg-gradient-to-br from-[#F6DCE5] to-[#DCEBFA] flex items-center justify-center relative overflow-hidden transition-all duration-500 ${
                        isMirrorFisheyeDemo ? 'scale-105' : 'scale-100'
                      }`}
                    >
                      {/* Top Visor Inner Cast Shadow */}
                      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/55 via-black/20 to-transparent pointer-events-none rounded-t-full z-10" />

                      {/* Interactive visual art */}
                      <div className="text-center select-none z-0">
                        <span className={`block transition-all duration-500 ${isMirrorFisheyeDemo ? 'text-6xl scale-125' : 'text-5xl scale-100'}`}>
                          🪞 ✨
                        </span>
                        <p className="font-handwritten text-xl font-bold text-[#51465A] mt-2">
                          Road Mirror Magic
                        </p>
                        <p className="text-[10px] font-sans font-medium text-[#7B6F85]">
                          {isMirrorFisheyeDemo ? 'Classic Street Convex Fisheye' : 'Flat Mirror Feed'}
                        </p>
                      </div>

                      {/* Glass Crescent Highlight / Reflection Sheen */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/10 to-transparent pointer-events-none rounded-full" />
                      
                      {/* Edge Vignette */}
                      <div className="absolute inset-0 rounded-full shadow-[inset_0_0_35px_rgba(81,70,90,0.3)] pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Floating Little Heart Deco */}
                <div className="absolute -bottom-2 -right-2 text-2xl animate-float-reverse">
                  💖
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. PRIVACY & LOCAL PROMISE */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <div className="p-6 rounded-2xl bg-white/60 border border-[#F6DCE5] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-full bg-[#D8EBDD] flex items-center justify-center text-lg shrink-0">
              🔒
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#51465A]">100% Private & In-Browser</h4>
              <p className="text-xs text-[#7B6F85]">Your photos never touch any server. Everything is rendered locally on your device.</p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('photobooth')}
            className="px-6 py-2.5 rounded-full bg-[#F6DCE5] hover:bg-[#ecc7d4] text-[#8C4D64] font-bold text-xs shrink-0 transition-all"
          >
            Start Snapping ♡
          </button>
        </div>
      </section>

    </div>
  );
};
