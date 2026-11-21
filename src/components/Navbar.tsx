import React, { useState } from 'react';
import { NavigationTab } from '../types';
import { Camera, Sparkles, CircleDot, Layers, Info, Volume2, VolumeX, Menu, X, Heart, Users } from 'lucide-react';
import { sounds } from '../utils/audio';

interface NavbarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  isMuted,
  onToggleMute,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (tab: NavigationTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'home', label: 'Home', icon: <Heart className="w-4 h-4 text-[#E89CB5]" /> },
    { id: 'photobooth', label: 'Photobooth', icon: <Camera className="w-4 h-4 text-[#A78BFA]" />, badge: 'Classic' },
    { id: 'duo', label: 'Duo Call', icon: <Users className="w-4 h-4 text-[#EC4899]" />, badge: 'Online ♡' },
    { id: 'mirror', label: 'Mirror Magic', icon: <CircleDot className="w-4 h-4 text-[#F59E0B]" />, badge: 'Fisheye' },
    { id: 'frames', label: 'Frames', icon: <Layers className="w-4 h-4 text-[#10B981]" /> },
    { id: 'about', label: 'About', icon: <Info className="w-4 h-4 text-[#6366F1]" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FFF9F0]/85 backdrop-blur-md border-b border-[#F6DCE5]/60 transition-all duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
        
        {/* Brand Logo */}
        <button
          onClick={() => handleNavClick('home')}
          className="group flex items-center gap-2.5 text-left focus:outline-none transition-transform hover:scale-[1.02]"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#F6DCE5] to-[#DDD5F5] flex items-center justify-center shadow-sm border border-white group-hover:rotate-6 transition-transform">
            <span className="text-xl">🎀</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-handwritten text-3xl font-bold tracking-tight text-[#51465A]">
                Whimsy Booth
              </span>
              <Sparkles className="w-4 h-4 text-[#E89CB5] animate-pulse" />
            </div>
            <p className="text-[11px] font-medium tracking-wider text-[#7B6F85] uppercase -mt-1 font-sans">
              Dreamy Studio ♡
            </p>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5 bg-[#FFF0F5]/80 p-1.5 rounded-full border border-[#F6DCE5]/70 shadow-sm">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`relative px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-white text-[#51465A] shadow-sm shadow-[#51465A]/5'
                    : 'text-[#7B6F85] hover:text-[#51465A] hover:bg-white/40'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#F6DCE5] text-[#8C4D64] leading-none">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Action: Sound toggle & Enter CTA */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
            className="w-9 h-9 rounded-full bg-white/80 hover:bg-white border border-[#DDD5F5] flex items-center justify-center text-[#7B6F85] hover:text-[#51465A] transition-all hover:scale-105 shadow-sm"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-[#BA4E71]" /> : <Volume2 className="w-4 h-4 text-[#8C4D64]" />}
          </button>

          <button
            onClick={() => handleNavClick('photobooth')}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#F6DCE5] to-[#DDD5F5] hover:from-[#f3cbd8] hover:to-[#d0c6f1] text-[#51465A] font-semibold text-sm shadow-sm transition-all hover:scale-105 hover:shadow border border-white"
          >
            <span>Snap Photos</span>
            <span>📸</span>
          </button>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-9 h-9 rounded-full bg-white border border-[#F6DCE5] flex items-center justify-center text-[#51465A] shadow-sm"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FFF9F0] border-b border-[#F6DCE5] px-4 py-3 space-y-1.5 animate-fadeIn">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-base font-semibold transition-all ${
                  isActive
                    ? 'bg-[#F6DCE5] text-[#51465A]'
                    : 'text-[#7B6F85] hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/70 text-[#8C4D64]">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
