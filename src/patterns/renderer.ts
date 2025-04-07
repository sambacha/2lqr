// --- SVG Rendering ---

// Helper to create SVG elements as strings
const svgRect = (x: number, y: number, w: number, h: number, fill: string): string =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" />`;

const svgLine = (x1: number, y1: number, x2: number, y2: number, stroke: string, strokeWidth: number): string =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;

const svgCircle = (cx: number, cy: number, r: number, fill: string): string =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" />`;

/**
 * Generates an SVG string snippet for a given pattern index within a 1x1 module area.
 * @param patternIndex 0-7 corresponding to patterns P1-P8.
 * @param x The top-left x-coordinate of the module.
 * @param y The top-left y-coordinate of the module.
 * @returns SVG string snippet.
 */
export function getPatternSvgString(patternIndex: number, x: number, y: number): string {
    const bg = svgRect(x, y, 1, 1, 'black'); // Black background for all patterns
    let foreground = '';
    const strokeWidth = 0.18; // Approx 15-20%
    const centerSize = 0.5; // Approx 40-50% area/diameter
    const frameThickness = 0.18;
    const dotSize = 0.4; // Approx 15-20% area -> sqrt(0.18/pi) * 2 ~ 0.4 diameter? Let's use 0.4x0.4 square for simplicity.
    const dotOffset = 0.05; // Small offset from corner

    switch (patternIndex) {
        case 0: // P1: Square Center
            foreground = svgRect(x + (1 - centerSize) / 2, y + (1 - centerSize) / 2, centerSize, centerSize, 'white');
            break;
        case 1: // P2: Circle Center
            foreground = svgCircle(x + 0.5, y + 0.5, centerSize / 2, 'white');
            break;
        case 2: // P3: Diagonal Cross
            foreground = svgLine(x, y, x + 1, y + 1, 'white', strokeWidth) +
                         svgLine(x, y + 1, x + 1, y, 'white', strokeWidth);
            break;
        case 3: // P4: Horizontal Bar
            foreground = svgRect(x, y + (1 - centerSize) / 2, 1, centerSize, 'white');
            break;
        case 4: // P5: Vertical Bar
            foreground = svgRect(x + (1 - centerSize) / 2, y, centerSize, 1, 'white');
            break;
        case 5: // P6: Corner Dots (using squares for simplicity)
             foreground = svgRect(x + dotOffset, y + dotOffset, dotSize, dotSize, 'white') + // TL
                          svgRect(x + 1 - dotOffset - dotSize, y + dotOffset, dotSize, dotSize, 'white') + // TR
                          svgRect(x + dotOffset, y + 1 - dotOffset - dotSize, dotSize, dotSize, 'white') + // BL
                          svgRect(x + 1 - dotOffset - dotSize, y + 1 - dotOffset - dotSize, dotSize, dotSize, 'white'); // BR
            break;
        case 6: // P7: Checkered
            foreground = svgRect(x, y, 0.5, 0.5, 'white') + // TL quadrant
                         svgRect(x + 0.5, y + 0.5, 0.5, 0.5, 'white'); // BR quadrant
            break;
        case 7: // P8: Border Frame
            foreground = svgRect(x + frameThickness, y + frameThickness, 1 - 2 * frameThickness, 1 - 2 * frameThickness, 'white');
            break;
        default:
            // Should not happen, but return just background if index is invalid
            return bg;
    }
    return bg + foreground;
}


// --- Pixel Buffer Rendering (for GIF etc.) ---

// Pixel buffer format: Uint8Array, 0 = black, 1 = white (or vice versa, needs consistency)
// Let's assume 0 = black, 1 = white for now.

type PixelBufferContext = {
    buffer: Uint8Array;
    bufferWidth: number;
    moduleStartX: number; // Top-left pixel x of the current module
    moduleStartY: number; // Top-left pixel y of the current module
    modulePixelSize: number; // Size of the module in pixels
};

// Helper to set a pixel in the buffer
function setPixel(ctx: PixelBufferContext, x: number, y: number, color: 0 | 1) {
    const px = ctx.moduleStartX + x;
    const py = ctx.moduleStartY + y;
    // Basic bounds check
    if (px >= 0 && px < ctx.bufferWidth && py >= 0 && py < (ctx.buffer.length / ctx.bufferWidth)) {
        ctx.buffer[py * ctx.bufferWidth + px] = color;
    }
}

// Helper to draw a filled rectangle in the buffer
function fillRect(ctx: PixelBufferContext, x: number, y: number, w: number, h: number, color: 0 | 1) {
    const endX = x + w;
    const endY = y + h;
    for (let py = y; py < endY; py++) {
        for (let px = x; px < endX; px++) {
            // Clip coordinates to module boundaries
            if (px >= 0 && px < ctx.modulePixelSize && py >= 0 && py < ctx.modulePixelSize) {
                setPixel(ctx, px, py, color);
            }
        }
    }
}

