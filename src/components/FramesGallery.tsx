import React, { useState } from 'react';
import { FrameId, FrameDefinition } from '../types';
import { FRAMES } from '../utils/framesAndStickers';
import { Camera, Sparkles, Check, ArrowRight, Heart, Filter } from 'lucide-react';

interface FramesGalleryProps {
  onSelectFrame: (frameId: FrameId) => void;
  selectedFrameId: FrameId;
}

export const FramesGallery: React.FC<FramesGalleryProps> = ({
  onSelectFrame,
  selectedFrameId,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Frames (10)' },
    { id: 'vintage', label: 'Vintage & Analog' },
    { id: 'cute', label: 'Pastel & Cute' },
    { id: 'retro', label: 'Y2K & 90s Retro' },
    { id: 'aesthetic', label: 'Dreamy & Fairy' },
  ];

  const filteredFrames = activeCategory === 'all'
    ? FRAMES
    : FRAMES.filter((f) => f.category === activeCategory);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-20 space-y-8">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D8EBDD] text-[#3E5E45] text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Curated Frame Collection</span>
        </div>
        <h1 className="font-handwritten text-4xl sm:text-5xl font-bold text-[#51465A]">
          Whimsical Photobooth Frames ♡
        </h1>
        <p className="text-xs sm:text-sm text-[#7B6F85] leading-relaxed">
          From nostalgic 35mm film negatives to early 2000s cyber digicams and cottagecore florals. 
          Pick your favorite look to start your session.
        </p>

        {/* Filter Pills */}
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeCategory === cat.id
                  ? 'bg-[#51465A] text-white shadow-xs'
                  : 'bg-white hover:bg-[#F6DCE5]/40 text-[#7B6F85] border border-[#DDD5F5]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Frame Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFrames.map((frame) => {
          const isSelected = selectedFrameId === frame.id;
          return (
            <div
              key={frame.id}
              className={`bg-white rounded-3xl p-5 border-2 transition-all duration-300 hover:shadow-soft-lg flex flex-col justify-between group ${
                isSelected
                  ? 'border-[#8C4D64] shadow-soft bg-[#FFF5F8]/40'
                  : 'border-[#DDD5F5] hover:border-[#E89CB5]'
              }`}
            >
              {/* Frame Visual Simulation Card */}
              <div className="space-y-4">
                <div
                  className="w-full aspect-[4/3] rounded-2xl p-3 shadow-inner border border-black/5 flex flex-col justify-between relative overflow-hidden transition-transform group-hover:scale-[1.02]"
                  style={{
                    backgroundColor: frame.backgroundColor,
                    borderColor: frame.borderColor,
                  }}
                >
                  {/* Top Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 text-[#51465A] shadow-xs">
                      {frame.badge || 'Aesthetic'}
                    </span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-[#8C4D64] text-white flex items-center justify-center text-xs shadow-xs">
                        ✓
                      </span>
                    )}
                  </div>

                  {/* Sample Viewfinder Slots Mini Mockup */}
                  <div className="flex gap-2 justify-center items-center py-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-16 h-20 rounded bg-white/80 shadow-xs border border-black/5 flex flex-col items-center justify-center relative"
                      >
                        <span className="text-sm">📸</span>
                        <span className="text-[8px] font-mono opacity-60">0{i}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Details */}
                <div>
                  <h3 className="font-display font-bold text-base text-[#51465A] flex items-center gap-1.5">
                    <span>{frame.name}</span>
                  </h3>
                  <p className="text-xs text-[#7B6F85] leading-relaxed mt-1">
                    {frame.description}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 mt-2 border-t border-[#F6DCE5]/60">
                <button
                  onClick={() => onSelectFrame(frame.id)}
                  className={`w-full py-2.5 px-4 rounded-full font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    isSelected
                      ? 'bg-[#51465A] text-white shadow-xs'
                      : 'bg-[#FFF9F0] hover:bg-[#F6DCE5] text-[#51465A] border border-[#DDD5F5]'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{isSelected ? 'Currently Selected' : 'Choose this Frame'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
