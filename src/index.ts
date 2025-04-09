/*!
Copyright (c) 2023 Paul Miller (paulmillr.com)
The library paulmillr-qr is dual-licensed under the Apache 2.0 OR MIT license.
You can select a license of your choice.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/**
 * Main entry point for QR code encoding.
 * Check out decode.ts for decoding (reading).
 * @module
 * @example
```js
import encodeQR from '@paulmillr/qr';
const txt = 'Hello world';
const ascii = encodeQR(txt, 'ascii'); // Not all fonts are supported
const terminalFriendly = encodeQR(txt, 'term'); // 2x larger, all fonts are OK
const gifBytes = encodeQR(txt, 'gif'); // Uncompressed GIF
const svgElement = encodeQR(txt, 'svg'); // SVG vector image element
const array = encodeQR(txt, 'raw'); // 2d array for canvas or other libs
// import decodeQR from '@paulmillr/qr/decode';
```
 */

// Import necessary items from core_utils
import {
  Bitmap,
  info,
  utils, // utils object contains most needed functions now
  validateVersion, // Exported directly
  bin, // Exported directly
  interleave, // Exported directly
  drawTemplate, // Exported directly
  zigzag, // Exported directly
  penalty, // Exported directly
  // best is available via utils.best
  PATTERNS, // Exported directly
  ECMode, // Exported directly
  Encoding, // Exported directly
  validateECC, // Exported directly
  validateEncoding, // Exported directly
  validateMask, // Exported directly
  type ErrorCorrection,
  type EncodingType,
  type Version,
  type Mask,
  type Point, // Exported directly
  type Size, // Exported directly
  type Image, // Exported directly
  // Coder is likely not needed directly here, but re-exported below if necessary
} from './core_utils.js';

// Import general utilities only if NOT available via core_utils.utils
// utf8ToBytes is available via utils_general but also exported in core_utils.utils? Check core_utils.
// It seems utf8ToBytes is imported but not re-exported by core_utils.utils. Let's import it.
import { utf8ToBytes } from './utils_general.js';

// Export 2LQR specific functions and types
export { encode2LQR } from './dual/encoder.js';
export type { Encode2LQROptions, PatternMap } from './dual/encoder.js';
// Export 2LQR decoder function and types
export { decode2LQR } from './dual/decoder.js';
export type { Decode2LQROptions, Decode2LQRResult } from './dual/decoder.js';

// Export standard decoder function
export { decodeQR } from './decode.js';
export type { DecodeOpts } from './decode.js'; // Export decoder options type

// Re-export core types and classes needed by external users
export { Bitmap }; // Add Bitmap export
export type { ErrorCorrection, Version, Mask, EncodingType, Point, Size, Image };

// --- Main Encoding Logic --- (Depends on functions imported above)

// NOTE: byte encoding is just representation, QR works with strings only. Most decoders will fail on raw byte array,
// since they expect unicode or other text encoding inside bytes
function detectType(str: string): EncodingType {
  let type: EncodingType = 'numeric';
  for (let x of str) {
    if (info.alphabet.numeric.has(x)) continue;
    type = 'alphanumeric';
    if (!info.alphabet.alphanumeric.has(x)) return 'byte';
  }
  return type;
}

// Global symbols in both browsers and Node.js since v11
// See https://github.com/microsoft/TypeScript/issues/31535
declare const TextEncoder: any;

