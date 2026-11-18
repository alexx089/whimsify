import { FrameDefinition, FrameId, FilterOption, StickerItem } from '../types';

export const FRAMES: FrameDefinition[] = [
  {
    id: 'classic-white',
    name: 'Classic Vintage Strip',
    category: 'vintage',
    description: 'Timeless crisp white border with minimalist chic margins and soft vintage embossing.',
    badge: 'Popular',
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    accentColor: '#51465A',
    textColor: '#51465A',
    previewThumbnail: 'classic-white'
  },
  {
    id: 'pink-heart',
    name: 'Sweetheart Dreams',
    category: 'cute',
    description: 'Baby pink pastel frame adorned with delicate hearts, cupid sparkles, and pink ribbon accents.',
    badge: 'Cute ♡',
    borderColor: '#F6DCE5',
    backgroundColor: '#FFF5F8',
    accentColor: '#E89CB5',
    textColor: '#8C4D64',
    previewThumbnail: 'pink-heart'
  },
  {
    id: 'lavender-dream',
    name: 'Lavender Haze',
    category: 'aesthetic',
    description: 'Dreamy soft purple clouds, ethereal glow, and gentle twinkling fairy dust.',
    badge: 'Dreamy',
    borderColor: '#DDD5F5',
    backgroundColor: '#F5F2FC',
    accentColor: '#B6A6E8',
    textColor: '#584C7B',
    previewThumbnail: 'lavender-dream'
  },
  {
    id: 'y2k-digicam',
    name: 'Y2K Cyber Cam',
    category: 'retro',
    description: 'Early 2000s cyber aesthetic with digicam HUD, battery meter, REC indicator, and viewfinder crosshairs.',
    badge: 'Y2K Retro',
    borderColor: '#DCEBFA',
    backgroundColor: '#F0F6FD',
    accentColor: '#5EA3E8',
    textColor: '#2E5882',
    previewThumbnail: 'y2k-digicam'
  },
  {
    id: 'polaroid',
    name: 'Instant Polaroid',
    category: 'vintage',
    description: 'Authentic 90s instant film layout with an extended bottom caption margin and warm paper tone.',
    badge: 'Classic',
    borderColor: '#FAF6EE',
    backgroundColor: '#FAF6EE',
    accentColor: '#D3C8B4',
    textColor: '#4A4031',
    previewThumbnail: 'polaroid'
  },
  {
    id: 'vintage-floral',
    name: 'Cottagecore Florals',
    category: 'vintage',
    description: 'Charming pastel botanical borders with wild daisies, baby roses, and delicate leaves.',
    badge: 'Vintage',
    borderColor: '#D8EBDD',
    backgroundColor: '#F3F9F4',
    accentColor: '#88B892',
    textColor: '#3E5E45',
    previewThumbnail: 'vintage-floral'
  },
  {
    id: 'butterfly-fairy',
    name: 'Fairy Wings & Twinkle',
    category: 'aesthetic',
    description: 'Iridescent butterflies dancing in soft pastel gradients with magical star bursts.',
    badge: 'Fairycore',
    borderColor: '#DDD5F5',
    backgroundColor: '#FFF0B8',
    accentColor: '#D896DB',
    textColor: '#684570',
    previewThumbnail: 'butterfly-fairy'
  },
  {
    id: 'film-sprocket',
    name: '35mm Film Negative',
    category: 'retro',
    description: 'Realistic analog film look with perforated sprocket holes, film reel numbers, and warm grain.',
    badge: '35mm Film',
    borderColor: '#38333D',
    backgroundColor: '#2A2530',
    accentColor: '#E8A35E',
    textColor: '#F5EBDD',
    previewThumbnail: 'film-sprocket'
  },
  {
    id: 'retro-datestamp',
    name: 'Golden 1998 Stamp',
    category: 'retro',
    description: 'Butter yellow frame featuring digital amber LED date and vintage snapshot aesthetic.',
    badge: 'Nostalgic',
    borderColor: '#FFF0B8',
    backgroundColor: '#FFFCEB',
    accentColor: '#E5BF42',
    textColor: '#735F1A',
    previewThumbnail: 'retro-datestamp'
  },
  {
    id: 'scrapbook-collage',
    name: 'Pastel Scrapbook',
    category: 'cute',
    description: 'Adorable craft aesthetic with textured washi tape, cute pins, doodles, and paper tears.',
    badge: 'Scrapbook',
    borderColor: '#F6DCE5',
    backgroundColor: '#FFF9F0',
    accentColor: '#CBB2FE',
    textColor: '#51465A',
    previewThumbnail: 'scrapbook-collage'
  }
];

