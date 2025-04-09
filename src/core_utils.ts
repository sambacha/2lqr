/*!
Core utilities moved from index.ts to break circular dependencies.
*/
import {
  mod,
  fillArr,
  interleaveBytes,
  includesAt,
  best,
  alphabet,
  utf8ToBytes,
} from './utils_general.js';
import * as patternRenderer from './patterns/renderer.js';

// --- Type Definitions (Independent) ---
export interface Coder<F, T> {
  encode(from: F): T;
  decode(to: T): F;
}
export type Point = { x: number; y: number };
export type Size = { height: number; width: number };
export type Image = Size & { data: Uint8Array | Uint8ClampedArray | number[] };
type DrawValue = boolean | undefined;
type DrawFn = DrawValue | ((c: Point, curr: DrawValue) => DrawValue);
type ReadFn = (c: Point, curr: DrawValue) => void;
export const ECMode = ['low', 'medium', 'quartile', 'high'] as const;
export type ErrorCorrection = (typeof ECMode)[number];
export type Version = number; // 1..40
export const Encoding = ['numeric', 'alphanumeric', 'byte', 'kanji', 'eci'] as const;
export type EncodingType = (typeof Encoding)[number];

// --- Constants ---
const chCodes = { newline: 10, reset: 27 };
// prettier-ignore
const BYTES = [
  26, 44, 70, 100, 134, 172, 196, 242, 292, 346, 404, 466, 532, 581, 655, 733, 815, 901, 991, 1085,
  1156, 1258, 1364, 1474, 1588, 1706, 1828, 1921, 2051, 2185, 2323, 2465, 2611, 2761, 2876, 3034, 3196, 3362, 3532, 3706,
];
// prettier-ignore
const WORDS_PER_BLOCK = {
  low:      [7,  10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  medium:   [10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  quartile: [13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  high:    [17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
};
// prettier-ignore
const ECC_BLOCKS = {
	low:      [  1, 1, 1, 1, 1, 2, 2, 2, 2, 4,  4,  4,  4,  4,  6,  6,  6,  6,  7,  8,  8,  9,  9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
	medium:   [  1, 1, 1, 2, 2, 4, 4, 4, 5, 5,  5,  8,  9,  9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
	quartile: [  1, 1, 2, 2, 4, 4, 6, 6, 8, 8,  8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
	high:    [  1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
};

// --- Patterns (Define before Mask) ---
export const PATTERNS: readonly ((x: number, y: number) => boolean)[] = [
  (x, y): boolean => (x + y) % 2 == 0,
  (_x, y): boolean => y % 2 == 0,
  (x, _y): boolean => x % 3 == 0,
  (x, y): boolean => (x + y) % 3 == 0,
  (x, y): boolean => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 == 0,
  (x, y): boolean => ((x * y) % 2) + ((x * y) % 3) == 0,
  (x, y): boolean => (((x * y) % 2) + ((x * y) % 3)) % 2 == 0,
  (x, y): boolean => (((x + y) % 2) + ((x * y) % 3)) % 2 == 0,
] as const;

// --- Mask Type (Depends on PATTERNS) ---
export type Mask = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

// --- Core Functions (Independent) ---
export function validateVersion(ver: Version): void {
  if (!Number.isSafeInteger(ver) || ver < 1 || ver > 40)
    throw new Error(`Invalid version=${ver}. Expected number [1..40]`);
}

export function bin(dec: number, pad: number): string {
  return dec.toString(2).padStart(pad, '0');
}

// --- Bitmap Class ---
export class Bitmap {
  private static size(size: Size | number, limit?: Size): Size {
    if (typeof size === 'number') size = { height: size, width: size };
    if (!Number.isSafeInteger(size.height) && size.height !== Infinity)
      throw new Error(`Bitmap: invalid height=${size.height} (${typeof size.height})`);
    if (!Number.isSafeInteger(size.width) && size.width !== Infinity)
      throw new Error(`Bitmap: invalid width=${size.width} (${typeof size.width})`);
    if (limit !== undefined) {
      size = {
        width: Math.min(size.width, limit.width),
        height: Math.min(size.height, limit.height),
      };
    }
    return size;
  }
  static fromString(s: string): Bitmap {
    s = s.replace(/^\n+/g, '').replace(/\n+$/g, '');
    const lines = s.split(String.fromCharCode(chCodes.newline));
    const height = lines.length;
    const data = new Array(height);
    let width: number | undefined;
    for (const line of lines) {
      const row = line.split('').map((i) => {
        if (i === 'X') return true;
        if (i === ' ') return false;
        if (i === '?') return undefined;
        throw new Error(`Bitmap.fromString: unknown symbol=${i}`);
      });
      if (width && row.length !== width)
        throw new Error(`Bitmap.fromString different row sizes: width=${width} cur=${row.length}`);
      width = row.length;
      data.push(row);
    }
    if (!width) width = 0;
    return new Bitmap({ height, width }, data);
  }

  data: DrawValue[][];
  height: number;
  width: number;
  constructor(size: Size | number, data?: DrawValue[][]) {
    const { height, width } = Bitmap.size(size);
    this.data = data || Array.from({ length: height }, () => fillArr(width, undefined));
    this.height = height;
    this.width = width;
  }
  point(p: Point): DrawValue {
    return this.data[p.y][p.x];
  }
  isInside(p: Point): boolean {
    return 0 <= p.x && p.x < this.width && 0 <= p.y && p.y < this.height;
  }
  size(offset?: Point | number): Size {
    if (!offset) return { height: this.height, width: this.width };
    const { x, y } = this.xy(offset);
    return { height: this.height - y, width: this.width - x };
  }
  private xy(c: Point | number): Point {
    if (typeof c === 'number') c = { x: c, y: c };
    if (!Number.isSafeInteger(c.x)) throw new Error(`Bitmap: invalid x=${c.x}`);
    if (!Number.isSafeInteger(c.y)) throw new Error(`Bitmap: invalid y=${c.y}`);
    c.x = mod(c.x, this.width);
    c.y = mod(c.y, this.height);
    return c;
  }
  rect(c: Point | number, size: Size | number, value: DrawFn): this {
    const { x, y } = this.xy(c);
    const { height, width } = Bitmap.size(size, this.size({ x, y }));
    for (let yPos = 0; yPos < height; yPos++) {
      for (let xPos = 0; xPos < width; xPos++) {
        this.data[y + yPos][x + xPos] =
          typeof value === 'function'
            ? value({ x: xPos, y: yPos }, this.data[y + yPos][x + xPos])
            : value;
      }
    }
    return this;
  }
  rectRead(c: Point | number, size: Size | number, fn: ReadFn): this {
    return this.rect(c, size, (c, cur) => {
      fn(c, cur);
      return cur;
    });
  }
  hLine(c: Point | number, len: number, value: DrawFn): this {
    return this.rect(c, { width: len, height: 1 }, value);
  }
  vLine(c: Point | number, len: number, value: DrawFn): this {
    return this.rect(c, { width: 1, height: len }, value);
  }
  border(border = 2, value: DrawValue): Bitmap {
    const height = this.height + 2 * border;
    const width = this.width + 2 * border;
    const v = fillArr(border, value);
    const h: DrawValue[][] = Array.from({ length: border }, () => fillArr(width, value));
    return new Bitmap({ height, width }, [...h, ...this.data.map((i) => [...v, ...i, ...v]), ...h]);
  }
  embed(c: Point | number, bm: Bitmap): this {
    return this.rect(c, bm.size(), ({ x, y }) => bm.data[y][x]);
  }
  rectSlice(c: Point | number, size: Size | number = this.size()): Bitmap {
    const rect = new Bitmap(Bitmap.size(size, this.size(this.xy(c))));
    this.rect(c, size, ({ x, y }, cur) => (rect.data[y][x] = cur));
    return rect;
  }
  inverse(): Bitmap {
    const { height, width } = this;
    const res = new Bitmap({ height: width, width: height });
    return res.rect({ x: 0, y: 0 }, Infinity, ({ x, y }) => this.data[x][y]);
  }
  scale(factor: number): Bitmap {
    if (!Number.isSafeInteger(factor) || factor <= 0 || factor > 1024)
      throw new Error(`invalid scale factor: ${factor}`);
    const { height, width } = this;
    const res = new Bitmap({ height: factor * height, width: factor * width });
    return res.rect(
      { x: 0, y: 0 },
      Infinity,
      ({ x, y }) => this.data[Math.floor(y / factor)][Math.floor(x / factor)]
    );
  }
  clone(): Bitmap {
    const res = new Bitmap(this.size());
    return res.rect({ x: 0, y: 0 }, this.size(), ({ x, y }) => this.data[y][x]);
  }
  assertDrawn(): void {
    this.rectRead(0, Infinity, (_: Point, cur: DrawValue) => {
      // Added type for _
      if (typeof cur !== 'boolean') throw new Error(`Invalid color type=${typeof cur}`);
    });
  }
  toString(): string {
    return this.data
      .map((i) => i.map((j) => (j === undefined ? '?' : j ? 'X' : ' ')).join(''))
      .join(String.fromCharCode(chCodes.newline));
  }
  toASCII(): string {
    const { height, width, data } = this;
    let out = '';
    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x++) {
        const first = data[y][x];
        const second = y + 1 >= height ? true : data[y + 1][x];
        if (!first && !second) out += '█';
        else if (!first && second) out += '▀';
        else if (first && !second) out += '▄';
        else if (first && second) out += ' ';
      }
      out += String.fromCharCode(chCodes.newline);
    }
    return out;
  }
  toTerm(): string {
    const cc = String.fromCharCode(chCodes.reset);
    const reset = cc + '[0m';
    const whiteBG = cc + '[1;47m  ' + reset;
    const darkBG = cc + `[40m  ` + reset;
    return this.data
      .map((i) => i.map((j) => (j ? darkBG : whiteBG)).join(''))
      .join(String.fromCharCode(chCodes.newline));
  }
  toSVG(patternMap?: (number | undefined)[][]): string {
    const renderer = patternRenderer;
    let out = `<svg xmlns:svg="http://www.w3.org/2000/svg" viewBox="0 0 ${this.width} ${this.height}" version="1.1" xmlns="http://www.w3.org/2000/svg">`;
    out += `<rect x="0" y="0" width="${this.width}" height="${this.height}" fill="white" />`;
    this.rectRead(0, Infinity, ({ x, y }: Point, val: DrawValue) => {
      // Added types
      const patternIndex = patternMap?.[y]?.[x];
      if (patternIndex !== undefined) {
        out += renderer.getPatternSvgString(patternIndex, x, y);
      } else if (val === true) {
        out += `<rect x="${x}" y="${y}" width="1" height="1" fill="black" />`;
      }
    });
    out += '</svg>';
    return out;
  }
  toGIF(patternMap?: (number | undefined)[][], modulePixelSize: number = 1): Uint8Array {
    const renderer = patternRenderer;
    if (!Number.isSafeInteger(modulePixelSize) || modulePixelSize <= 0) {
      throw new Error(`Invalid modulePixelSize for GIF: ${modulePixelSize}`);
    }
    const outputWidth = this.width * modulePixelSize;
    const outputHeight = this.height * modulePixelSize;
    const pixelBuffer = new Uint8Array(outputWidth * outputHeight).fill(1);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const patternIndex = patternMap?.[y]?.[x];
        const moduleValue = this.data[y][x];
        const startX = x * modulePixelSize;
        const startY = y * modulePixelSize;
        if (patternIndex !== undefined) {
          renderer.drawPatternPixels(
            patternIndex,
            pixelBuffer,
            outputWidth,
            startX,
            startY,
            modulePixelSize
          );
        } else if (moduleValue === true) {
          const ctx = {
            buffer: pixelBuffer,
            bufferWidth: outputWidth,
            moduleStartX: startX,
            moduleStartY: startY,
            modulePixelSize: modulePixelSize,
          };
          const fillRectLocal = (
            lctx: any,
            lx: number,
            ly: number,
            lw: number,
            lh: number,
            lcolor: 0 | 1
          ) => {
            const endX = lx + lw;
            const endY = ly + lh;
            for (let py = ly; py < endY; py++) {
              for (let px = lx; px < endX; px++) {
                if (px >= 0 && px < lctx.modulePixelSize && py >= 0 && py < lctx.modulePixelSize) {
                  const bufX = lctx.moduleStartX + px;
                  const bufY = lctx.moduleStartY + py;
                  lctx.buffer[bufY * lctx.bufferWidth + bufX] = lcolor;
                }
              }
            }
          };
          fillRectLocal(ctx, 0, 0, modulePixelSize, modulePixelSize, 0);
        }
      }
    }
    const u16le = (i: number) => [i & 0xff, (i >>> 8) & 0xff];
    const dims = [...u16le(outputWidth), ...u16le(outputHeight)];
    const gifData: number[] = [];
    for (let i = 0; i < pixelBuffer.length; i++) {
      gifData.push(pixelBuffer[i] === 1 ? 0 : 1);
    }
    const N = 126;
    const bytes = [
      0x47,
      0x49,
      0x46,
      0x38,
      0x37,
      0x61,
      ...dims,
      0x81,
      0x00,
      0x00,
      0xff,
      0xff,
      0xff,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x2c,
      0x00,
      0x00,
      0x00,
      0x00,
      ...dims,
      0x00,
      0x07,
    ];
    const fullChunks = Math.floor(gifData.length / N);
    for (let i = 0; i < fullChunks; i++)
      bytes.push(N + 1, 0x80, ...gifData.slice(N * i, N * (i + 1)));
    bytes.push((gifData.length % N) + 1, 0x80, ...gifData.slice(fullChunks * N));
    bytes.push(0x01, 0x81, 0x00, 0x3b);
    return new Uint8Array(bytes);
  }
  toImage(isRGB = false): Image {
    const { height, width } = this.size();
    const data = new Uint8Array(height * width * (isRGB ? 3 : 4));
    let i = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const value = !!this.data[y][x] ? 0 : 255;
        data[i++] = value;
        data[i++] = value;
        data[i++] = value;
        if (!isRGB) data[i++] = 255;
      }
    }
    return { height, width, data };
  }
}

// --- Galois Field & Reed-Solomon (GF, RS) ---
type GFTables = { exp: number[]; log: number[] };
export type GFType = {
  tables: GFTables;
  exp: (x: number) => number;
  log: (x: number) => number;
  mul: (x: number, y: number) => number;
  add: (x: number, y: number) => number;
  pow: (x: number, e: number) => number;
  inv: (x: number) => number;
  polynomial: (poly: number[]) => number[];
  monomial: (degree: number, coefficient: number) => number[];
  degree: (a: number[]) => number;
  coefficient: (a: number[], degree: number) => number;
  mulPoly: (a: number[], b: number[]) => number[];
  mulPolyScalar: (a: number[], scalar: number) => number[];
  mulPolyMonomial: (a: number[], degree: number, coefficient: number) => number[];
  addPoly: (a: number[], b: number[]) => number[];
  remainderPoly: (data: number[], divisor: number[]) => number[];
  divisorPoly: (degree: number) => number[];
  evalPoly: (poly: number[], a: number) => number;
  euclidian: (a: number[], b: number[], R: number) => [number[], number[]];
};

export const GF: GFType = {
  tables: ((p_poly): GFTables => {
    const exp = fillArr(256, 0);
    const log = fillArr(256, 0);
    for (let i = 0, x = 1; i < 256; i++) {
      exp[i] = x;
      log[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= p_poly;
    }
    return { exp, log };
  })(0x11d),
  exp: (x: number): number => GF.tables.exp[x],
  log(x: number): number {
    if (x === 0) throw new Error(`GF.log: invalid arg=${x}`);
    return GF.tables.log[x] % 255;
  },
  mul(x: number, y: number): number {
    if (x === 0 || y === 0) return 0;
    return GF.tables.exp[(GF.tables.log[x] + GF.tables.log[y]) % 255];
  },
  add: (x: number, y: number): number => x ^ y,
  pow: (x: number, e: number): number => GF.tables.exp[(GF.tables.log[x] * e) % 255],
  inv(x: number): number {
    if (x === 0) throw new Error(`GF.inverse: invalid arg=${x}`);
    return GF.tables.exp[255 - GF.tables.log[x]];
  },
  polynomial(poly: number[]): number[] {
    if (poly.length == 0) throw new Error('GF.polymomial: invalid length');
    if (poly[0] !== 0) return poly;
    let i = 0;
    for (; i < poly.length - 1 && poly[i] == 0; i++);
    return poly.slice(i);
  },
  monomial(degree: number, coefficient: number): number[] {
    if (degree < 0) throw new Error(`GF.monomial: invalid degree=${degree}`);
    if (coefficient == 0) return [0];
    let coefficients = fillArr(degree + 1, 0);
    coefficients[0] = coefficient;
    return GF.polynomial(coefficients);
  },
  degree: (a: number[]): number => a.length - 1,
  coefficient: (a: number[], degree: number): number => a[GF.degree(a) - degree],
  mulPoly(a: number[], b: number[]): number[] {
    if (a[0] === 0 || b[0] === 0) return [0];
    const res = fillArr(a.length + b.length - 1, 0);
    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < b.length; j++) {
        res[i + j] = GF.add(res[i + j], GF.mul(a[i], b[j]));
      }
    }
    return GF.polynomial(res);
  },
  mulPolyScalar(a: number[], scalar: number): number[] {
    if (scalar == 0) return [0];
    if (scalar == 1) return a;
    const res = fillArr(a.length, 0);
    for (let i = 0; i < a.length; i++) res[i] = GF.mul(a[i], scalar);
    return GF.polynomial(res);
  },
  mulPolyMonomial(a: number[], degree: number, coefficient: number): number[] {
    if (degree < 0) throw new Error('GF.mulPolyMonomial: invalid degree');
    if (coefficient == 0) return [0];
    const res = fillArr(a.length + degree, 0);
    for (let i = 0; i < a.length; i++) res[i] = GF.mul(a[i], coefficient);
    return GF.polynomial(res);
  },
  addPoly(a: number[], b: number[]): number[] {
    if (a[0] === 0) return b;
    if (b[0] === 0) return a;
    let smaller = a;
    let larger = b;
    if (smaller.length > larger.length) [smaller, larger] = [larger, smaller];
    let sumDiff = fillArr(larger.length, 0);
    let lengthDiff = larger.length - smaller.length;
    let s = larger.slice(0, lengthDiff);
    for (let i = 0; i < s.length; i++) sumDiff[i] = s[i];
    for (let i = lengthDiff; i < larger.length; i++)
      sumDiff[i] = GF.add(smaller[i - lengthDiff], larger[i]);
    return GF.polynomial(sumDiff);
  },
  remainderPoly(data: number[], divisor: number[]): number[] {
    const out = Array.from(data);
    for (let i = 0; i < data.length - divisor.length + 1; i++) {
      const elm = out[i];
      if (elm === 0) continue;
      for (let j = 1; j < divisor.length; j++) {
        if (divisor[j] !== 0) out[i + j] = GF.add(out[i + j], GF.mul(divisor[j], elm));
      }
    }
    return out.slice(data.length - divisor.length + 1, out.length);
  },
  divisorPoly(degree: number): number[] {
    let g = [1];
    for (let i = 0; i < degree; i++) g = GF.mulPoly(g, [1, GF.pow(2, i)]);
    return g;
  },
  evalPoly(poly: number[], a: number): number {
    if (a == 0) return GF.coefficient(poly, 0);
    let res = poly[0];
    for (let i = 1; i < poly.length; i++) res = GF.add(GF.mul(a, res), poly[i]);
    return res;
  },
  euclidian(a: number[], b: number[], R: number): [number[], number[]] {
    if (GF.degree(a) < GF.degree(b)) [a, b] = [b, a];
    let rLast = a;
    let r = b;
    let tLast = [0];
    let t = [1];
    while (2 * GF.degree(r) >= R) {
      let rLastLast = rLast;
      let tLastLast = tLast;
      rLast = r;
      tLast = t;
      if (rLast[0] === 0) throw new Error('rLast[0] === 0');
      r = rLastLast;
      let q = [0];
      const dltInverse = GF.inv(rLast[0]);
      while (GF.degree(r) >= GF.degree(rLast) && r[0] !== 0) {
        const degreeDiff = GF.degree(r) - GF.degree(rLast);
        const scale = GF.mul(r[0], dltInverse);
        q = GF.addPoly(q, GF.monomial(degreeDiff, scale));
        r = GF.addPoly(r, GF.mulPolyMonomial(rLast, degreeDiff, scale));
      }
      q = GF.mulPoly(q, tLast);
      t = GF.addPoly(q, tLastLast);
      if (GF.degree(r) >= GF.degree(rLast))
        throw new Error(`Division failed r: ${r}, rLast: ${rLast}`);
    }
    const sigmaTildeAtZero = GF.coefficient(t, 0);
    if (sigmaTildeAtZero == 0) throw new Error('sigmaTilde(0) was zero');
    const inverse = GF.inv(sigmaTildeAtZero);
    const result: [number[], number[]] = [
      GF.mulPolyScalar(t, inverse),
      GF.mulPolyScalar(r, inverse),
    ];
    return result;
  },
};

export function RS(eccWords: number): Coder<Uint8Array, Uint8Array> {
  return {
    encode(from: Uint8Array): Uint8Array {
      const d = GF.divisorPoly(eccWords);
      const pol = Array.from(from);
      pol.push(...d.slice(0, -1).fill(0));
      return Uint8Array.from(GF.remainderPoly(pol, d));
    },
    decode(to: Uint8Array): Uint8Array {
      const res = to.slice();
      const poly = GF.polynomial(Array.from(to));
      let syndrome = fillArr(eccWords, 0);
      let hasError = false;
      for (let i = 0; i < eccWords; i++) {
        const evl = GF.evalPoly(poly, GF.exp(i));
        syndrome[syndrome.length - 1 - i] = evl;
        if (evl !== 0) hasError = true;
      }
      if (!hasError) return res;
      syndrome = GF.polynomial(syndrome);
      const monomial = GF.monomial(eccWords, 1);
      const [errorLocator, errorEvaluator] = GF.euclidian(monomial, syndrome, eccWords);
      const locations = fillArr(GF.degree(errorLocator), 0);
      let e = 0;
      for (let i = 1; i < 256 && e < locations.length; i++) {
        if (GF.evalPoly(errorLocator, i) === 0) locations[e++] = GF.inv(i);
      }
      if (e !== locations.length) throw new Error('RS.decode: invalid errors number');
      for (let i = 0; i < locations.length; i++) {
        const pos = res.length - 1 - GF.log(locations[i]);
        if (pos < 0) throw new Error('RS.decode: invalid error location');
        const xiInverse = GF.inv(locations[i]);
        let denominator = 1;
        for (let j = 0; j < locations.length; j++) {
          if (i === j) continue;
          denominator = GF.mul(denominator, GF.add(1, GF.mul(locations[j], xiInverse)));
        }
        res[pos] = GF.add(
          res[pos],
          GF.mul(GF.evalPoly(errorEvaluator, xiInverse), GF.inv(denominator))
        );
      }
      return res;
    },
  };
}

// --- Info Object ---
// Define the type for the info object structure first
type InfoType = {
  size: Coder<Version, number>;
  sizeType: (ver: Version) => number;
  alignmentPatterns: (ver: Version) => number[];
  ECCode: Record<ErrorCorrection, number>;
  formatMask: number;
  formatBits: (ecc: ErrorCorrection, maskIdx: Mask) => number;
  versionBits: (ver: Version) => number;
  alphabet: {
    numeric: Coder<number[], string[]> & { has: (char: string) => boolean };
    alphanumeric: Coder<number[], string[]> & { has: (char: string) => boolean };
  };
  lengthBits: (ver: Version, type: EncodingType) => number;
  modeBits: Record<Exclude<EncodingType, 'kanji' | 'eci'> | 'kanji' | 'eci', string>;
  capacity: (
    ver: Version,
    ecc: ErrorCorrection
  ) => {
    words: number;
    numBlocks: number;
    shortBlocks: number;
    blockLen: number;
    capacity: number;
    total: number;
  };
};

// Now define the info object with the explicit type
export const info: InfoType = {
  size: {
    encode: (ver: Version): number => 21 + 4 * (ver - 1),
    decode: (size: number): number => (size - 17) / 4,
  } as Coder<Version, number>,
  sizeType: (ver: Version): number => Math.floor((ver + 7) / 17),
  alignmentPatterns(ver: Version): number[] {
    if (ver === 1) return [];
    const first = 6;
    const encodedSize = info.size.encode(ver); // Use info.size.encode here
    const last = encodedSize - first - 1;
    const distance = last - first;
    const count = Math.ceil(distance / 28);
    let interval = Math.floor(distance / count);
    if (interval % 2) interval += 1;
    else if ((distance % count) * 2 >= count) interval += 2;
    const res = [first];
    for (let m = 1; m < count; m++) res.push(last - (count - m) * interval);
    res.push(last);
    return res;
  },
  ECCode: {
    low: 0b01,
    medium: 0b00,
    quartile: 0b11,
    high: 0b10,
  } as Record<ErrorCorrection, number>,
  formatMask: 0b101010000010010,
  formatBits(ecc: ErrorCorrection, maskIdx: Mask): number {
    const data = (info.ECCode[ecc] << 3) | maskIdx;
    let d = data;
    for (let i = 0; i < 10; i++) d = (d << 1) ^ ((d >> 9) * 0b10100110111);
    return ((data << 10) | d) ^ info.formatMask;
  },
  versionBits(ver: Version): number {
    let d = ver;
    for (let i = 0; i < 12; i++) d = (d << 1) ^ ((d >> 11) * 0b1111100100101);
    return (ver << 12) | d;
  },
  alphabet: {
    numeric: alphabet('0123456789'),
    alphanumeric: alphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:'),
  },
  lengthBits(ver: Version, type: EncodingType): number {
    const table: Record<EncodingType, [number, number, number]> = {
      numeric: [10, 12, 14],
      alphanumeric: [9, 11, 13],
      byte: [8, 16, 16],
      kanji: [8, 10, 12],
      eci: [0, 0, 0],
    };
    return table[type][info.sizeType(ver)];
  },
  modeBits: {
    numeric: '0001',
    alphanumeric: '0010',
    byte: '0100',
    kanji: '1000',
    eci: '0111',
  },
  capacity(
    ver: Version,
    ecc: ErrorCorrection
  ): {
    words: number;
    numBlocks: number;
    shortBlocks: number;
    blockLen: number;
    capacity: number;
    total: number;
  } {
    const bytes = BYTES[ver - 1];
    const words = WORDS_PER_BLOCK[ecc][ver - 1];
    const numBlocks = ECC_BLOCKS[ecc][ver - 1];
    const blockLen = Math.floor(bytes / numBlocks) - words;
    const shortBlocks = numBlocks - (bytes % numBlocks);
    return {
      words,
      numBlocks,
      shortBlocks,
      blockLen,
      capacity: (bytes - words * numBlocks) * 8,
      total: (words + blockLen) * numBlocks + numBlocks - shortBlocks,
    };
  },
};

// --- Core Functions (Continued) ---
export function interleave(ver: Version, ecc: ErrorCorrection): Coder<Uint8Array, Uint8Array> {
  const { words, shortBlocks, numBlocks, blockLen, total } = info.capacity(ver, ecc);
  const rs = RS(words);
  return {
    encode(bytes: Uint8Array): Uint8Array {
      const blocks: Uint8Array[] = [];
      const eccBlocks: Uint8Array[] = [];
      let currentPos = 0;
      for (let i = 0; i < numBlocks; i++) {
        const isShort = i < shortBlocks;
        const len = blockLen + (isShort ? 0 : 1);
        const blockData = bytes.subarray(currentPos, currentPos + len);
        blocks.push(blockData);
        eccBlocks.push(rs.encode(blockData));
        currentPos += len;
      }
      if (currentPos !== bytes.length) {
        console.error('Warning: Data length mismatch after block processing.');
      }
      const resBlocks = interleaveBytes(...blocks);
      const resECC = interleaveBytes(...eccBlocks);
      const res = new Uint8Array(total);
      if (resBlocks.length + resECC.length !== total) {
        console.error(
          `Warning: Interleaved length mismatch. Data: ${resBlocks.length}, ECC: ${resECC.length}, Expected Total: ${total}`
        );
      }
      res.set(resBlocks);
      res.set(resECC, resBlocks.length);
      return res;
    },
    decode(data: Uint8Array): Uint8Array {
      if (data.length !== total)
        throw new Error(`interleave.decode: len(data)=${data.length}, total=${total}`);
      const blocks: Uint8Array[] = [];
      for (let i = 0; i < numBlocks; i++) {
        const isShort = i < shortBlocks;
        blocks.push(new Uint8Array(words + blockLen + (isShort ? 0 : 1)));
      }
      let pos = 0;
      for (let i = 0; i < blockLen; i++) {
        for (let j = 0; j < numBlocks; j++) blocks[j][i] = data[pos++];
      }
      for (let j = shortBlocks; j < numBlocks; j++) blocks[j][blockLen] = data[pos++];
      for (let i = 0; i < words; i++) {
        for (let j = 0; j < numBlocks; j++) {
          const isShort = j < shortBlocks;
          const eccPos = blockLen + (isShort ? 0 : 1) + i;
          blocks[j][eccPos] = data[pos++];
        }
      }
      if (pos !== total) {
        console.error(
          `Warning: Position mismatch after deinterleaving. Pos: ${pos}, Expected Total: ${total}`
        );
      }
      const res: number[] = [];
      for (const block of blocks) {
        try {
          const decodedBlock = rs.decode(block);
          res.push(
            ...Array.from(
              decodedBlock.slice(0, blockLen + (blocks.indexOf(block) < shortBlocks ? 0 : 1))
            )
          );
        } catch (e) {
          console.error('RS decode failed for a block:', e);
          throw new Error('Reed-Solomon decoding failed, too many errors.');
        }
      }
      return Uint8Array.from(res);
    },
  };
}

export function drawTemplate(
  ver: Version,
  ecc: ErrorCorrection,
  maskIdx: Mask,
  test: boolean = false
): Bitmap {
  const size = info.size.encode(ver);
  let b = new Bitmap(size + 2);
  const finder = new Bitmap(3).rect(0, 3, true).border(1, false).border(1, true).border(1, false);
  b = b
    .embed(0, finder)
    .embed({ x: -finder.width, y: 0 }, finder)
    .embed({ x: 0, y: -finder.height }, finder);
  b = b.rectSlice(1, size);
  const align = new Bitmap(1).rect(0, 1, true).border(1, false).border(1, true);
  const alignPos = info.alignmentPatterns(ver);
  for (const y of alignPos) {
    for (const x of alignPos) {
      if (b.data[y][x] !== undefined) continue;
      b.embed({ x: x - 2, y: y - 2 }, align);
    }
  }
  b = b
    .hLine({ x: 0, y: 6 }, Infinity, ({ x }: Point, cur: DrawValue) =>
      cur === undefined ? x % 2 == 0 : cur
    )
    .vLine({ x: 6, y: 0 }, Infinity, ({ y }: Point, cur: DrawValue) =>
      cur === undefined ? y % 2 == 0 : cur
    );
  {
    const bits = info.formatBits(ecc, maskIdx);
    const getBit = (i: number) => !test && ((bits >> i) & 1) == 1;
    for (let i = 0; i < 6; i++) b.data[i][8] = getBit(i);
    for (let i = 6; i < 8; i++) b.data[i + 1][8] = getBit(i);
    for (let i = 8; i < 15; i++) b.data[size - 15 + i][8] = getBit(i);
    for (let i = 0; i < 8; i++) b.data[8][size - i - 1] = getBit(i);
    for (let i = 8; i < 9; i++) b.data[8][15 - i - 1 + 1] = getBit(i);
    for (let i = 9; i < 15; i++) b.data[8][15 - i - 1] = getBit(i);
    b.data[size - 8][8] = !test;
  }
  if (ver >= 7) {
    const bits = info.versionBits(ver);
    for (let i = 0; i < 18; i += 1) {
      const bit = !test && ((bits >> i) & 1) == 1;
      const x = Math.floor(i / 3);
      const y = (i % 3) + size - 8 - 3;
      b.data[x][y] = bit;
      b.data[y][x] = bit;
    }
  }
  return b;
}

export function zigzag(
  tpl: Bitmap,
  maskIdx: Mask,
  fn: (x: number, y: number, mask: boolean) => void
): void {
  const size = tpl.height;
  const pattern = PATTERNS[maskIdx];
  let dir = -1;
  let y = size - 1;
  for (let xOffset = size - 1; xOffset > 0; xOffset -= 2) {
    if (xOffset == 6) xOffset = 5;
    for (; ; y += dir) {
      for (let j = 0; j < 2; j += 1) {
        const x = xOffset - j;
        if (tpl.data[y][x] !== undefined) continue;
        fn(x, y, pattern(x, y));
      }
      if (y + dir < 0 || y + dir >= size) break;
    }
    dir = -dir;
  }
}

export function penalty(bm: Bitmap): number {
  const inverse = bm.inverse();
  const sameColor = (row: DrawValue[]): number => {
    let res = 0;
    for (let i = 0, same = 1, last: DrawValue = undefined; i < row.length; i++) {
      if (last === row[i]) {
        same++;
        if (i !== row.length - 1) continue;
      }
      if (same >= 5) res += 3 + (same - 5);
      last = row[i];
      same = 1;
    }
    return res;
  };
  let adjacent = 0;
  bm.data.forEach((row: DrawValue[]) => (adjacent += sameColor(row)));
  inverse.data.forEach((column: DrawValue[]) => (adjacent += sameColor(column)));
  let box = 0;
  let b = bm.data;
  const lastW = bm.width - 1;
  const lastH = bm.height - 1;
  for (let y = 0; y < lastH; y++) {
    for (let x = 0; x < lastW; x++) {
      const current = b[y][x];
      if (current === b[y][x + 1] && current === b[y + 1][x] && current === b[y + 1][x + 1]) {
        box += 3;
      }
    }
  }
  const finderPatternFn = (row: DrawValue[]): number => {
    const finderPattern = [true, false, true, true, true, false, true];
    const lightPattern = [false, false, false, false];
    const p1 = [...finderPattern, ...lightPattern];
    const p2 = [...lightPattern, ...finderPattern];
    let res = 0;
    for (let i = 0; i < row.length; i++) {
      if (includesAt(row, p1, i)) res += 40;
      if (includesAt(row, p2, i)) res += 40;
    }
    return res;
  };
  let finder = 0;
  for (const row of bm.data) finder += finderPatternFn(row);
  for (const column of inverse.data) finder += finderPatternFn(column);
  let darkPixels = 0;
  bm.rectRead(0, Infinity, (_c: Point, val: DrawValue) => (darkPixels += val ? 1 : 0));
  const darkPercent = (darkPixels / (bm.height * bm.width)) * 100;
  const dark = 10 * Math.floor(Math.abs(darkPercent - 50) / 5);
  return adjacent + box + finder + dark;
}

// --- Validation Functions Export ---
export function validateECC(ec: ErrorCorrection): void {
  if (!ECMode.includes(ec))
    throw new Error(`Invalid error correction mode=${ec}. Expected: ${ECMode}`);
}
export function validateEncoding(enc: EncodingType): void {
  if (!Encoding.includes(enc))
    throw new Error(`Encoding: invalid mode=${enc}. Expected: ${Encoding}`);
  if (enc === 'kanji' || enc === 'eci')
    throw new Error(`Encoding: ${enc} is not supported (yet?).`);
}
export function validateMask(mask: Mask): void {
  if (!Number.isInteger(mask) || mask < 0 || mask > 7)
    throw new Error(`Invalid mask=${mask}. Expected number [0..7]`);
  if (!PATTERNS[mask])
    throw new Error(`Invalid mask index=${mask}. PATTERNS array does not have this index.`);
}

// --- Utils Object Export ---
// Define the type for the utils object explicitly to help with --isolatedDeclarations
export type UtilsType = {
  best: typeof best;
  bin: typeof bin;
  drawTemplate: typeof drawTemplate;
  fillArr: typeof fillArr;
  info: InfoType;
  interleave: typeof interleave;
  validateVersion: typeof validateVersion;
  zigzag: typeof zigzag;
  // penalty?: typeof penalty; // Optional if not always needed externally
};

// Utils Object Export (Assign properties explicitly)
export const utils: UtilsType = {
  best: best,
  bin: bin,
  drawTemplate: drawTemplate,
  fillArr: fillArr,
  info: info,
  interleave: interleave,
  validateVersion: validateVersion,
  zigzag: zigzag,
  // penalty: penalty, // Uncomment if needed
};

// --- Internal Exports (for testing) ---
// Define the type for the _internal object explicitly
export type InternalType = {
  GF: GFType;
  RS: typeof RS;
  PATTERNS: typeof PATTERNS;
  penalty: typeof penalty;
};

// Other exports if needed, e.g., for tests (Assign properties explicitly)
export const _internal: InternalType = {
  GF: GF,
  RS: RS,
  PATTERNS: PATTERNS,
  penalty: penalty,
};
