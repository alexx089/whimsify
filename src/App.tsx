import React, { useState } from 'react';
import { NavigationTab, FrameId, LayoutMode, CapturedPhoto } from './types';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Photobooth } from './components/Photobooth';
import { PhotoEditor } from './components/PhotoEditor';
import { MirrorMagic } from './components/MirrorMagic';
import { FramesGallery } from './components/FramesGallery';
import { AboutModal } from './components/AboutModal';
import { FloatingDoodles } from './components/FloatingDoodles';
import { sounds } from './utils/audio';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');
  const [selectedFrameId, setSelectedFrameId] = useState<FrameId>('classic-white');
  const [sessionLayout, setSessionLayout] = useState<LayoutMode>('strip');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Sound toggle
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sounds.isMuted = nextMuted;
    if (!nextMuted) {
      sounds.playCountdown(3);
    }
  };

  // When user finishes taking photos in photobooth
  const handleFinishPhotoboothSession = (
    photos: CapturedPhoto[],
    frameId: FrameId,
    layout: LayoutMode
  ) => {
    setCapturedPhotos(photos);
    setSelectedFrameId(frameId);
    setSessionLayout(layout);
    setIsEditing(true);
    setCurrentTab('photobooth');
  };

  // Retake photos (goes back to camera viewfinder)
  const handleRetakePhotos = () => {
    setIsEditing(false);
  };

  // New session (resets photos)
  const handleNewSession = () => {
    setCapturedPhotos([]);
    setIsEditing(false);
    setCurrentTab('photobooth');
  };

  // Selecting a frame from gallery or landing page
  const handleSelectFrame = (frameId: FrameId) => {
    setSelectedFrameId(frameId);
    setIsEditing(false);
    setCurrentTab('photobooth');
  };

  // Tab navigation
  const handleSelectTab = (tab: NavigationTab) => {
    setCurrentTab(tab);
    if (tab !== 'photobooth') {
      setIsEditing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9F0] text-[#51465A] font-sans relative selection:bg-[#F6DCE5]">
      
      {/* Whimsical Floating Background Elements */}
      <FloatingDoodles />

      {/* Persistent Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Main Content Area */}
      <main className="flex-1 relative z-10">
        
        {/* TAB 1: HOME LANDING PAGE */}
        {currentTab === 'home' && (
          <LandingPage
            onNavigate={handleSelectTab}
            onSelectFrame={handleSelectFrame}
          />
        )}

        {/* TAB 2: MAIN PHOTOBOOTH (Camera Viewfinder or Editor) */}
        {currentTab === 'photobooth' && (
          isEditing && capturedPhotos.length > 0 ? (
            <PhotoEditor
              photos={capturedPhotos}
              initialFrameId={selectedFrameId}
              initialLayout={sessionLayout}
              onRetake={handleRetakePhotos}
              onNewSession={handleNewSession}
            />
          ) : (
            <Photobooth
              initialFrameId={selectedFrameId}
              onFinishSession={handleFinishPhotoboothSession}
              onNavigateHome={() => setCurrentTab('home')}
            />
          )
        )}

        {/* TAB 3: CONVEX MIRROR SELFIE (MIRROR MAGIC) */}
        {currentTab === 'mirror' && (
          <MirrorMagic onNavigateHome={() => setCurrentTab('home')} />
        )}

        {/* TAB 4: FRAMES GALLERY */}
        {currentTab === 'frames' && (
          <FramesGallery
            onSelectFrame={handleSelectFrame}
            selectedFrameId={selectedFrameId}
          />
        )}

        {/* TAB 5: ABOUT */}
        {currentTab === 'about' && (
          <AboutModal
            onEnterPhotobooth={() => handleSelectTab('photobooth')}
          />
        )}

      </main>

      {/* Whimsical Footer */}
      <footer className="border-t border-[#F6DCE5]/80 bg-white/50 backdrop-blur-sm py-6 relative z-10 text-center">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#7B6F85]">
          <div className="flex items-center gap-1.5 font-medium">
            <span>Whimsy Booth</span>
            <span>•</span>
            <span>A little corner for your cutest memories ♡</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => handleSelectTab('home')}
              className="hover:text-[#51465A] hover:underline"
            >
              Home
            </button>
            <button
              onClick={() => handleSelectTab('photobooth')}
              className="hover:text-[#51465A] hover:underline"
            >
              Photobooth
            </button>
            <button
              onClick={() => handleSelectTab('mirror')}
              className="hover:text-[#51465A] hover:underline"
            >
              Mirror Magic
            </button>
            <button
              onClick={() => handleSelectTab('frames')}
              className="hover:text-[#51465A] hover:underline"
            >
              Frames
            </button>
            <button
              onClick={() => handleSelectTab('about')}
              className="hover:text-[#51465A] hover:underline"
            >
              About & Privacy
            </button>
          </div>

          <div className="font-mono text-[11px] text-[#A399AB]">
            100% Client-Side Privacy ♡ No Servers
          </div>
        </div>
      </footer>

    </div>
  );
};

export default App;
