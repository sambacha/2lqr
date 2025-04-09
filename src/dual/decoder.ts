import type { Image, Version, ErrorCorrection, Mask } from '../index.js'; // Removed unused Point
import { Bitmap } from '../index.js'; // Import Bitmap class, removed unused _tests import
import { _tests as qrInternalsDecode } from '../decode.js'; // Import decode internals
import { getReplaceableModules } from './modules.js';
import { qarySymbolsToBytes } from './utils.js'; // Assuming this exists for conversion
import { descramble } from './scramble.js'; // Import descramble
import { ReedSolomonGF8 } from '../ecc_qary/gf8.js'; // Import GF(8) RS Coder
// Need to import or implement pattern reading logic

// Destructure necessary functions from respective internals
// Import parseInfo as well
// No need for qrInternalsIndex anymore
const { toBitmap, detect, decodeBitmap: decodeStandardQRData, parseInfo } = qrInternalsDecode; // Others are from decode.ts internals

export type Decode2LQROptions = {
  privateKey: string | Uint8Array;
  // Optional: If the number of ECC symbols is known, it can help resolve ambiguity.
  // Otherwise, the decoder might need to try different possibilities.
  privateEccWords?: number;
};

export type Decode2LQRResult = {
  publicData: string;
  privateData: Uint8Array; // Raw bytes of private data
  version: Version;
  ecc: ErrorCorrection;
  mask: Mask;
  // Optional: Add other potentially useful info for debugging/analysis
  // points?: Point[];
  // patternIndices?: number[];
};

// --- Pattern Reading Helpers (Simplified PoC using binarized 'bits') ---

type Grid3x3 = boolean[][];

// Define simple 3x3 boolean templates for patterns 0-7 based on core features
// True = Black, False = White (matching Bitmap convention)
// Note: P0/P1 and P2/P5 are ambiguous with this simple 3x3 template.
const patternTemplates: Grid3x3[] = [
  /* P0 Square Center */ [
    [true, true, true],
    [true, false, true],
    [true, true, true],
  ],
  /* P1 Circle Center */ [
    [true, true, true],
    [true, false, true],
    [true, true, true],
  ], // Approx same as P0
  /* P2 Diagonal Cross*/ [
    [false, true, false],
    [true, false, true],
    [false, true, false],
  ],
  /* P3 Horizontal Bar*/ [
    [true, true, true],
    [false, false, false],
    [true, true, true],
  ],
  /* P4 Vertical Bar  */ [
    [true, false, true],
    [true, false, true],
    [true, false, true],
  ],
  /* P5 Corner Dots  */ [
    [false, true, false],
    [true, true, true],
    [false, true, false],
  ], // Approx same as P2
  /* P6 Checkered    */ [
    [false, true, true],
    [true, false, true],
    [true, true, false],
  ], // Distinguishes TL/BR white
  /* P7 Border Frame */ [
    [false, false, false],
    [false, true, false],
    [false, false, false],
  ],
];

// Samples a 3x3 area from the bitmap centered at (x, y)
// Handles boundary conditions by returning 'true' (black) for out-of-bounds pixels.
function sampleModuleArea(bitmap: Bitmap, x: number, y: number): Grid3x3 {
  const grid: Grid3x3 = [[], [], []];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const currentY = y + dy;
      const currentX = x + dx;
      let value = true; // Default to black (true) if out of bounds
      if (currentX >= 0 && currentX < bitmap.width && currentY >= 0 && currentY < bitmap.height) {
        // Use !! to convert undefined to false (white)
        value = !!bitmap.data[currentY][currentX];
      }
      grid[dy + 1][dx + 1] = value;
    }
  }
  return grid;
}

// Calculates Hamming distance between two 3x3 boolean grids
function calculateHammingDistance(grid1: Grid3x3, grid2: Grid3x3): number {
  let distance = 0;
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      if (grid1[y][x] !== grid2[y][x]) {
        distance++;
      }
    }
  }
  return distance;
}

// Classifies a sampled grid by finding the template with the minimum Hamming distance
function classifyPattern(sampleGrid: Grid3x3, templates: Grid3x3[]): number {
  let minDistance = Infinity;
  let bestMatchIndex = -1;

  for (let i = 0; i < templates.length; i++) {
    const distance = calculateHammingDistance(sampleGrid, templates[i]);
    if (distance < minDistance) {
      minDistance = distance;
      bestMatchIndex = i;
    }
  }
  // Basic check: if distance is too high, maybe it's not a pattern?
  // Threshold needs tuning. For PoC, always return best match.
  if (bestMatchIndex === -1) {
    console.warn('Could not classify pattern, returning 0 as default.');
    return 0; // Default or throw error?
  }
  return bestMatchIndex;
}

