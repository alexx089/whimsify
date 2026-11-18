import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { FrameId, LayoutMode, CapturedPhoto, PlacedSticker } from '../types';
import { FRAMES, FILTERS, STICKERS } from '../utils/framesAndStickers';
import { renderPhotoboothStrip, getDefaultDate } from '../utils/canvasRenderer';
import { sounds } from '../utils/audio';
import {
  Download,
  RotateCcw,
  Sparkles,
  Layers,
  Wand2,
  Sticker,
  Type,
  Calendar,
  Check,
  Trash2,
  Move,
  Camera,
  Share2,
  Heart
} from 'lucide-react';

interface PhotoEditorProps {
  photos: CapturedPhoto[];
  initialFrameId: FrameId;
  initialLayout: LayoutMode;
  onRetake: () => void;
  onNewSession: () => void;
}

export const PhotoEditor: React.FC<PhotoEditorProps> = ({
  photos,
  initialFrameId,
  initialLayout,
  onRetake,
  onNewSession,
}) => {
  const [selectedFrameId, setSelectedFrameId] = useState<FrameId>(initialFrameId);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(initialLayout);
  const [selectedFilterId, setSelectedFilterId] = useState<string>('none');
  const [caption, setCaption] = useState<string>('');
  const [showDateStamp, setShowDateStamp] = useState<boolean>(false);
  const [dateStampText, setDateStampText] = useState<string>(getDefaultDate());
  const [stickers, setStickers] = useState<PlacedSticker[]>([]);
  const [selectedStickerUid, setSelectedStickerUid] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'frames' | 'filters' | 'stickers' | 'text'>('frames');
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [downloadSuccessModal, setDownloadSuccessModal] = useState<boolean>(false);

  // Re-render strip when properties change
  useEffect(() => {
    let isCancelled = false;
    const generatePreview = async () => {
      if (photos.length === 0) return;
      setIsRendering(true);
      try {
        const photoUrls = photos.map((p) => p.dataUrl);
        const dataUrl = await renderPhotoboothStrip({
          photos: photoUrls,
          frameId: selectedFrameId,
          layout: layoutMode,
          filterId: selectedFilterId,
          stickers,
          caption,
          showDateStamp,
          dateStampText,
          scale: 1.5, // 1.5x for preview speed
        });
        if (!isCancelled) {
          setPreviewDataUrl(dataUrl);
        }
      } catch (err) {
        console.error('Render error:', err);
      } finally {
        if (!isCancelled) setIsRendering(false);
      }
    };

    generatePreview();
    return () => {
      isCancelled = true;
    };
  }, [
    photos,
    selectedFrameId,
    layoutMode,
    selectedFilterId,
    stickers,
    caption,
    showDateStamp,
    dateStampText,
  ]);

  // Add a sticker
  const handleAddSticker = (stickerId: string) => {
    const newSticker: PlacedSticker = {
      uid: Math.random().toString(36).substring(2, 9),
      stickerId,
      x: 35 + Math.random() * 30, // random center area
      y: 20 + Math.random() * 60,
      scale: 1,
      rotation: (Math.random() - 0.5) * 30,
    };
    setStickers((prev) => [...prev, newSticker]);
    setSelectedStickerUid(newSticker.uid);
  };

  // Remove selected sticker
  const handleRemoveSticker = (uid: string) => {
    setStickers((prev) => prev.filter((s) => s.uid !== uid));
    if (selectedStickerUid === uid) setSelectedStickerUid(null);
  };

  // Adjust sticker transform
  const updateSticker = (uid: string, updates: Partial<PlacedSticker>) => {
    setStickers((prev) =>
      prev.map((s) => (s.uid === uid ? { ...s, ...updates } : s))
    );
  };

  // Download high-res final photostrip
  const handleDownload = async () => {
    try {
      setIsRendering(true);
      const photoUrls = photos.map((p) => p.dataUrl);
      const highResDataUrl = await renderPhotoboothStrip({
        photos: photoUrls,
        frameId: selectedFrameId,
        layout: layoutMode,
        filterId: selectedFilterId,
        stickers,
        caption,
        showDateStamp,
        dateStampText,
        scale: 2.5, // Ultra sharp 2.5x high-dpi export
      });

      // Trigger celebratory sound & confetti!
      sounds.playCelebration();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F6DCE5', '#DDD5F5', '#FFF0B8', '#D8EBDD', '#DCEBFA'],
      });

      // Create download link
      const a = document.createElement('a');
      a.href = highResDataUrl;
      const cleanName = caption.trim().replace(/[^a-zA-Z0-9]/g, '_') || 'whimsy_strip';
      a.download = `${cleanName}_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setDownloadSuccessModal(true);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsRendering(false);
    }
  };

  // Download individual photo snap
  const handleDownloadIndividual = (photoIndex: number) => {
    const photo = photos[photoIndex];
    if (!photo) return;
    const a = document.createElement('a');
    a.href = photo.dataUrl;
    a.download = `whimsy_snap_${photoIndex + 1}_${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-20 space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#F6DCE5] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <span className="font-handwritten text-3xl font-bold text-[#51465A]">
              Scrapbook Editor
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#DDD5F5] text-[#584C7B] font-bold">
              Customize Your Strip ♡
            </span>
          </div>
          <p className="text-xs text-[#7B6F85] mt-0.5">
            Personalize frames, filters, cute stickers, and handwritten captions.
          </p>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onRetake}
            className="px-4 py-2 rounded-full bg-white hover:bg-[#FFF5F8] text-[#7B6F85] hover:text-[#8C4D64] text-xs font-semibold border border-[#F6DCE5] transition-all flex items-center gap-1.5 shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake Photos</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={isRendering}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#F6DCE5] via-[#DDD5F5] to-[#DCEBFA] hover:from-[#f3cbd8] hover:via-[#d0c6f1] text-[#51465A] font-bold text-sm shadow-soft hover:shadow-soft-lg transition-all hover:scale-105 flex items-center gap-2 border-2 border-white"
          >
            <Download className="w-4 h-4 text-[#8C4D64]" />
            <span>Download Keepsake</span>
          </button>
        </div>
      </div>

      {/* MAIN TWO-COLUMN STUDIO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT: Live Interactive Strip Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          
          <div className="relative group p-4 bg-white/70 backdrop-blur-md rounded-3xl border-2 border-[#DDD5F5] shadow-soft max-w-sm w-full flex flex-col items-center">
            
            {/* Top Washi Tape Deco */}
            <div className="w-24 h-5 bg-[#FFF0B8]/80 border-y border-[#E5CD6B]/40 rotate-1 shadow-xs mb-3 -mt-2 flex items-center justify-center text-[9px] font-mono text-[#735F1A]">
              keepsake ♡
            </div>

            {/* Strip Display Canvas / Image */}
            <div className="relative rounded-xl overflow-hidden shadow-soft-lg border border-black/5 bg-[#FBF9F6]">
              {previewDataUrl ? (
                <img
                  src={previewDataUrl}
                  alt="Whimsy Photostrip Preview"
                  className="max-h-[620px] w-auto object-contain transition-opacity duration-300"
                />
              ) : (
                <div className="w-64 h-96 flex flex-col items-center justify-center space-y-2">
                  <div className="w-8 h-8 border-3 border-[#E89CB5] border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-[#7B6F85]">Rendering strip...</span>
                </div>
              )}

              {/* Rendering indicator badge */}
              {isRendering && (
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-bold text-[#8C4D64] shadow border border-[#F6DCE5] flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E89CB5]" />
                  <span>Updating...</span>
                </div>
              )}
            </div>

            {/* Quick individual download links */}
            <div className="mt-4 pt-3 border-t border-[#F6DCE5] w-full text-center">
              <span className="text-[11px] text-[#7B6F85] block mb-1.5 font-medium">
                Download individual poses:
              </span>
              <div className="flex justify-center gap-1.5">
                {photos.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleDownloadIndividual(idx)}
                    className="px-2.5 py-1 rounded-md bg-[#FFF9F0] hover:bg-[#F6DCE5] text-[#51465A] text-[10px] font-bold border border-[#DDD5F5] transition-all"
                    title={`Download Snap ${idx + 1}`}
                  >
                    Snap #{idx + 1}
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* RIGHT: Customization Control Center (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Customization Tabs */}
          <div className="flex bg-[#FFF0F5]/90 p-1.5 rounded-2xl border border-[#F6DCE5] shadow-xs gap-1">
            {[
              { id: 'frames', label: 'Frames', icon: <Layers className="w-4 h-4 text-[#A78BFA]" /> },
              { id: 'filters', label: 'Filters', icon: <Wand2 className="w-4 h-4 text-[#10B981]" /> },
              { id: 'stickers', label: 'Stickers', icon: <Sticker className="w-4 h-4 text-[#E89CB5]" />, badge: stickers.length > 0 ? `${stickers.length}` : undefined },
              { id: 'text', label: 'Captions', icon: <Type className="w-4 h-4 text-[#F59E0B]" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-white text-[#51465A] shadow-sm'
                    : 'text-[#7B6F85] hover:text-[#51465A] hover:bg-white/50'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="text-[10px] font-bold px-1.5 rounded-full bg-[#F6DCE5] text-[#8C4D64]">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* TAB 1: FRAMES SELECTION */}
          {activeTab === 'frames' && (
            <div className="bg-white p-5 rounded-3xl border-2 border-[#F6DCE5] shadow-sm space-y-5">
              
              {/* Layout Switcher */}
              <div>
                <label className="text-xs font-bold text-[#51465A] block mb-2">
                  Photo Strip Layout:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'strip', label: `Vertical Strip (${photos.length} Poses)` },
                    { id: 'grid', label: `Grid Layout (${photos.length} Poses)` },
                    { id: 'polaroid', label: 'Polaroid Style' },
                  ].map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setLayoutMode(l.id as LayoutMode)}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                        layoutMode === l.id || (l.id === 'strip' && layoutMode.startsWith('strip')) || (l.id === 'grid' && layoutMode.startsWith('grid'))
                          ? 'border-[#51465A] bg-[#51465A] text-white shadow-xs'
                          : 'border-[#DDD5F5] bg-[#FFF9F0] text-[#7B6F85] hover:bg-white'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Frame Gallery Grid */}
              <div>
                <label className="text-xs font-bold text-[#51465A] block mb-2">
                  Select Frame Design (10 Styles):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
                  {FRAMES.map((f) => {
                    const isSelected = selectedFrameId === f.id;
                    return (
                      <div
                        key={f.id}
                        onClick={() => setSelectedFrameId(f.id)}
                        className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'border-[#8C4D64] bg-[#FFF5F8] shadow-sm'
                            : 'border-[#DDD5F5] bg-white hover:border-[#E89CB5]'
                        }`}
                      >
                        {/* Color swatch */}
                        <div
                          className="w-10 h-10 rounded-xl border border-black/10 shrink-0 shadow-xs flex items-center justify-center text-xs"
                          style={{ backgroundColor: f.backgroundColor }}
                        >
                          🎀
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h5 className="font-bold text-xs text-[#51465A] truncate">
                              {f.name}
                            </h5>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-[#8C4D64] shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-[#7B6F85] line-clamp-1 mt-0.5">
                            {f.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: FILTERS SELECTION */}
          {activeTab === 'filters' && (
            <div className="bg-white p-5 rounded-3xl border-2 border-[#DDD5F5] shadow-sm space-y-4">
              <div>
                <h4 className="font-bold text-sm text-[#51465A] mb-1">
                  Vintage Camera Color Filters
                </h4>
                <p className="text-xs text-[#7B6F85]">
                  Give your photos soft nostalgic warmth, rosy cheek glow, or classic Tokyo film black & white.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {FILTERS.map((filt) => {
                  const isSelected = selectedFilterId === filt.id;
                  return (
                    <button
                      key={filt.id}
                      onClick={() => setSelectedFilterId(filt.id)}
                      className={`p-3 rounded-2xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-[#51465A] bg-[#51465A] text-white shadow-sm'
                          : 'border-[#DDD5F5] bg-[#FFF9F0] hover:bg-white text-[#51465A]'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div
                          className="w-4 h-4 rounded-full border border-black/20"
                          style={{ backgroundColor: filt.colorPreview }}
                        />
                        <span className="font-bold text-xs truncate">
                          {filt.name}
                        </span>
                      </div>
                      <p
                        className={`text-[10px] leading-tight line-clamp-2 ${
                          isSelected ? 'text-gray-300' : 'text-[#7B6F85]'
                        }`}
                      >
                        {filt.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: STICKERS SELECTION & TRANSFORM */}
          {activeTab === 'stickers' && (
            <div className="bg-white p-5 rounded-3xl border-2 border-[#F6DCE5] shadow-sm space-y-5">
              <div>
                <h4 className="font-bold text-sm text-[#51465A] mb-1">
                  Cute Scrapbook Stickers
                </h4>
                <p className="text-xs text-[#7B6F85]">
                  Click any sticker to place it onto your photostrip. You can scale, rotate, and reposition it!
                </p>
              </div>

              {/* Sticker Tray */}
              <div className="grid grid-cols-5 gap-3 bg-[#FFF9F0] p-3 rounded-2xl border border-[#DDD5F5]">
                {STICKERS.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => handleAddSticker(st.id)}
                    className="aspect-square rounded-xl bg-white hover:bg-[#FFF0F5] border border-[#F6DCE5] p-2 flex flex-col items-center justify-center transition-all hover:scale-110 shadow-xs group"
                    title={`Add ${st.name}`}
                  >
                    <div
                      className="w-8 h-8 flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: st.svg }}
                    />
                    <span className="text-[9px] font-medium text-[#7B6F85] mt-1 truncate max-w-full">
                      {st.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Placed Stickers Management */}
              {stickers.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#51465A]">
                      Placed Stickers ({stickers.length}):
                    </span>
                    <button
                      onClick={() => setStickers([])}
                      className="text-[11px] font-semibold text-rose-500 hover:underline"
                    >
                      Clear all stickers
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {stickers.map((s, idx) => {
                      const item = STICKERS.find((st) => st.id === s.stickerId);
                      const isSelected = selectedStickerUid === s.uid;
                      return (
                        <div
                          key={s.uid}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                            isSelected
                              ? 'bg-[#FFF5F8] border-[#E89CB5]'
                              : 'bg-white border-[#DDD5F5]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#7B6F85]">#{idx + 1}</span>
                            <span className="font-semibold text-[#51465A]">
                              {item?.name || 'Sticker'}
                            </span>
                          </div>

                          {/* Controls: Scale, Rotation, Delete */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-[11px] text-[#7B6F85]">
                              <span>Size:</span>
                              <input
                                type="range"
                                min="0.5"
                                max="2"
                                step="0.1"
                                value={s.scale}
                                onChange={(e) =>
                                  updateSticker(s.uid, {
                                    scale: parseFloat(e.target.value),
                                  })
                                }
                                className="w-16 h-1.5 bg-[#DDD5F5] rounded-lg appearance-none cursor-pointer"
                              />
                            </div>

                            <div className="flex items-center gap-1 text-[11px] text-[#7B6F85]">
                              <span>Rotate:</span>
                              <input
                                type="range"
                                min="-90"
                                max="90"
                                step="5"
                                value={s.rotation}
                                onChange={(e) =>
                                  updateSticker(s.uid, {
                                    rotation: parseInt(e.target.value),
                                  })
                                }
                                className="w-16 h-1.5 bg-[#DDD5F5] rounded-lg appearance-none cursor-pointer"
                              />
                            </div>

                            <button
                              onClick={() => handleRemoveSticker(s.uid)}
                              className="text-gray-400 hover:text-rose-500 transition-colors p-1"
                              title="Delete sticker"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 4: TEXT & RETRO DATE STAMP */}
          {activeTab === 'text' && (
            <div className="bg-white p-5 rounded-3xl border-2 border-[#FFF0B8] shadow-sm space-y-5">
              <div>
                <h4 className="font-bold text-sm text-[#51465A] mb-1">
                  Custom Handwritten Caption & Date
                </h4>
                <p className="text-xs text-[#7B6F85]">
                  Write a cute quote or personal note in romantic handwritten calligraphy.
                </p>
              </div>

              {/* Caption Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#51465A] flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-[#E89CB5]" />
                  <span>Handwritten Caption:</span>
                </label>
                <input
                  type="text"
                  maxLength={40}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="e.g. whimsy memories ♡ besties"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#DDD5F5] focus:outline-none focus:ring-2 focus:ring-[#F6DCE5] text-sm text-[#51465A] font-handwritten text-lg font-bold"
                />
              </div>

              {/* Retro Date Stamp Toggle */}
              <div className="space-y-3 pt-2 border-t border-[#F6DCE5]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#51465A] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>Include Retro Date Stamp:</span>
                  </label>
                  <input
                    type="checkbox"
                    checked={showDateStamp}
                    onChange={(e) => setShowDateStamp(e.target.checked)}
                    className="w-4 h-4 rounded text-[#8C4D64] focus:ring-[#F6DCE5] cursor-pointer"
                  />
                </div>

                {showDateStamp && (
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#7B6F85]">
                      Date Stamp Format:
                    </label>
                    <input
                      type="text"
                      value={dateStampText}
                      onChange={(e) => setDateStampText(e.target.value)}
                      placeholder="'98 11 16"
                      className="w-full px-3 py-2 rounded-xl border border-[#DDD5F5] text-xs font-mono text-[#51465A]"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          <div className="pt-2">
            <button
              onClick={handleDownload}
              disabled={isRendering}
              className="w-full py-4 rounded-full bg-gradient-to-r from-[#F6DCE5] via-[#DDD5F5] to-[#DCEBFA] hover:from-[#f3cbd8] hover:via-[#d0c6f1] text-[#51465A] font-bold text-lg shadow-soft hover:shadow-soft-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-2.5 border-2 border-white"
            >
              <Download className="w-5 h-5 text-[#8C4D64]" />
              <span>Download High-Resolution Photostrip</span>
              <Sparkles className="w-4 h-4 text-[#8C4D64]" />
            </button>
          </div>

        </div>

      </div>

      {/* DOWNLOAD SUCCESS MODAL */}
      {downloadSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#FFF9F0] max-w-sm w-full p-6 sm:p-8 rounded-3xl border-3 border-[#F6DCE5] shadow-soft-lg text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#F6DCE5] to-[#DDD5F5] mx-auto flex items-center justify-center text-3xl shadow-sm">
              🎀
            </div>
            <h3 className="font-handwritten text-3xl font-bold text-[#51465A]">
              Photostrip Saved! ♡
            </h3>
            <p className="text-xs text-[#7B6F85] leading-relaxed">
              Your keepsake was downloaded to your device in crisp high-resolution.
              Print it out or send it to your besties!
            </p>
            <div className="space-y-2 pt-2">
              <button
                onClick={() => setDownloadSuccessModal(false)}
                className="w-full py-2.5 rounded-full bg-[#51465A] text-white text-xs font-bold hover:bg-black transition-all"
              >
                Keep Editing
              </button>
              <button
                onClick={onNewSession}
                className="w-full py-2.5 rounded-full bg-white hover:bg-[#FFF5F8] text-[#8C4D64] text-xs font-bold border border-[#F6DCE5] transition-all"
              >
                Snap a New Session 📸
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