function encode(ver: Version, ecc: ErrorCorrection, data: string, type: EncodingType): Uint8Array {
  let encoded = '';
  let dataLen = data.length;
  if (type === 'numeric') {
    const t = info.alphabet.numeric.decode(data.split(''));
    const n = t.length;
    for (let i = 0; i < n - 2; i += 3) encoded += bin(t[i] * 100 + t[i + 1] * 10 + t[i + 2], 10);
    if (n % 3 === 1) {
      encoded += bin(t[n - 1], 4);
    } else if (n % 3 === 2) {
      encoded += bin(t[n - 2] * 10 + t[n - 1], 7);
    }
  } else if (type === 'alphanumeric') {
    const t = info.alphabet.alphanumeric.decode(data.split(''));
    const n = t.length;
    for (let i = 0; i < n - 1; i += 2) encoded += bin(t[i] * 45 + t[i + 1], 11);
    if (n % 2 == 1) encoded += bin(t[n - 1], 6); // pad if odd number of chars
  } else if (type === 'byte') {
    const utf8 = utf8ToBytes(data);
    dataLen = utf8.length;
    encoded = Array.from(utf8)
      .map((i) => bin(i, 8))
      .join('');
  } else {
    throw new Error('encode: unsupported type');
  }
  const { capacity } = info.capacity(ver, ecc);
  const len = bin(dataLen, info.lengthBits(ver, type));
  let bits = info.modeBits[type] + len + encoded;
  if (bits.length > capacity) throw new Error('Capacity overflow');
  // Terminator
  bits += '0'.repeat(Math.min(4, Math.max(0, capacity - bits.length)));
  // Pad bits string untill full byte
  if (bits.length % 8) bits += '0'.repeat(8 - (bits.length % 8));
  // Add padding until capacity is full
  const padding = '1110110000010001';
  for (let idx = 0; bits.length !== capacity; idx++) bits += padding[idx % padding.length];
  // Convert a bitstring to array of bytes
  const bytes = Uint8Array.from(bits.match(/(.{8})/g)!.map((i) => Number(`0b${i}`)));
  return interleave(ver, ecc).encode(bytes);
}

// DRAW
function drawQR(
  ver: Version,
  ecc: ErrorCorrection,
  data: Uint8Array,
  maskIdx: Mask,
  test: boolean = false
): Bitmap {
  const b = drawTemplate(ver, ecc, maskIdx, test);
  let i = 0;
  const need = 8 * data.length;
  zigzag(b, maskIdx, (x, y, mask) => {
    let value = false;
    if (i < need) {
      value = ((data[i >>> 3] >> ((7 - i) & 7)) & 1) !== 0;
      i++;
    }
    b.data[y][x] = value !== mask; // !== as xor
  });
  if (i !== need) throw new Error('QR: bytes left after draw');
  return b;
}

// Selects best mask according to penalty, if no mask is provided
function drawQRBest(ver: Version, ecc: ErrorCorrection, data: Uint8Array, maskIdx?: Mask): Bitmap {
  if (maskIdx === undefined) {
    const bestMask = utils.best<Mask>(); // Use utils.best here
    for (let mask = 0; mask < PATTERNS.length; mask++)
      bestMask.add(penalty(drawQR(ver, ecc, data, mask as Mask, true)), mask as Mask);
    maskIdx = bestMask.get();
  }
  if (maskIdx === undefined) throw new Error('Cannot find mask'); // Should never happen
  return drawQR(ver, ecc, data, maskIdx);
}

/** QR Code generation options. */
export type QrOpts = {
  ecc?: ErrorCorrection | undefined;
  encoding?: EncodingType | undefined;
  version?: Version | undefined;
  mask?: number | undefined; // Allow number for input flexibility
  border?: number | undefined;
  scale?: number | undefined;
};

export type Output = 'raw' | 'ascii' | 'term' | 'gif' | 'svg';

/**
 * Encodes (creates / generates) QR code.
 * @param text text that would be encoded
 * @param output output type: raw, ascii, svg, gif, or term
 * @param opts
 * @example
```js
const txt = 'Hello world';
const ascii = encodeQR(txt, 'ascii'); // Not all fonts are supported
const terminalFriendly = encodeQR(txt, 'term'); // 2x larger, all fonts are OK
const gifBytes = encodeQR(txt, 'gif'); // Uncompressed GIF
const svgElement = encodeQR(txt, 'svg'); // SVG vector image element
const array = encodeQR(txt, 'raw'); // 2d array for canvas or other libs
```
 */