/**
 * Decodes a 2LQR code image to extract public and private data.
 *
 * @param image The input image data.
 * @param opts Options including the privateKey.
 * @returns A Promise resolving to an object containing decoded data and QR parameters.
 */
export async function decode2LQR(image: Image, opts: Decode2LQROptions): Promise<Decode2LQRResult> {
  // --- 1. Standard Decode Prep ---
  // Convert image to internal bitmap
  const bmp = toBitmap(image);
  // Detect QR code, get perspective-corrected bits, finder points, module size, and transform matrix
  // Comment out unused variables for now
  const { bits /*, points, moduleSize, transformMatrix */ } = detect(bmp);
  // Parse version, ECC level, and mask from the corrected bits
  const { version, ecc, mask } = parseInfo(bits);
  console.log(`Detected QR: Version=${version}, ECC=${ecc}, Mask=${mask}`);

  // --- 2. Identify Replaceable Modules ---
  const replaceableModules = getReplaceableModules(bits, version);
  const numReplaceable = replaceableModules.length;
  console.log(`Found ${numReplaceable} replaceable modules.`);
  if (numReplaceable === 0) {
    throw new Error('No replaceable modules found in the QR code.');
  }
  // Apply deterministic ordering (simple row-major for now, matching encoder PoC)
  // TODO: Implement sigma ordering if needed
  const orderedModules = replaceableModules.sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });

  // --- 3. Read Patterns ---
  // Iterate through ordered modules, sample the 'bits' bitmap, and classify pattern
  const patternIndices: number[] = [];
  for (const modulePoint of orderedModules) {
    const sampleGrid = sampleModuleArea(bits, modulePoint.x, modulePoint.y);
    const patternIndex = classifyPattern(sampleGrid, patternTemplates);
    patternIndices.push(patternIndex);
  }
  console.log(`Read ${patternIndices.length} pattern indices.`);
  // console.log("Pattern Indices:", patternIndices); // Optional: Log for debugging

  // --- 4. Descramble ---
  // patternIndices contains numbers 0-7, representing the scrambled GF(8) symbols.
  // Convert to Uint8Array for descramble function.
  const scrambledCodewordUint8 = new Uint8Array(patternIndices);
  // Call the descramble function
  const descrambledCodewordUint8 = await descramble(scrambledCodewordUint8, opts.privateKey);
  // Convert back to number[] for GF(8) RS decoding
  const descrambledCodewordGf8 = Array.from(descrambledCodewordUint8);
  console.log(`Descrambled codeword length: ${descrambledCodewordGf8.length} symbols`);

  // --- 5. Private ECC Decode ---
  // For PoC, require privateEccWords to be provided, otherwise error out.
  const totalCodewordLength = descrambledCodewordGf8.length;
  if (opts.privateEccWords === undefined) {
    throw new Error(
      "Cannot determine private data ECC length. Please provide 'privateEccWords' in options for PoC decoding."
    );
  }
  const eccLen = opts.privateEccWords;
  // Check GF(8) RS limits (n <= 7)
  if (totalCodewordLength > 7) {
    throw new Error(
      `Received codeword length (${totalCodewordLength}) exceeds GF(8) block size limit (7).`
    );
  }
  if (eccLen <= 0 || eccLen >= totalCodewordLength) {
    throw new Error(
      `Invalid privateEccWords (${eccLen}) for codeword length (${totalCodewordLength}).`
    );
  }
  const messageLen = totalCodewordLength - eccLen;
  let privateDataGf8Symbols: number[]; // Now a number array

  try {
    const rsPrivate = ReedSolomonGF8(eccLen); // Get GF(8) RS decoder
    // Decode expects number[]
    const decoded = rsPrivate.decode(descrambledCodewordGf8); // Decode full codeword (placeholder decode)
    // Assume decoding is successful if no error is thrown by rsPrivate.decode
    privateDataGf8Symbols = decoded.slice(0, messageLen); // Result is number[]
    console.log(`Decoded private data assuming ${eccLen} ECC words.`);
  } catch (e) {
    console.error(`RS decoding failed with ${eccLen} ECC words:`, e);
    throw new Error(`Failed to decode private data with ${eccLen} ECC words.`);
  }

  // --- 6. Extract Private Data ---
  // Convert GF(8) symbols (0-7) back to bytes.
  // qarySymbolsToBytes expects number[]
  const privateData = qarySymbolsToBytes(privateDataGf8Symbols);

  // --- 7. Extract Public Data ---
  // Use the standard QR data decoding logic on the `bits` bitmap.
  const publicData = decodeStandardQRData(bits); // Use internal function

  // --- 8. Return Result ---
  return {
    publicData,
    privateData,
    version,
    ecc,
    mask,
  };
}