// Helper to draw a line (simple Bresenham or similar could be used for accuracy)
// For simplicity, using thick rectangles for now.
function drawLine(ctx: PixelBufferContext, x1: number, y1: number, x2: number, y2: number, thickness: number, color: 0 | 1) {
    // Basic horizontal/vertical/diagonal line drawing - needs refinement for arbitrary angles
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;

    // Adjust thickness - very basic approximation
    const halfThick = Math.max(1, Math.floor(thickness / 2));

    let cx = x1;
    let cy = y1;

    while (true) {
         fillRect(ctx, cx - halfThick, cy - halfThick, thickness, thickness, color);

        if (cx === x2 && cy === y2) break;
        const e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            cx += sx;
        }
        if (e2 < dx) {
            err += dx;
            cy += sy;
        }
    }
}

// Helper to draw a filled circle
function fillCircle(ctx: PixelBufferContext, cx: number, cy: number, r: number, color: 0 | 1) {
    const rSquared = r * r;
    for (let y = -r; y <= r; y++) {
        for (let x = -r; x <= r; x++) {
            if (x * x + y * y <= rSquared) {
                 const px = Math.round(cx + x);
                 const py = Math.round(cy + y);
                 if (px >= 0 && px < ctx.modulePixelSize && py >= 0 && py < ctx.modulePixelSize) {
                    setPixel(ctx, px, py, color);
                 }
            }
        }
    }
}


/**
 * Draws a pattern onto a pixel buffer.
 * @param patternIndex 0-7 corresponding to patterns P1-P8.
 * @param buffer The pixel buffer (Uint8Array, 0=black, 1=white).
 * @param bufferWidth The width of the pixel buffer.
 * @param moduleStartX Top-left pixel x of the module block.
 * @param moduleStartY Top-left pixel y of the module block.
 * @param modulePixelSize The size of the module in pixels.
 */
export function drawPatternPixels(
    patternIndex: number,
    buffer: Uint8Array,
    bufferWidth: number,
    moduleStartX: number,
    moduleStartY: number,
    modulePixelSize: number
): void { // Added explicit return type
    const ctx: PixelBufferContext = { buffer, bufferWidth, moduleStartX, moduleStartY, modulePixelSize };
    const size = modulePixelSize;

    // Draw black background first
    fillRect(ctx, 0, 0, size, size, 0); // 0 = black

    // Define relative sizes based on modulePixelSize
    const strokeWidth = Math.max(1, Math.round(size * 0.18));
    const centerSize = Math.round(size * 0.5);
    const centerOffset = Math.round((size - centerSize) / 2);
    const frameThickness = Math.max(1, Math.round(size * 0.18));
    const dotSize = Math.max(1, Math.round(size * 0.4)); // Approx 0.16 area
    const dotOffset = Math.max(1, Math.round(size * 0.05));

    switch (patternIndex) {
        case 0: // P1: Square Center
            fillRect(ctx, centerOffset, centerOffset, centerSize, centerSize, 1); // 1 = white
            break;
        case 1: // P2: Circle Center
            fillCircle(ctx, size / 2, size / 2, centerSize / 2, 1);
            break;
        case 2: // P3: Diagonal Cross
            drawLine(ctx, 0, 0, size - 1, size - 1, strokeWidth, 1);
            drawLine(ctx, 0, size - 1, size - 1, 0, strokeWidth, 1);
            break;
        case 3: // P4: Horizontal Bar
            fillRect(ctx, 0, centerOffset, size, centerSize, 1);
            break;
        case 4: // P5: Vertical Bar
            fillRect(ctx, centerOffset, 0, centerSize, size, 1);
            break;
        case 5: // P6: Corner Dots
            fillRect(ctx, dotOffset, dotOffset, dotSize, dotSize, 1); // TL
            fillRect(ctx, size - dotOffset - dotSize, dotOffset, dotSize, dotSize, 1); // TR
            fillRect(ctx, dotOffset, size - dotOffset - dotSize, dotSize, dotSize, 1); // BL
            fillRect(ctx, size - dotOffset - dotSize, size - dotOffset - dotSize, dotSize, dotSize, 1); // BR
            break;
        case 6: // P7: Checkered
            const halfSize = Math.ceil(size / 2);
            fillRect(ctx, 0, 0, halfSize, halfSize, 1); // TL quadrant
            fillRect(ctx, halfSize, halfSize, size - halfSize, size - halfSize, 1); // BR quadrant
            break;
        case 7: // P8: Border Frame
            fillRect(ctx, frameThickness, frameThickness, size - 2 * frameThickness, size - 2 * frameThickness, 1);
            break;
        default:
            // Only black background is drawn
            break;
    }
}
