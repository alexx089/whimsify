// Mirror Magic Canvas Compositor for exporting high-res keepsake Mirror Selfies

export interface MirrorRenderOptions {
  sourceCanvas: HTMLCanvasElement; // WebGL distorted canvas or 2D canvas
  caption: string;
  frameStyle: 'traffic-red' | 'vintage-gold' | 'pearl-bubble' | 'pastel-ribbon';
  stickers?: { emoji: string; x: number; y: number }[];
}

export function renderMirrorSelfieKeepsake(options: MirrorRenderOptions): string {
  const { sourceCanvas, caption, frameStyle } = options;
  const size = 1000;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size + 160; // Extra room for bottom scrapbook caption
  const ctx = canvas.getContext('2d');
  if (!ctx) return sourceCanvas.toDataURL('image/png');

  // Background: Pastel cream scrapbook paper
  ctx.fillStyle = '#FFF9F0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Decorative pastel confetti/polka dots
  ctx.fillStyle = 'rgba(221, 213, 245, 0.25)';
  for (let i = 0; i < 40; i++) {
    const rx = (i * 97) % canvas.width;
    const ry = (i * 131) % canvas.height;
    ctx.beginPath();
    ctx.arc(rx, ry, (i % 3) + 2, 0, Math.PI * 2);
    ctx.fill();
  }

  const centerX = canvas.width / 2;
  const centerY = 520;
  const mirrorRadius = 370;

  // Outer Mirror Shadow
  ctx.save();
  ctx.shadowColor = 'rgba(81, 70, 90, 0.22)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 22;
  ctx.beginPath();
  ctx.arc(centerX, centerY, mirrorRadius + 28, 0, Math.PI * 2);
  ctx.fillStyle = '#E8DEC8';
  ctx.fill();
  ctx.restore();

  // Draw Mirror Frame Border based on frameStyle
  if (frameStyle === 'traffic-red') {
    // CLASSIC ROAD / STREET CONVEX MIRROR IN TRAFFIC RED/ORANGE
    drawTrafficRedFrame(ctx, centerX, centerY, mirrorRadius);
  } else if (frameStyle === 'vintage-gold') {
    // Rich vintage antique gold rim
    const goldGrad = ctx.createLinearGradient(
      centerX - mirrorRadius,
      centerY - mirrorRadius,
      centerX + mirrorRadius,
      centerY + mirrorRadius
    );
    goldGrad.addColorStop(0, '#E6CA65');
    goldGrad.addColorStop(0.3, '#FFF3A8');
    goldGrad.addColorStop(0.5, '#D4B044');
    goldGrad.addColorStop(0.8, '#FFF5B8');
    goldGrad.addColorStop(1, '#B89228');

    ctx.fillStyle = goldGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, mirrorRadius + 26, 0, Math.PI * 2);
    ctx.fill();

    // Inner bevel ring
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(centerX, centerY, mirrorRadius + 14, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(80, 60, 20, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, mirrorRadius + 2, 0, Math.PI * 2);
    ctx.stroke();
  } else if (frameStyle === 'pearl-bubble') {
    // Pastel pearl beads rim
    ctx.fillStyle = '#DDD5F5';
    ctx.beginPath();
    ctx.arc(centerX, centerY, mirrorRadius + 20, 0, Math.PI * 2);
    ctx.fill();

    // Draw little pearl circles around rim
    const pearlCount = 48;
    for (let p = 0; p < pearlCount; p++) {
      const angle = (p / pearlCount) * Math.PI * 2;
      const px = centerX + Math.cos(angle) * (mirrorRadius + 12);
      const py = centerY + Math.sin(angle) * (mirrorRadius + 12);

      const pGrad = ctx.createRadialGradient(px - 2, py - 2, 1, px, py, 7);
      pGrad.addColorStop(0, '#FFFFFF');
      pGrad.addColorStop(0.6, '#F6DCE5');
      pGrad.addColorStop(1, '#CBBCEB');

      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Pastel Ribbon Pink
    ctx.fillStyle = '#F6DCE5';
    ctx.beginPath();
    ctx.arc(centerX, centerY, mirrorRadius + 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#E89CB5';
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, mirrorRadius + 11, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Clip to circular mirror inside
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, mirrorRadius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  // Draw the source canvas into the clipped circle
  ctx.drawImage(
    sourceCanvas,
    centerX - mirrorRadius,
    centerY - mirrorRadius,
    mirrorRadius * 2,
    mirrorRadius * 2
  );

  // If traffic-red, cast soft top visor shadow onto mirror surface
  if (frameStyle === 'traffic-red') {
    const visorShadow = ctx.createLinearGradient(
      centerX,
      centerY - mirrorRadius,
      centerX,
      centerY - mirrorRadius * 0.4
    );
    visorShadow.addColorStop(0, 'rgba(30, 10, 5, 0.48)');
    visorShadow.addColorStop(0.4, 'rgba(40, 15, 10, 0.22)');
    visorShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = visorShadow;
    ctx.beginPath();
    ctx.arc(centerX, centerY, mirrorRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Convex glass reflection sheen (crescent highlight)
  const sheenGrad = ctx.createLinearGradient(
    centerX - mirrorRadius,
    centerY - mirrorRadius,
    centerX,
    centerY
  );
  sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.42)');
  sheenGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.1)');
  sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = sheenGrad;
  ctx.beginPath();
  ctx.arc(centerX, centerY, mirrorRadius, 0, Math.PI * 2);
  ctx.fill();

  // Inner rim shadow (convex edge vignette)
  const rimVignette = ctx.createRadialGradient(
    centerX,
    centerY,
    mirrorRadius * 0.72,
    centerX,
    centerY,
    mirrorRadius
  );
  rimVignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  rimVignette.addColorStop(1, 'rgba(40, 20, 20, 0.38)');
  ctx.fillStyle = rimVignette;
  ctx.beginPath();
  ctx.arc(centerX, centerY, mirrorRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Top decoration (Bow for pastel frames, or clean cap for traffic mirror)
  if (frameStyle !== 'traffic-red') {
    drawMirrorBow(ctx, centerX, centerY - mirrorRadius - 20);
  } else {
    // Road traffic visor top rim highlight
    drawTrafficVisorHighlight(ctx, centerX, centerY, mirrorRadius);
  }

  // Draw Scrapbook Footer Caption & Date
  ctx.save();
  ctx.fillStyle = '#51465A';
  ctx.font = '700 36px "Caveat", cursive';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const capText = caption.trim() || (frameStyle === 'traffic-red' ? 'road mirror selfie ♡' : 'mirror magic selfie ♡');
  ctx.fillText(capText, centerX, canvas.height - 85);

  ctx.fillStyle = '#7B6F85';
  ctx.font = '500 16px "Quicksand", sans-serif';
  const today = new Date().toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  ctx.fillText(
    frameStyle === 'traffic-red'
      ? `street convex mirror • ${today}`
      : `whimsy mirror booth • ${today}`,
    centerX,
    canvas.height - 45
  );
  ctx.restore();

  return canvas.toDataURL('image/png');
}

// Draw the iconic Road Traffic Convex Mirror Frame with extended Curved Sun Hood
function drawTrafficRedFrame(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number
) {
  ctx.save();

  // 1. Extended Upper Sun Visor Hood (curves outward over the top of the mirror)
  // Left point around theta = 175 deg, top arch extending 65px above the rim, right point around theta = 5 deg
  ctx.save();
  ctx.beginPath();
  const leftX = cx - r - 26;
  const leftY = cy + 20;
  const rightX = cx + r + 26;
  const rightY = cy + 20;
  const topVisorPeakY = cy - r - 68;

  // Outer hooded arch
  ctx.moveTo(leftX, leftY);
  ctx.bezierCurveTo(
    cx - r - 35, cy - r * 0.4,
    cx - r * 0.65, topVisorPeakY,
    cx, topVisorPeakY
  );
  ctx.bezierCurveTo(
    cx + r * 0.65, topVisorPeakY,
    cx + r + 35, cy - r * 0.4,
    rightX, rightY
  );

  // Inner return curve along the mirror rim
  ctx.arc(cx, cy, r + 26, 0.05 * Math.PI, 0.95 * Math.PI, true);
  ctx.closePath();

  // Visor Gradient (Realistic sunlight on curved safety-orange/red plastic)
  const visorGrad = ctx.createLinearGradient(cx, topVisorPeakY, cx, cy);
  visorGrad.addColorStop(0, '#FA542A'); // Bright sunlit top edge
  visorGrad.addColorStop(0.3, '#E53E1B'); // Classic traffic red
  visorGrad.addColorStop(0.8, '#C62E0E');
  visorGrad.addColorStop(1, '#931E07'); // Deep underside shadow
  ctx.fillStyle = visorGrad;
  ctx.fill();

  // Visor outer lip highlight line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // Visor drop shadow onto the upper rim
  ctx.restore();

  // 2. Thick Molded Red Plastic Circular Rim
  const rimGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  rimGrad.addColorStop(0, '#F54E25');
  rimGrad.addColorStop(0.3, '#E03816');
  rimGrad.addColorStop(0.7, '#C52B0C');
  rimGrad.addColorStop(1, '#941B05');

  ctx.fillStyle = rimGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 28, 0, Math.PI * 2);
  ctx.fill();

  // 3. Molded Plastic Tubular Highlight Ring
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 20, 0, Math.PI * 2);
  ctx.stroke();

  // Bottom shadow on rim
  ctx.strokeStyle = 'rgba(60, 10, 5, 0.5)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 27, 0, Math.PI * 2);
  ctx.stroke();

  // 4. Inner Dark Gasket Rubber Seal (holding mirror acrylic)
  ctx.fillStyle = '#261F1E';
  ctx.beginPath();
  ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
  ctx.fill();

  // Thin metallic silver retaining ring
  ctx.strokeStyle = '#D1D5DB';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 1, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawTrafficVisorHighlight(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number
) {
  // Delicate specular reflection across the top hood
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 23, -0.75 * Math.PI, -0.25 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

function drawMirrorBow(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);

  // Left bow wing
  ctx.fillStyle = '#F4A6BF';
  ctx.strokeStyle = '#D36B8D';
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-25, -20, -50, -10, -45, 12);
  ctx.bezierCurveTo(-40, 26, -20, 20, 0, 5);
  ctx.fill();
  ctx.stroke();

  // Right bow wing
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(25, -20, 50, -10, 45, 12);
  ctx.bezierCurveTo(40, 26, 20, 20, 0, 5);
  ctx.fill();
  ctx.stroke();

  // Center knot
  ctx.fillStyle = '#E284A1';
  ctx.beginPath();
  ctx.arc(0, 2, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Ribbons hanging down
  ctx.fillStyle = '#F4A6BF';
  ctx.beginPath();
  ctx.moveTo(-5, 8);
  ctx.lineTo(-20, 38);
  ctx.lineTo(-10, 34);
  ctx.lineTo(-2, 10);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(5, 8);
  ctx.lineTo(20, 38);
  ctx.lineTo(10, 34);
  ctx.lineTo(2, 10);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}
