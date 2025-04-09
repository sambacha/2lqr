import { Bitmap } from '../index.js'; // Import _tests
import type { Version, ErrorCorrection, Mask, QrOpts } from '../index.js';
import { bytesToQarySymbols } from './utils.js'; // Use this for GF(8) symbols
import { getReplaceableModules } from './modules.js';
import { ReedSolomonGF8 } from '../ecc_qary/gf8.js'; // Import GF(8) RS Coder
import { scramble } from './scramble.js';
// Import necessary functions from correct modules
import {
  utils,
  validateECC,
  validateEncoding,
  validateMask,
  penalty, // Import penalty from core_utils
} from '../core_utils.js';
import { utf8ToBytes } from '../utils_general.js';
import { _internalIndex } from '../index.js'; // Import the internal object

export type PatternMap = (number | undefined)[][];

export type Encode2LQROptions = QrOpts & {
  // Options specific to 2LQR
  privateData: string | Uint8Array;
  privateKey: string | Uint8Array;
  // Allow specifying ECC words for private channel, otherwise calculate based on capacity
  privateEccWords?: number;
};

/**
 * Encodes a 2LQR code with public and private data.
 *
 * @param publicData The public message string.
 * @param opts Options including privateData, privateKey, and standard QR options.
 * @returns A Promise resolving to an object { bitmap: Bitmap, patternMap: PatternMap, version: Version, mask: Mask }
 */
