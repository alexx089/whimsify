import { FrameId, LayoutMode, PlacedSticker } from '../types';
import { FRAMES, FILTERS, STICKERS } from './framesAndStickers';

export interface RenderOptions {
  photos: string[]; // data URLs
  frameId: FrameId;
  layout: LayoutMode;
  filterId: string;
  stickers: PlacedSticker[];
  caption: string;
  showDateStamp: boolean;
  dateStampText: string;
  scale?: number; // default 2 for Retina/High-DPI
}

export async function renderPhotoboothStrip(options: RenderOptions): Promise<string> {
  const {
    photos,
    frameId,
    layout,
    filterId,
    stickers,
    caption,
    showDateStamp,
    dateStampText,
    scale = 2,
  } = options;

  // Load all images first
  const loadedImages: HTMLImageElement[] = await Promise.all(
    photos.map(
      (src) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('Failed to load captured photo'));
          img.src = src;
        })
    )
  );

  // Setup canvas dimensions based on layout and photo count (2-6)
  let baseWidth = 520;
  let baseHeight = 1600;
  let photoSlots: { x: number; y: number; w: number; h: number }[] = [];
  const frameInfo = FRAMES.find((f) => f.id === frameId) || FRAMES[0];
  const count = Math.max(1, Math.min(6, loadedImages.length || 4));

  const isStrip = layout === 'strip' || layout === 'strip-4' || layout === 'strip-3';
  const isGrid = layout === 'grid' || layout === 'grid-2x2';

  if (isStrip) {
    baseWidth = 520;
    const padX = 40;
    const topMargin = 55;
    const slotW = baseWidth - padX * 2;
    
    // Dynamic slot height and spacing based on selected photo count (2 to 6)
    let slotH = 330;
    let spacing = 20;
    if (count === 2) {
      slotH = 370;
      spacing = 26;
    } else if (count === 3) {
      slotH = 350;
      spacing = 22;
    } else if (count === 4) {
      slotH = 330;
      spacing = 20;
    } else if (count === 5) {
      slotH = 310;
      spacing = 18;
    } else if (count === 6) {
      slotH = 295;
      spacing = 16;
    }
    
    const footerSpace = 135;
    baseHeight = topMargin + count * slotH + (count - 1) * spacing + footerSpace;

    for (let i = 0; i < count; i++) {
      photoSlots.push({
        x: padX,
        y: topMargin + i * (slotH + spacing),
        w: slotW,
        h: slotH,
      });
    }
  } else if (isGrid) {
    baseWidth = 840;
    const padX = 45;
    const topMargin = 60;
    const gap = 24;
    const slotW = (baseWidth - padX * 2 - gap) / 2;
    const cols = 2;
    const rows = Math.ceil(count / cols);
    const slotH = count <= 2 ? 380 : count <= 4 ? 350 : 310;
    const footerSpace = 130;
    baseHeight = topMargin + rows * slotH + (rows - 1) * gap + footerSpace;

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      photoSlots.push({
        x: padX + col * (slotW + gap),
        y: topMargin + row * (slotH + gap),
        w: slotW,
        h: slotH,
      });
    }
  } else if (layout === 'polaroid') {
    baseWidth = 650;
    baseHeight = 850;
    const padX = 45;
    const topMargin = 45;
    const slotW = baseWidth - padX * 2;
    const slotH = 590;
    photoSlots.push({ x: padX, y: topMargin, w: slotW, h: slotH });
  } else {
    // single
    baseWidth = 600;
    baseHeight = 780;
    const padX = 40;
    const topMargin = 45;
    const slotW = baseWidth - padX * 2;
    const slotH = 550;
    photoSlots.push({ x: padX, y: topMargin, w: slotW, h: slotH });
  }

  const canvas = document.createElement('canvas');
  canvas.width = baseWidth * scale;
  canvas.height = baseHeight * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.scale(scale, scale);

  // 1. Draw Frame Background
  drawFrameBackground(ctx, baseWidth, baseHeight, frameInfo, layout);

  // 2. Draw Photos into slots with filter
  const filterInfo = FILTERS.find((f) => f.id === filterId);
  ctx.save();
  if (filterInfo && filterInfo.cssFilter !== 'none') {
    ctx.filter = filterInfo.cssFilter;
  }

  photoSlots.forEach((slot, index) => {
    const img = loadedImages[index % loadedImages.length];
    if (img) {
      drawFittedImage(ctx, img, slot.x, slot.y, slot.w, slot.h);
    } else {
      // Empty slot placeholder
      ctx.fillStyle = '#E8E2D9';
      ctx.fillRect(slot.x, slot.y, slot.w, slot.h);
    }
  });
  ctx.restore();

  // 3. Draw Frame Foreground Overlays, Borders & Theme Doodles
  drawFrameDecorations(ctx, baseWidth, baseHeight, photoSlots, frameInfo, layout);

  // 4. Draw Caption & Retro Date Stamp
  drawTextAndMeta(
    ctx,
    baseWidth,
    baseHeight,
    photoSlots,
    caption,
    showDateStamp,
    dateStampText,
    frameInfo,
    layout
  );

  // 5. Draw Placed Stickers
  await drawStickers(ctx, baseWidth, baseHeight, stickers);

  return canvas.toDataURL('image/png');
}

function drawFrameBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  frame: (typeof FRAMES)[0],
  layout: LayoutMode
) {
  ctx.save();

  if (frame.id === 'film-sprocket') {
    ctx.fillStyle = '#2A2530';
    ctx.fillRect(0, 0, w, h);
    // Dark analog film grain texture
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    for (let i = 0; i < 400; i++) {
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    ctx.restore();
    return;
  }

  // Soft vintage gradient / pastel paper
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, frame.backgroundColor);
  grad.addColorStop(1, frame.borderColor);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Subtle paper grain dots
  ctx.fillStyle = 'rgba(81, 70, 90, 0.025)';
  for (let i = 0; i < 350; i++) {
    const gx = Math.random() * w;
    const gy = Math.random() * h;
    ctx.fillRect(gx, gy, 1.5, 1.5);
  }

  if (frame.id === 'pink-heart') {
    // Cute polka dots
    ctx.fillStyle = 'rgba(232, 156, 181, 0.12)';
    const dotSpacing = 35;
    for (let x = 15; x < w; x += dotSpacing) {
      for (let y = 15; y < h; y += dotSpacing) {
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (frame.id === 'y2k-digicam') {
    // Grid pattern
    ctx.strokeStyle = 'rgba(94, 163, 232, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawFittedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.save();
  // Clip to slot rectangle with soft rounded corners (3px)
  ctx.beginPath();
  const r = 4;
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.clip();

  // Aspect fill center crop
  const imgRatio = img.width / img.height;
  const slotRatio = w / h;
  let sWidth = img.width;
  let sHeight = img.height;
  let sx = 0;
  let sy = 0;

  if (imgRatio > slotRatio) {
    sWidth = img.height * slotRatio;
    sx = (img.width - sWidth) / 2;
  } else {
    sHeight = img.width / slotRatio;
    sy = (img.height - sHeight) / 2;
  }

  ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);

  // Soft inner vignette / border shadow for analog photograph look
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}

function drawFrameDecorations(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  slots: { x: number; y: number; w: number; h: number }[],
  frame: (typeof FRAMES)[0],
  layout: LayoutMode
) {
  ctx.save();

  if (frame.id === 'film-sprocket') {
    // 35mm film sprocket holes along both sides
    const holeW = 14;
    const holeH = 22;
    const holeRadius = 4;
    const step = 45;

    ctx.fillStyle = '#17141B';
    for (let y = 20; y < h - 20; y += step) {
      // Left sprocket
      drawRoundedRect(ctx, 12, y, holeW, holeH, holeRadius);
      ctx.fill();
      // Right sprocket
      drawRoundedRect(ctx, w - 12 - holeW, y, holeW, holeH, holeRadius);
      ctx.fill();
    }
  } else if (frame.id === 'y2k-digicam') {
    // Digicam HUD overlays on photo slots
    slots.forEach((s) => {
      // Corner viewfinder brackets
      ctx.strokeStyle = '#5EA3E8';
      ctx.lineWidth = 2;
      const bLen = 14;

      // Top Left
      ctx.beginPath();
      ctx.moveTo(s.x + 10, s.y + 10 + bLen);
      ctx.lineTo(s.x + 10, s.y + 10);
      ctx.lineTo(s.x + 10 + bLen, s.y + 10);
      ctx.stroke();

      // Top Right
      ctx.beginPath();
      ctx.moveTo(s.x + s.w - 10 - bLen, s.y + 10);
      ctx.lineTo(s.x + s.w - 10, s.y + 10);
      ctx.lineTo(s.x + s.w - 10, s.y + 10 + bLen);
      ctx.stroke();

      // Bottom Left
      ctx.beginPath();
      ctx.moveTo(s.x + 10, s.y + s.h - 10 - bLen);
      ctx.lineTo(s.x + 10, s.y + s.h - 10);
      ctx.lineTo(s.x + 10 + bLen, s.y + s.h - 10);
      ctx.stroke();

      // Bottom Right
      ctx.beginPath();
      ctx.moveTo(s.x + s.w - 10 - bLen, s.y + s.h - 10);
      ctx.lineTo(s.x + s.w - 10, s.y + s.h - 10);
      ctx.lineTo(s.x + s.w - 10, s.y + s.h - 10 - bLen);
      ctx.stroke();

      // Viewfinder center crosshair
      const cx = s.x + s.w / 2;
      const cy = s.y + s.h / 2;
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy);
      ctx.lineTo(cx + 8, cy);
      ctx.moveTo(cx, cy - 8);
      ctx.lineTo(cx, cy + 8);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  } else if (frame.id === 'scrapbook-collage') {
    // Washi tape strips on top corners of photos
    slots.forEach((s) => {
      // Tape top-left
      ctx.save();
      ctx.translate(s.x - 8, s.y - 4);
      ctx.rotate(-0.08);
      ctx.fillStyle = 'rgba(255, 240, 184, 0.85)';
      ctx.fillRect(0, 0, 50, 16);
      ctx.strokeStyle = 'rgba(229, 205, 107, 0.6)';
      ctx.setLineDash([2, 3]);
      ctx.strokeRect(0, 0, 50, 16);
      ctx.restore();

      // Tape bottom-right
      ctx.save();
      ctx.translate(s.x + s.w - 42, s.y + s.h - 12);
      ctx.rotate(0.06);
      ctx.fillStyle = 'rgba(246, 220, 229, 0.88)';
      ctx.fillRect(0, 0, 50, 16);
      ctx.strokeStyle = 'rgba(217, 143, 167, 0.6)';
      ctx.setLineDash([2, 3]);
      ctx.strokeRect(0, 0, 50, 16);
      ctx.restore();
    });
  } else if (frame.id === 'pink-heart') {
    // Delicate heart drawings on frame margins
    ctx.fillStyle = '#E89CB5';
    drawMiniHeart(ctx, w / 2, 30, 14);
    drawMiniHeart(ctx, 28, 35, 10);
    drawMiniHeart(ctx, w - 28, 35, 10);
  } else if (frame.id === 'vintage-floral') {
    // Tiny daisy illustrations
    drawDaisy(ctx, 32, 28, 10);
    drawDaisy(ctx, w - 32, 28, 10);
    drawDaisy(ctx, w / 2, 28, 11);
  } else if (frame.id === 'butterfly-fairy') {
    // Little sparkle stars
    drawStarSparkle(ctx, 28, 30, 8, '#B6A6E8');
    drawStarSparkle(ctx, w - 28, 30, 8, '#B6A6E8');
    drawStarSparkle(ctx, w / 2, 28, 10, '#E89CB5');
  } else if (frame.id === 'classic-white') {
    // Embossed double pin-line border around each slot
    ctx.strokeStyle = 'rgba(81, 70, 90, 0.15)';
    ctx.lineWidth = 1;
    slots.forEach((s) => {
      ctx.strokeRect(s.x - 3, s.y - 3, s.w + 6, s.h + 6);
    });
  }

  ctx.restore();
}

function drawTextAndMeta(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  slots: { x: number; y: number; w: number; h: number }[],
  caption: string,
  showDateStamp: boolean,
  dateStampText: string,
  frame: (typeof FRAMES)[0],
  layout: LayoutMode
) {
  ctx.save();

  // Bottom footer area calculations
  const lastSlot = slots[slots.length - 1];
  const footerTop = lastSlot ? lastSlot.y + lastSlot.h + 15 : h - 120;
  const footerHeight = h - footerTop;
  const footerCenterY = footerTop + footerHeight / 2 - 8;

  // 1. Draw custom handwritten caption ONLY if user explicitly entered one
  const text = caption ? caption.trim() : '';
  if (text) {
    ctx.fillStyle = frame.textColor;
    ctx.font = '700 28px "Caveat", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, footerCenterY);
  }

  // 2. Draw retro date ONLY if showDateStamp is true and date text is provided
  if (showDateStamp && dateStampText && dateStampText.trim()) {
    const dateText = dateStampText.trim();
    if (frame.id === 'retro-datestamp' || frame.id === 'y2k-digicam') {
      // Amber vintage 7-segment / pixel font stamp
      ctx.fillStyle = '#FFA726';
      ctx.shadowColor = 'rgba(255, 167, 38, 0.6)';
      ctx.shadowBlur = 6;
      ctx.font = '700 18px "VT323", monospace';
      ctx.fillText(dateText, w / 2, text ? footerCenterY + 28 : footerCenterY);
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = frame.accentColor;
      ctx.font = '500 15px "Quicksand", sans-serif';
      ctx.fillText(dateText, w / 2, text ? footerCenterY + 28 : footerCenterY);
    }
  }

  ctx.restore();
}

async function drawStickers(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  stickers: PlacedSticker[]
) {
  if (!stickers || stickers.length === 0) return;

  for (const s of stickers) {
    const item = STICKERS.find((st) => st.id === s.stickerId);
    if (!item) continue;

    // Load SVG string into an Image
    const svgBlob = new Blob([item.svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = await new Promise<HTMLImageElement>((resolve) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => resolve(i);
      i.src = url;
    });

    const posX = (s.x / 100) * w;
    const posY = (s.y / 100) * h;
    const baseSize = 65;
    const renderSize = baseSize * (s.scale || 1);

    ctx.save();
    ctx.translate(posX, posY);
    ctx.rotate(((s.rotation || 0) * Math.PI) / 180);
    ctx.drawImage(img, -renderSize / 2, -renderSize / 2, renderSize, renderSize);
    ctx.restore();

    URL.revokeObjectURL(url);
  }
}

// Helpers for shapes
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawMiniHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  const topCurveHeight = size * 0.3;
  ctx.moveTo(0, topCurveHeight);
  ctx.bezierCurveTo(0, 0, -size / 2, 0, -size / 2, topCurveHeight);
  ctx.bezierCurveTo(-size / 2, (size + topCurveHeight) / 2, 0, size, 0, size * 1.15);
  ctx.bezierCurveTo(0, size, size / 2, (size + topCurveHeight) / 2, size / 2, topCurveHeight);
  ctx.bezierCurveTo(size / 2, 0, 0, 0, 0, topCurveHeight);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawDaisy(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#FFFFFF';
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.rotate(Math.PI / 4);
    ctx.ellipse(0, r, r * 0.4, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#FFDA66';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawStarSparkle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.quadraticCurveTo(0, 0, 0, r);
    ctx.quadraticCurveTo(0, 0, r * 0.25, 0);
  }
  ctx.fill();
  ctx.restore();
}

export function getDefaultDate(): string {
  const d = new Date();
  const year = d.getFullYear().toString().slice(-2);
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `'${year} ${month} ${day}`;
}
