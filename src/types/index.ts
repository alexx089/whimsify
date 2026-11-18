export type NavigationTab = 'home' | 'photobooth' | 'mirror' | 'frames' | 'about';

export type FrameId = 
  | 'classic-white'
  | 'pink-heart'
  | 'lavender-dream'
  | 'y2k-digicam'
  | 'polaroid'
  | 'vintage-floral'
  | 'butterfly-fairy'
  | 'film-sprocket'
  | 'retro-datestamp'
  | 'scrapbook-collage';

export interface FrameDefinition {
  id: FrameId;
  name: string;
  category: 'vintage' | 'cute' | 'retro' | 'aesthetic';
  description: string;
  badge?: string;
  borderColor: string;
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  previewThumbnail: string; // SVG or data URL
}

export type LayoutMode = 'strip' | 'grid' | 'polaroid' | 'strip-4' | 'strip-3' | 'grid-2x2' | 'single';

export interface FilterOption {
  id: string;
  name: string;
  cssFilter: string;
  description: string;
  colorPreview: string;
}

export interface StickerItem {
  id: string;
  name: string;
  category: 'hearts' | 'nature' | 'retro' | 'decor' | 'cute';
  svg: string;
}

export interface PlacedSticker {
  uid: string;
  stickerId: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  scale: number;
  rotation: number; // degrees
}

export interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp: number;
}

export interface PhotoboothSession {
  photos: CapturedPhoto[];
  selectedFrame: FrameId;
  layout: LayoutMode;
  selectedFilter: string;
  stickers: PlacedSticker[];
  caption: string;
  showDateStamp: boolean;
  dateStampText: string;
}