export async function encode2LQR(
  publicData: string,
  opts: Encode2LQROptions
): Promise<{ bitmap: Bitmap; patternMap: PatternMap; version: Version; mask: Mask }> {
  // 1. Generate Standard QR for Public Data to determine parameters
  // We need the internal bitmap *before* bordering/scaling.
  // Let's call the internal parts of encodeQR.

  const ecc: ErrorCorrection = opts.ecc ?? 'medium';
  validateECC(ecc); // Use imported function
  const encoding = opts.encoding ?? _internalIndex.detectType(publicData); // Use _internalIndex.detectType
  validateEncoding(encoding); // Use imported function
  if (opts.mask !== undefined) validateMask(opts.mask as Mask); // Use imported function

  let version = opts.version;
  let publicEncodedBytes: Uint8Array | undefined; // Allow undefined initially
  let err = new Error('Could not determine QR version for public data.');

  if (version !== undefined) {
    utils.validateVersion(version); // Use utils.validateVersion
    publicEncodedBytes = _internalIndex.encode(version, ecc, publicData, encoding); // Use _internalIndex.encode
  } else {
    // Find smallest fitting version
    for (let i = 1; i <= 40; i++) {
      try {
        publicEncodedBytes = _internalIndex.encode(i, ecc, publicData, encoding); // Use _internalIndex.encode
        version = i;
        break;
      } catch (e) {
        err = e as Error;
      }
    }
  }
  if (!version || !publicEncodedBytes) throw err;

  // Draw the QR code with the best mask (or specified mask)
  // Use _internalIndex.drawQRBest
  // Add definite assignment assertions (!) as the check above guarantees assignment
  const baseBitmap = _internalIndex.drawQRBest(
    version!,
    ecc,
    publicEncodedBytes!,
    opts.mask as Mask
  );
  baseBitmap.assertDrawn(); // Ensure no undefined modules left

  // Determine the actual mask used if it wasn't specified
  // This requires re-calculating penalty or accessing the chosen mask from drawQRBest
  // Let's modify drawQRBest or related functions if needed, or re-calculate penalty here.
  // For now, assume we can get the mask. If opts.mask is set, use it. Otherwise, find best.
  let finalMask: Mask;
  if (opts.mask !== undefined) {
    finalMask = opts.mask as Mask;
  } else {
    // Initialize bestMaskResult without the problematic type argument
    const bestMaskResult = utils.best<Mask>(); // Use utils.best from core_utils
    for (let mask = 0; mask < 8; mask++) {
      // Need drawQR to get the bitmap for penalty calculation
      // Add definite assignment assertions (!) here too
      const tempBitmap = _internalIndex.drawQR(
        version!,
        ecc,
        publicEncodedBytes!,
        mask as Mask,
        true
      ); // Use _internalIndex.drawQR
      bestMaskResult.add(penalty(tempBitmap), mask as Mask); // Use penalty from core_utils
    }
    const foundMask = bestMaskResult.get();
    if (foundMask === undefined) throw new Error('Could not determine best mask.');
    finalMask = foundMask;
    // Redraw baseBitmap if mask was auto-selected (drawQRBest already did this)
    // No, drawQRBest already returned the bitmap with the best mask.
  }

  // 2. Identify Replaceable Modules
  const replaceableModules = getReplaceableModules(baseBitmap, version);
  const numReplaceable = replaceableModules.length;

  // 3. Encode Private Data
  const privateBytes =
    typeof opts.privateData === 'string'
      ? utf8ToBytes(opts.privateData) // Use imported utf8ToBytes
      : opts.privateData;

  // Convert private bytes directly to GF(8) symbols (numbers 0-7)
  const privateGf8Symbols = bytesToQarySymbols(privateBytes);

  // Determine ECC level for private channel
  const messageLength = privateGf8Symbols.length;
  // Calculate available space for ECC symbols (GF(8) symbols)
  const eccSymbolsCount =
    opts.privateEccWords ?? Math.floor((numReplaceable - messageLength) * 0.5); // Example: Use half available space for ECC? Needs better strategy.
  if (eccSymbolsCount <= 0) {
    throw new Error(
      `Not enough space for private data and ECC symbols. Need ${messageLength}, have ${numReplaceable}.`
    );
  }
  const totalCodewordLen = messageLength + eccSymbolsCount;
  if (totalCodewordLen > numReplaceable) {
    throw new Error(
      `Calculated total codeword length (${totalCodewordLen}) exceeds capacity (${numReplaceable}). Reduce data or privateEccWords.`
    );
  }
  // Check GF(8) RS limits (n <= 7)
  if (totalCodewordLen > 7) {
    // This will likely always be hit for non-trivial data.
    // Indicates that simple GF(8) RS is too limited for this capacity.
    // For PoC, we might need to chunk data or use a different code.
    // Let's throw an error for now.
    throw new Error(
      `Total private codeword length (${totalCodewordLen}) exceeds GF(8) block size limit (7).`
    );
  }

  // Encode using RS over GF(8)
  const rsPrivate = ReedSolomonGF8(eccSymbolsCount);
  const eccCodewordGf8 = rsPrivate.encode(privateGf8Symbols); // Pass number[]
  const fullCodewordGf8 = [...privateGf8Symbols, ...eccCodewordGf8]; // Combine message and ECC

  // 4. Scramble Codeword (using GF(8) symbols - number[])
  // Scramble expects Uint8Array, so convert GF(8) symbols (0-7) to Uint8Array
  const fullCodewordUint8 = new Uint8Array(fullCodewordGf8);
  const scrambledCodewordUint8 = await scramble(fullCodewordUint8, opts.privateKey);

  // 5. Map Scrambled Symbols (0-7) directly to Pattern Indices (0-7)
  const patternIndices: number[] = Array.from(scrambledCodewordUint8); // Direct mapping

  // 6. Create Pattern Map
  const patternMap: PatternMap = Array.from({ length: baseBitmap.height }, () =>
    new Array(baseBitmap.width).fill(undefined)
  );

  // Apply deterministic ordering (simple row-major for now)
  // TODO: Implement sigma ordering from SPEC if needed for robustness
  const orderedModules = replaceableModules.sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });

  // Place patterns
  const numPatternsToPlace = Math.min(patternIndices.length, orderedModules.length);
  for (let i = 0; i < numPatternsToPlace; i++) {
    const point = orderedModules[i];
    const patternIndex = patternIndices[i];
    patternMap[point.y][point.x] = patternIndex;
    // Ensure the base bitmap remains black where patterns are placed
    if (baseBitmap.data[point.y][point.x] !== true) {
      console.warn(`Warning: Placing pattern on non-black module at (${point.x}, ${point.y})`);
      baseBitmap.data[point.y][point.x] = true; // Force black background
    }
  }

  // 7. Return result (without border/scaling applied here)
  return { bitmap: baseBitmap, patternMap, version, mask: finalMask };
}

export { Bitmap };
