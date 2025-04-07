import type { Version, Point } from '../index.js';
import { Bitmap, utils } from '../index.js';

const { info } = utils;

/**
 * Returns coordinates of all black modules in a bitmap.
 */
export function getBlackModules(bitmap: Bitmap): Point[] {
  const blackModules: Point[] = [];
  const { width, height } = bitmap;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (bitmap.data[y][x] === true) {
        blackModules.push({ x, y });
      }
    }
  }
  return blackModules;
}

/**
 * Generates a set of coordinates (as "y,x" strings) for protected modules
 * (finders, alignment, timing, format, version) that should not be replaced.
 */
export function getProtectedCoordinates(version: Version, size: number): Set<string> {
  const protectedCoords = new Set<string>();
  const addPoint = (p: Point) => protectedCoords.add(`${p.y},${p.x}`);
  const addRect = (p: Point, s: { width: number; height: number }) => {
    for (let y = p.y; y < p.y + s.height; y++) {
      for (let x = p.x; x < p.x + s.width; x++) {
        // Ensure coordinates are within bounds, although they should be by calculation
        if (x >= 0 && x < size && y >= 0 && y < size) {
           addPoint({ x, y });
        }
      }
    }
  };

  // Finder Patterns (including separators) - 8x8 areas for V1, but we use 8 to be safe for separators
  addRect({ x: 0, y: 0 }, { width: 8, height: 8 }); // Top-left
  addRect({ x: size - 8, y: 0 }, { width: 8, height: 8 }); // Top-right
  addRect({ x: 0, y: size - 8 }, { width: 8, height: 8 }); // Bottom-left

  // Alignment Patterns (5x5 areas)
  const alignPos = info.alignmentPatterns(version);
  for (const y of alignPos) {
    for (const x of alignPos) {
      // Check if the center of the alignment pattern overlaps with finder patterns
      if (
        (x < 8 && y < 8) ||             // Top-left finder
        (x >= size - 8 && y < 8) ||       // Top-right finder
        (x < 8 && y >= size - 8)        // Bottom-left finder
      ) {
        continue; // Skip drawing alignment pattern here
      }
      addRect({ x: x - 2, y: y - 2 }, { width: 5, height: 5 });
    }
  }

  // Timing Patterns
  for (let i = 8; i < size - 8; i++) {
    addPoint({ x: i, y: 6 }); // Horizontal
    addPoint({ x: 6, y: i }); // Vertical
  }

  // Format Information
  // Vertical strip near top-left finder (including corner)
  for (let y = 0; y < 9; y++) if (y !== 6) addPoint({ x: 8, y }); // Skip timing pattern intersection
  // Horizontal strip near top-left finder (including corner)
  for (let x = 0; x < 9; x++) if (x !== 6) addPoint({ x: x, y: 8 }); // Skip timing pattern intersection

  // Vertical strip near bottom-left finder
  for (let y = size - 8; y < size; y++) addPoint({ x: 8, y });
  // Horizontal strip near top-right finder
  for (let x = size - 8; x < size; x++) addPoint({ x: x, y: 8 });

  // Dark module - already covered by format info strips intersection? Let's add explicitly.
  addPoint({ x: 8, y: size - 8 });

  // Version Information (if applicable)
  if (version >= 7) {
    // 6x3 blocks near bottom-left and top-right
    const versionAreaSize = 3;
    const versionAreaOffset = 11; // size - 11
    // Area near bottom-left (transposed)
    addRect({ x: 0, y: size - versionAreaOffset }, { width: 6, height: versionAreaSize });
    // Area near top-right
    addRect({ x: size - versionAreaOffset, y: 0 }, { width: versionAreaSize, height: 6 });
  }

  return protectedCoords;
}


/**
 * Returns coordinates of black modules that can be replaced with patterns.
 * Excludes finder, alignment, timing, format, and version info areas.
 */
export function getReplaceableModules(bitmap: Bitmap, version: Version): Point[] {
  const size = bitmap.width;
  if (size !== bitmap.height) throw new Error('Bitmap must be square');
  // Validate version against size only if version is provided and valid
  if (version >= 1 && version <= 40 && info.size.encode(version) !== size) {
      throw new Error(`Bitmap size (${size}x${size}) does not match version ${version} (${info.size.encode(version)}x${info.size.encode(version)})`);
  }

  const blackModules = getBlackModules(bitmap);
  const protectedCoords = getProtectedCoordinates(version, size);

  return blackModules.filter(p => !protectedCoords.has(`${p.y},${p.x}`));
}