export const FILTERS: FilterOption[] = [
  {
    id: 'none',
    name: 'Natural',
    cssFilter: 'none',
    description: 'True-to-life colors and gentle lighting.',
    colorPreview: '#FFF9F0'
  },
  {
    id: 'rosy-glow',
    name: 'Rosy Glow',
    cssFilter: 'contrast(105%) saturate(115%) brightness(105%) sepia(10%) hue-rotate(-8deg)',
    description: 'Warm blush tint with soft flattering cheek tones.',
    colorPreview: '#F6DCE5'
  },
  {
    id: 'pastel-dream',
    name: 'Pastel Dream',
    cssFilter: 'brightness(110%) contrast(92%) saturate(110%) hue-rotate(5deg)',
    description: 'Dreamy, ethereal highlights with soft pastel shadows.',
    colorPreview: '#DDD5F5'
  },
  {
    id: 'vintage-90s',
    name: '90s Digicam',
    cssFilter: 'contrast(120%) saturate(85%) brightness(104%) sepia(20%)',
    description: 'Classic nostalgic digicam snap with warm highlights.',
    colorPreview: '#FFF0B8'
  },
  {
    id: 'tokyo-mono',
    name: 'Tokyo Film B&W',
    cssFilter: 'grayscale(100%) contrast(125%) brightness(102%)',
    description: 'Crisp moody black and white film look.',
    colorPreview: '#9E94A6'
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    cssFilter: 'sepia(35%) saturate(130%) contrast(108%) brightness(103%)',
    description: 'Sun-drenched honey glow for evening vibes.',
    colorPreview: '#F7D488'
  },
  {
    id: 'minty-fresh',
    name: 'Matcha & Mint',
    cssFilter: 'hue-rotate(25deg) saturate(95%) contrast(102%) brightness(105%)',
    description: 'Cool crisp tones with soothing mint green undertones.',
    colorPreview: '#D8EBDD'
  }
];

