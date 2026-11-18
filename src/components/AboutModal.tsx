import React from 'react';
import { Sparkles, ShieldCheck, Heart, Camera, Code2, Smile, ArrowRight } from 'lucide-react';

interface AboutModalProps {
  onClose?: () => void;
  onEnterPhotobooth: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  onClose,
  onEnterPhotobooth,
}) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-20 space-y-10 animate-fadeIn">
      
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DDD5F5] text-[#584C7B] text-xs font-bold">
          <Heart className="w-3.5 h-3.5 fill-[#E89CB5] text-[#E89CB5]" />
          <span>About Whimsy Booth</span>
        </div>
        <h1 className="font-handwritten text-4xl sm:text-5xl font-bold text-[#51465A]">
          Made with Love & Nostalgia ♡
        </h1>
        <p className="text-sm text-[#7B6F85] leading-relaxed">
          Inspired by vintage Japanese purikura booths, Korean photo studios, and the joy of keeping little tangible memories on your bedroom wall.
        </p>
      </div>

      {/* 3 Value Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white p-6 rounded-3xl border-2 border-[#F6DCE5] shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF5F8] text-[#8C4D64] flex items-center justify-center text-2xl">
            🎀
          </div>
          <h3 className="font-display font-bold text-lg text-[#51465A]">
            Dreamy Aesthetics
          </h3>
          <p className="text-xs text-[#7B6F85] leading-relaxed">
            Every frame, washi tape piece, and sticker is thoughtfully designed to feel like an authentic handmade scrapbook keepsake.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border-2 border-[#D8EBDD] shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F3F9F4] text-[#3E5E45] flex items-center justify-center text-2xl">
            🔒
          </div>
          <h3 className="font-display font-bold text-lg text-[#51465A]">
            100% Client-Side Privacy
          </h3>
          <p className="text-xs text-[#7B6F85] leading-relaxed">
            Your camera feed and captured photos are processed entirely on your device via HTML5 MediaDevices & Canvas APIs. No images are ever sent to any server.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border-2 border-[#FFF0B8] shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FFFDF2] text-[#735F1A] flex items-center justify-center text-2xl">
            🪞
          </div>
          <h3 className="font-display font-bold text-lg text-[#51465A]">
            Convex WebGL Optics
          </h3>
          <p className="text-xs text-[#7B6F85] leading-relaxed">
            Our custom WebGL fisheye shader simulates genuine spherical convex mirror curvature and chromatic aberration in real-time at 60 FPS.
          </p>
        </div>

      </div>

      {/* Cute Pose Guide Section */}
      <div className="bg-gradient-to-br from-[#FFF5F8] to-[#F5F2FC] p-6 sm:p-8 rounded-3xl border-2 border-[#F6DCE5] space-y-5">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✌️</span>
          <h3 className="font-handwritten text-3xl font-bold text-[#51465A]">
            Cute Photobooth Pose Ideas ♡
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { pose: 'Pose 1: Double Peace', emoji: '✌️😁✌️', tip: 'Hold peace signs by both cheeks with a wide smile.' },
            { pose: 'Pose 2: Kitty Paws', emoji: '🐾 😽 🐾', tip: 'Curl your fingers into soft paws near your chin.' },
            { pose: 'Pose 3: Cheek Heart', emoji: '🫶 💖', tip: 'Make half a heart on your cheek for your bestie to finish.' },
            { pose: 'Pose 4: Big Wink', emoji: '😉 ✨', tip: 'Wink playfully with a little head tilt.' },
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-4 rounded-2xl border border-[#DDD5F5] shadow-xs">
              <div className="text-3xl mb-2">{item.emoji}</div>
              <h4 className="font-bold text-xs text-[#51465A] mb-1">{item.pose}</h4>
              <p className="text-[11px] text-[#7B6F85] leading-tight">{item.tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Specifications */}
      <div className="bg-white p-6 rounded-3xl border-2 border-[#DDD5F5] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h4 className="font-bold text-sm text-[#51465A] flex items-center gap-1.5">
            <Code2 className="w-4 h-4 text-[#6366F1]" />
            <span>Built with Modern Web Standards</span>
          </h4>
          <p className="text-xs text-[#7B6F85]">
            React 18 • TypeScript • Tailwind CSS • WebGL Fisheye Shaders • Canvas API High-DPI Export • Web Audio API Synthesizer
          </p>
        </div>

        <button
          onClick={onEnterPhotobooth}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-[#F6DCE5] to-[#DDD5F5] hover:from-[#f3cbd8] hover:to-[#d0c6f1] text-[#51465A] font-bold text-sm shadow-sm transition-all hover:scale-105 flex items-center gap-2 border border-white shrink-0"
        >
          <Camera className="w-4 h-4 text-[#8C4D64]" />
          <span>Step into the Booth</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
