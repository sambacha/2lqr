import { Bitmap, _tests as qrInternals } from '../index.js'; // Import _tests
import type { Version, ErrorCorrection, Mask, QrOpts } from '../index.js';
import { bytesToQarySymbols } from './utils.js';
import { getReplaceableModules } from './modules.js';
//import { encode as rsEncodeQary } from '../ecc_qary/rs_qary_encoder.js'; // Not needed if using GF(256) RS from index
import { scramble } from './scramble.js';

// Use GF(256) logic from _tests for PoC private channel ECC
const { RS } = qrInternals; // Access RS via _tests

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
    qrInternals.validateECC(ecc); // Use _tests
    const encoding = opts.encoding ?? qrInternals.detectType(publicData); // Use _tests
    qrInternals.validateEncoding(encoding); // Use _tests
    if (opts.mask !== undefined) qrInternals.validateMask(opts.mask as Mask); // Use _tests

    let version = opts.version;
    let publicEncodedBytes: Uint8Array | undefined; // Allow undefined initially
    let err = new Error('Could not determine QR version for public data.');

    if (version !== undefined) {
        qrInternals.validateVersion(version); // Use _tests (already in utils, but use _tests for consistency)
        publicEncodedBytes = qrInternals.encode(version, ecc, publicData, encoding); // Use _tests
    } else {
        // Find smallest fitting version
        for (let i = 1; i <= 40; i++) {
            try {
                publicEncodedBytes = qrInternals.encode(i, ecc, publicData, encoding); // Use _tests
                version = i;
                break;
            } catch (e) {
                err = e as Error;
            }
        }
    }
    if (!version || !publicEncodedBytes) throw err;

    // Draw the QR code with the best mask (or specified mask)
    // Need the internal drawQRBest function result
    const { drawQRBest } = qrInternals; // Use _tests
    // Add definite assignment assertions (!) as the check above guarantees assignment
    const baseBitmap = drawQRBest(version!, ecc, publicEncodedBytes!, opts.mask as Mask);
    baseBitmap.assertDrawn(); // Ensure no undefined modules left

    // Determine the actual mask used if it wasn't specified
    // This requires re-calculating penalty or accessing the chosen mask from drawQRBest
    // Let's modify drawQRBest or related functions if needed, or re-calculate penalty here.
    // For now, assume we can get the mask. If opts.mask is set, use it. Otherwise, find best.
    let finalMask: Mask;
     if (opts.mask !== undefined) {
        finalMask = opts.mask as Mask;
    } else {
        const bestMaskResult = qrInternals.best<Mask>(); // Use _tests
        for (let mask = 0; mask < 8; mask++) {
             // Need drawQR to get the bitmap for penalty calculation
             // Add definite assignment assertions (!) here too
             const tempBitmap = qrInternals.drawQR(version!, ecc, publicEncodedBytes!, mask as Mask, true); // Use _tests
             bestMaskResult.add(qrInternals.penalty(tempBitmap), mask as Mask); // Use _tests
        }
        const foundMask = bestMaskResult.get();
        if (foundMask === undefined) throw new Error("Could not determine best mask.");
        finalMask = foundMask;
        // Redraw baseBitmap if mask was auto-selected (drawQRBest already did this)
        // No, drawQRBest already returned the bitmap with the best mask.
    }


    // 2. Identify Replaceable Modules
    const replaceableModules = getReplaceableModules(baseBitmap, version);
    const numReplaceable = replaceableModules.length;

    // 3. Encode Private Data
    const privateBytes = (typeof opts.privateData === 'string')
        ? qrInternals.utf8ToBytes(opts.privateData) // Use _tests
        : opts.privateData;

    const privateQarySymbols = bytesToQarySymbols(privateBytes); // Symbols 0-7

    // Map to GF(256) elements (0-7) for PoC
    const privateGfSymbols = new Uint8Array(privateQarySymbols); // Use Uint8Array for GF(256)

    // Determine ECC level for private channel
    const messageLength = privateGfSymbols.length;
    if (messageLength >= numReplaceable) {
        throw new Error(`Private data too long (${messageLength} symbols) for available capacity (${numReplaceable} modules).`);
    }
    // Calculate available space for ECC symbols
    const eccSymbolsCount = opts.privateEccWords ?? (numReplaceable - messageLength);
    if (eccSymbolsCount <= 0) {
         throw new Error(`Not enough space for private data and ECC symbols. Need ${messageLength}, have ${numReplaceable}.`);
    }
     if (messageLength + eccSymbolsCount > numReplaceable) {
        // Adjust eccSymbolsCount if explicitly provided one is too large
        // Or throw error? Let's throw for now.
         throw new Error(`Requested ECC words (${opts.privateEccWords}) plus message length (${messageLength}) exceeds capacity (${numReplaceable}).`);
    }
     if (messageLength + eccSymbolsCount > 1023) {
         // Our GF(1024) RS encoder limit (n < 1024)
         throw new Error(`Total private codeword length (${messageLength + eccSymbolsCount}) exceeds GF(1024) limit.`);
     }


    // Encode using RS over GF(256) - PoC simplification
    // Need an RS encoder instance for GF(256)
    const rsPrivate = RS(eccSymbolsCount); // Get GF(256) RS encoder via _tests
    const eccCodewordGf256 = rsPrivate.encode(privateGfSymbols); // Pass Uint8Array directly
    const fullCodewordGf256 = new Uint8Array(messageLength + eccSymbolsCount);
    fullCodewordGf256.set(privateGfSymbols, 0); // Set Uint8Array directly
    fullCodewordGf256.set(eccCodewordGf256, messageLength);


    // 4. Scramble Codeword (using Uint8Array for GF256 PoC)
    const scrambledCodewordGf256 = await scramble(fullCodewordGf256, opts.privateKey); // Pass Uint8Array

    // 5. Map Scrambled Symbols to Pattern Indices (0-7) - PoC simplification
    const patternIndices: number[] = [];
    for (let i = 0; i < scrambledCodewordGf256.length; i++) {
        // Take lower 3 bits of the GF(256) symbol
        patternIndices.push(scrambledCodewordGf256[i] & 0x07);
    }

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

export { Bitmap }