export const STICKERS: StickerItem[] = [
  {
    id: 'pink-bow',
    name: 'Pink Bow',
    category: 'hearts',
    svg: `<svg viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 40 C35 15, 10 20, 15 45 C18 60, 35 55, 50 45" fill="#F4A6BF" stroke="#D36B8D" stroke-width="3"/>
      <path d="M50 40 C65 15, 90 20, 85 45 C82 60, 65 55, 50 45" fill="#F4A6BF" stroke="#D36B8D" stroke-width="3"/>
      <ellipse cx="50" cy="42" rx="8" ry="7" fill="#E284A1" stroke="#BA4E71" stroke-width="3"/>
      <path d="M46 47 C40 65, 25 75, 20 78 C25 65, 42 52, 47 48" fill="#F4A6BF" stroke="#D36B8D" stroke-width="3"/>
      <path d="M54 47 C60 65, 75 75, 80 78 C75 65, 58 52, 53 48" fill="#F4A6BF" stroke="#D36B8D" stroke-width="3"/>
      <circle cx="48" cy="40" r="2" fill="#FFFFFF"/>
    </svg>`
  },
  {
    id: 'cute-heart',
    name: 'Sparkle Heart',
    category: 'hearts',
    svg: `<svg viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 82 C50 82, 10 55, 10 28 C10 12, 25 5, 38 12 C44 15, 48 22, 50 25 C52 22, 56 15, 62 12 C75 5, 90 12, 90 28 C90 55, 50 82, 50 82 Z" fill="#FFAEC5" stroke="#E26D8E" stroke-width="4"/>
      <path d="M28 20 C22 25, 20 35, 22 40" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
      <circle cx="82" cy="18" r="4" fill="#FFDF78"/>
      <path d="M82 10 L82 26 M74 18 L90 18" stroke="#FFDF78" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'magic-star',
    name: 'Pastel Star',
    category: 'decor',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 8 L60 38 L92 40 L66 60 L75 92 L50 72 L25 92 L34 60 L8 40 L40 38 Z" fill="#FFF0B8" stroke="#E5C754" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="42" cy="46" r="3" fill="#51465A"/>
      <circle cx="58" cy="46" r="3" fill="#51465A"/>
      <path d="M47 54 Q50 58 53 54" stroke="#51465A" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="36" cy="51" r="3" fill="#FFAEC5" opacity="0.8"/>
      <circle cx="64" cy="51" r="3" fill="#FFAEC5" opacity="0.8"/>
    </svg>`
  },
  {
    id: 'sparkles',
    name: 'Glitter Sparkles',
    category: 'decor',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 15 C50 35, 65 50, 85 50 C65 50, 50 65, 50 85 C50 65, 35 50, 15 50 C35 50, 50 35, 50 15 Z" fill="#DDD5F5" stroke="#B8A4E6" stroke-width="3"/>
      <path d="M22 20 C22 28, 28 34, 36 34 C28 34, 22 40, 22 48 C22 40, 16 34, 8 34 C16 34, 22 28, 22 20 Z" fill="#FFF0B8"/>
      <circle cx="75" cy="22" r="3" fill="#F6DCE5"/>
      <circle cx="28" cy="75" r="4" fill="#DCEBFA"/>
    </svg>`
  },
  {
    id: 'cherry',
    name: 'Twin Cherries',
    category: 'nature',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M52 18 C50 35, 32 50, 32 60" stroke="#7BA880" stroke-width="4" stroke-linecap="round"/>
      <path d="M52 18 C58 35, 68 50, 68 60" stroke="#7BA880" stroke-width="4" stroke-linecap="round"/>
      <path d="M52 18 C65 14, 75 16, 82 25 C75 28, 62 26, 52 18 Z" fill="#9CCFA2" stroke="#6C9E72" stroke-width="2"/>
      <circle cx="30" cy="68" r="18" fill="#F4667E" stroke="#C93B53" stroke-width="3"/>
      <circle cx="68" cy="68" r="18" fill="#F4667E" stroke="#C93B53" stroke-width="3"/>
      <circle cx="24" cy="62" r="4" fill="#FFFFFF"/>
      <circle cx="62" cy="62" r="4" fill="#FFFFFF"/>
    </svg>`
  },
  {
    id: 'daisy',
    name: 'Pastel Daisy',
    category: 'nature',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g stroke="#E8DFCE" stroke-width="2">
        <ellipse cx="50" cy="22" rx="10" ry="16" fill="#FFFFFF"/>
        <ellipse cx="50" cy="78" rx="10" ry="16" fill="#FFFFFF"/>
        <ellipse cx="22" cy="50" rx="16" ry="10" fill="#FFFFFF"/>
        <ellipse cx="78" cy="50" rx="16" ry="10" fill="#FFFFFF"/>
        <ellipse cx="30" cy="30" rx="11" ry="15" transform="rotate(-45 30 30)" fill="#FFFFFF"/>
        <ellipse cx="70" cy="70" rx="11" ry="15" transform="rotate(-45 70 70)" fill="#FFFFFF"/>
        <ellipse cx="70" cy="30" rx="11" ry="15" transform="rotate(45 70 30)" fill="#FFFFFF"/>
        <ellipse cx="30" cy="70" rx="11" ry="15" transform="rotate(45 30 70)" fill="#FFFFFF"/>
      </g>
      <circle cx="50" cy="50" r="14" fill="#FFDA66" stroke="#E6B82E" stroke-width="3"/>
      <circle cx="46" cy="46" r="3" fill="#FFF3B3"/>
    </svg>`
  },
  {
    id: 'butterfly',
    name: 'Fairy Butterfly',
    category: 'nature',
    svg: `<svg viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 45 C40 18, 15 15, 18 42 C19 55, 38 52, 50 48" fill="#DDD5F5" stroke="#9A83DF" stroke-width="2.5"/>
      <path d="M50 45 C60 18, 85 15, 82 42 C81 55, 62 52, 50 48" fill="#DDD5F5" stroke="#9A83DF" stroke-width="2.5"/>
      <path d="M50 50 C40 55, 25 65, 30 78 C35 85, 48 72, 50 55" fill="#F6DCE5" stroke="#DF8BA6" stroke-width="2.5"/>
      <path d="M50 50 C60 55, 75 65, 70 78 C65 85, 52 72, 50 55" fill="#F6DCE5" stroke="#DF8BA6" stroke-width="2.5"/>
      <ellipse cx="50" cy="48" rx="3.5" ry="16" fill="#51465A"/>
      <path d="M48 34 C44 24, 38 20, 34 22" stroke="#51465A" stroke-width="2" stroke-linecap="round"/>
      <path d="M52 34 C56 24, 62 20, 66 22" stroke="#51465A" stroke-width="2" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'washi-tape',
    name: 'Washi Tape',
    category: 'retro',
    svg: `<svg viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="5,5 95,5 92,35 2,35" fill="#FFF0B8" opacity="0.9"/>
      <line x1="15" y1="5" x2="25" y2="35" stroke="#E5CD6B" stroke-width="2" stroke-dasharray="2 3"/>
      <line x1="35" y1="5" x2="45" y2="35" stroke="#E5CD6B" stroke-width="2" stroke-dasharray="2 3"/>
      <line x1="55" y1="5" x2="65" y2="35" stroke="#E5CD6B" stroke-width="2" stroke-dasharray="2 3"/>
      <line x1="75" y1="5" x2="85" y2="35" stroke="#E5CD6B" stroke-width="2" stroke-dasharray="2 3"/>
    </svg>`
  },
  {
    id: 'cat-paw',
    name: 'Kitty Paw',
    category: 'cute',
    svg: `<svg viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="60" rx="22" ry="18" fill="#FFF9F0" stroke="#51465A" stroke-width="3"/>
      <path d="M42 58 C42 52, 58 52, 58 58 C58 66, 42 66, 42 58 Z" fill="#F4A6BF"/>
      <circle cx="28" cy="38" r="9" fill="#FFF9F0" stroke="#51465A" stroke-width="3"/>
      <circle cx="28" cy="38" r="6" fill="#F4A6BF"/>
      <circle cx="44" cy="30" r="9" fill="#FFF9F0" stroke="#51465A" stroke-width="3"/>
      <circle cx="44" cy="30" r="6" fill="#F4A6BF"/>
      <circle cx="60" cy="30" r="9" fill="#FFF9F0" stroke="#51465A" stroke-width="3"/>
      <circle cx="60" cy="30" r="6" fill="#F4A6BF"/>
      <circle cx="74" cy="38" r="9" fill="#FFF9F0" stroke="#51465A" stroke-width="3"/>
      <circle cx="74" cy="38" r="6" fill="#F4A6BF"/>
    </svg>`
  },
  {
    id: 'cute-quote',
    name: 'Whimsy Tag',
    category: 'retro',
    svg: `<svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="5" width="110" height="30" rx="15" fill="#DCEBFA" stroke="#A7C9ED" stroke-width="2"/>
      <text x="60" y="24" font-family="'Caveat', cursive" font-size="16" fill="#436F97" font-weight="bold" text-anchor="middle">besties ♡ 4evr</text>
    </svg>`
  }
];
