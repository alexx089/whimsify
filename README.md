# Whimsy Booth ♡ A Dreamy Online Photobooth

A fully functional, whimsical, nostalgic online photobooth and convex mirror studio with a pastel scrapbook aesthetic.

## ✨ Features

- **🌸 Dreamy Pastel Aesthetic**: Soft baby pink (`#F6DCE5`), lavender (`#DDD5F5`), butter yellow (`#FFF0B8`), mint green (`#D8EBDD`), and baby blue (`#DCEBFA`) with handwritten fonts (`Caveat`, `Fredoka`) and clean readable body font (`Quicksand`).
- **📸 Main Photobooth Studio**:
  - Live device camera feed with front/back camera flipping.
  - Multi-photo capture sequence (Pose 1 to 4 with countdown breather in between).
  - Countdown timer options (Off, 3s, 5s, 10s) with bouncing countdown digits and audio chimes.
  - Screen shutter flash and authentic mechanical camera sound.
  - Mini-strip progress bar with individual pose retake options.
  - Fallback photo uploader for devices without webcams.
- **🪞 Mirror Magic (Convex Fisheye Mirror Selfie)**:
  - Real-time **WebGL spherical fisheye distortion shader** running at 60 FPS.
  - Simulates genuine curved convex convenience-store mirrors with chromatic edge aberration, glass reflection sheens, and rim vignettes.
  - Toggle between Convex Fisheye and Normal Flat selfie.
  - Adjustable distortion slider (Subtle Curve to Ultra Bubble).
  - 3 vintage mirror borders (Vintage Antique Gold, Pastel Pearl Beads, Pink Ribbon Lace).
  - High-resolution keepsake export.
- **🎨 10 Nostalgic Functional Frames**:
  1. *Classic Vintage Strip* — Timeless crisp white border with minimalist chic margins.
  2. *Sweetheart Dreams* — Baby pink pastel frame with delicate hearts & cupid sparkles.
  3. *Lavender Haze* — Ethereal purple backdrop with gentle stars and dreamy glow.
  4. *Y2K Cyber Cam* — Early 2000s digicam HUD with REC indicator, battery meter, and viewfinder brackets.
  5. *Instant Polaroid* — Authentic 90s instant film layout with wide bottom margin.
  6. *Cottagecore Florals* — Mint green border with wild daisies and botanical sprigs.
  7. *Fairy Wings & Twinkle* — Iridescent butterfly and magical star bursts.
  8. *35mm Film Negative* — Analog film look with perforated sprocket holes and film stock text.
  9. *Golden 1998 Stamp* — Butter yellow frame with vintage amber digital date stamp.
  10. *Pastel Scrapbook* — Textured washi tape strips, paper tears, and cute pins.
- **🪄 Scrapbook Photo Editor**:
  - Multiple strip layouts: Vertical 4-Strip, Vertical 3-Strip, 2x2 Grid, Classic Polaroid, Single.
  - Vintage filters: Natural, Rosy Glow, Pastel Dream, 90s Digicam, Tokyo B&W, Golden Hour, Matcha & Mint.
  - Draggable, resizable, rotatable stickers: Bows, Hearts, Stars, Daisies, Cherries, Butterflies, Washi tape, Kitty paws, and Whimsy quotes.
  - Custom handwritten captions and retro digital timestamp.
  - Confetti celebration upon download.
  - Download complete photostrip or individual photo snaps.
- **🔒 100% Client-Side Privacy**:
  - All camera video and photo processing runs locally in your browser. No images or data are ever uploaded or stored on any server.

## 🚀 Running the Project

```bash
# 1. Install dependencies
npm install

# 2. Start the local development server
npm run dev
```

Visit `http://localhost:3000` (or the port Vite prints in your terminal) to step into the photobooth!

## 🛠️ Tech Stack

- **React 18** with **TypeScript**
- **Tailwind CSS** (Custom pastel theme, keyframes, shadows)
- **WebGL Shader Engine** for real-time spherical fisheye distortion
- **HTML5 Canvas API** for Retina/High-DPI composite rendering and export
- **Web Audio API** for synthesized mechanical camera shutter clicks & countdown bells
- **Lucide React** & **Canvas Confetti**
