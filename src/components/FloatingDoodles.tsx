import React from 'react';

export const FloatingDoodles: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* Top Left Bow */}
      <div className="absolute top-16 left-6 text-2xl md:text-3xl animate-float opacity-70">
        🎀
      </div>

      {/* Top Right Star Cluster */}
      <div className="absolute top-24 right-8 text-xl md:text-2xl animate-float-reverse opacity-75">
        ✨
      </div>

      {/* Left Mid Sparkle */}
      <div className="absolute top-1/3 left-4 text-xl md:text-2xl animate-float-slow opacity-65">
        🌸
      </div>

      {/* Right Mid Heart */}
      <div className="absolute top-1/2 right-6 text-2xl md:text-3xl animate-float opacity-80">
        💖
      </div>

      {/* Bottom Left Cherries */}
      <div className="absolute bottom-28 left-10 text-2xl md:text-3xl animate-float-reverse opacity-70">
        🍒
      </div>

      {/* Bottom Right Butterfly */}
      <div className="absolute bottom-20 right-12 text-2xl md:text-3xl animate-float-slow opacity-75">
        🦋
      </div>

      {/* Subtle background pastel blur orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#F6DCE5] rounded-full filter blur-3xl opacity-40 -z-10" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-[#DDD5F5] rounded-full filter blur-3xl opacity-40 -z-10" />
      <div className="absolute -bottom-32 left-1/4 w-96 h-96 bg-[#FFF0B8] rounded-full filter blur-3xl opacity-35 -z-10" />
    </div>
  );
};