export function encodeQR(text: string, output: 'raw', opts?: QrOpts): boolean[][];
export function encodeQR(text: string, output: 'ascii' | 'term' | 'svg', opts?: QrOpts): string;
export function encodeQR(text: string, output: 'gif', opts?: QrOpts): Uint8Array;
export function encodeQR(
  text: string,
  output: Output = 'raw',
  opts: QrOpts = {}
): boolean[][] | string | Uint8Array {
  const ecc = opts.ecc !== undefined ? opts.ecc : 'medium';
  validateECC(ecc);
  const encoding = opts.encoding !== undefined ? opts.encoding : detectType(text);
  validateEncoding(encoding);
  // Validate mask only if provided, cast to Mask type for internal use
  const maskOpt = opts.mask !== undefined ? (opts.mask as Mask) : undefined;
  if (maskOpt !== undefined) validateMask(maskOpt);

  const scale = opts.scale !== undefined ? opts.scale : 1;
  let ver = opts.version;
  let data: Uint8Array | undefined,
    err: Error | undefined = new Error('Unknown error'); // Initialize err properly

  if (ver !== undefined) {
    validateVersion(ver);
    try {
      data = encode(ver, ecc, text, encoding);
      err = undefined; // Clear error if encoding succeeds
    } catch (e) {
      err = e instanceof Error ? e : new Error(String(e));
    }
  } else {
    // If no version is provided, try to find smallest one which fits
    err = undefined; // Clear initial error
    for (let i = 1; i <= 40; i++) {
      try {
        data = encode(i, ecc, text, encoding);
        ver = i;
        err = undefined; // Clear error if encoding succeeds
        break; // Found a suitable version
      } catch (e) {
        err = e instanceof Error ? e : new Error(String(e));
        // Continue trying next version
      }
    }
  }

  // If after trying all versions (or the specified one), we still have an error or no data/version
  if (err || !ver || !data) {
    throw (
      err ||
      new Error(
        'Could not encode QR code. Data may be too long for any version or an unknown error occurred.'
      )
    );
  }

  // We have valid ver and data here
  let res = drawQRBest(ver, ecc, data, maskOpt);
  res.assertDrawn();

  const border = opts.border === undefined ? 2 : opts.border;
  if (!Number.isSafeInteger(border) || border < 0) throw new Error(`invalid border size=${border}`); // Added check for negative border
  if (border > 0) {
    res = res.border(border, false); // Add border only if border > 0
  }

  // Scaling for non-vector outputs
  if (opts.scale !== undefined && opts.scale > 1 && ['raw', 'ascii', 'term'].includes(output)) {
    if (!Number.isSafeInteger(opts.scale) || opts.scale <= 0) {
      throw new Error(`invalid scale factor: ${opts.scale}`);
    }
    res = res.scale(opts.scale);
  }

  // TODO: This main function needs to be adapted for 2LQR to generate patternMap
  // For now, assume patternMap is passed somehow (e.g., via opts for testing)
  const patternMap = (opts as any).patternMap as (number | undefined)[][] | undefined;

  if (output === 'raw')
    return res.data as boolean[][]; // Assert type here
  else if (output === 'ascii') return res.toASCII();
  else if (output === 'svg') return res.toSVG(patternMap);
  else if (output === 'gif')
    return res.toGIF(patternMap, scale); // Pass scale for GIF pixel size
  else if (output === 'term') return res.toTerm();
  else throw new Error(`Unknown output: ${output}`);
}

export default encodeQR;

// Define the type for the internal index exports
export type InternalIndexType = {
  encode: typeof encode;
  detectType: typeof detectType;
  drawQR: typeof drawQR;
  drawQRBest: typeof drawQRBest;
  // penalty is already exported from core_utils, no need to re-export here unless desired
};

// Export internal functions for use by other modules like dual/encoder
export const _internalIndex: InternalIndexType = {
  encode: encode,
  detectType: detectType,
  drawQR: drawQR,
  drawQRBest: drawQRBest,
};
