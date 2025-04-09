/**
 * General utility functions extracted from index.ts
 */

/*! scure-base - MIT License (c) 2022 Paul Miller (paulmillr.com) */

export interface Coder<F, T> {
  encode(from: F): T;
  decode(to: T): F;
}

export interface BytesCoder extends Coder<Uint8Array, string> {
  encode: (data: Uint8Array) => string;
  decode: (str: string) => Uint8Array;
}

function isBytes(a: unknown): a is Uint8Array {
  return a instanceof Uint8Array || (ArrayBuffer.isView(a) && a.constructor.name === 'Uint8Array');
}
/** Asserts something is Uint8Array. */
export function abytes(b: Uint8Array | undefined, ...lengths: number[]): void {
  if (!isBytes(b)) throw new Error('Uint8Array expected');
  if (lengths.length > 0 && !lengths.includes(b.length))
    throw new Error('Uint8Array expected of length ' + lengths + ', got length=' + b.length);
}

function isArrayOf(isString: boolean, arr: any[]) {
  if (!Array.isArray(arr)) return false;
  if (arr.length === 0) return true;
  if (isString) {
    return arr.every((item) => typeof item === 'string');
  } else {
    return arr.every((item) => Number.isSafeInteger(item));
  }
}

// no abytes: seems to have 10% slowdown. Why?!

function afn(input: Function): input is Function {
  if (typeof input !== 'function') throw new Error('function expected');
  return true;
}

function astr(label: string, input: unknown): input is string {
  if (typeof input !== 'string') throw new Error(`${label}: string expected`);
  return true;
}

export function anumber(n: number): void {
  if (!Number.isSafeInteger(n)) throw new Error(`invalid integer: ${n}`);
}

function aArr(input: any[]) {
  if (!Array.isArray(input)) throw new Error('array expected');
}
function astrArr(label: string, input: string[]) {
  if (!isArrayOf(true, input)) throw new Error(`${label}: array of strings expected`);
}
function anumArr(label: string, input: number[]) {
  if (!isArrayOf(false, input)) throw new Error(`${label}: array of numbers expected`);
}

// TODO: some recusive type inference so it would check correct order of input/output inside rest?
// like <string, number>, <number, bytes>, <bytes, float>
type Chain = [Coder<any, any>, ...Coder<any, any>[]];
// Extract info from Coder type
type Input<F> = F extends Coder<infer T, any> ? T : never;
type Output<F> = F extends Coder<any, infer T> ? T : never;
// Generic function for arrays
type First<T> = T extends [infer U, ...any[]] ? U : never;
type Last<T> = T extends [...any[], infer U] ? U : never;
type Tail<T> = T extends [any, ...infer U] ? U : never;

type AsChain<C extends Chain, Rest = Tail<C>> = {
  // C[K] = Coder<Input<C[K]>, Input<Rest[k]>>
  [K in keyof C]: Coder<Input<C[K]>, Input<K extends keyof Rest ? Rest[K] : any>>;
};

/**
 * @__NO_SIDE_EFFECTS__
 */
function chain<T extends Chain & AsChain<T>>(...args: T): Coder<Input<First<T>>, Output<Last<T>>> {
  const id = (a: any) => a;
  // Wrap call in closure so JIT can inline calls
  const wrap = (a: any, b: any) => (c: any) => a(b(c));
  // Construct chain of args[-1].encode(args[-2].encode([...]))
  const encode = args.map((x) => x.encode).reduceRight(wrap, id);
  // Construct chain of args[0].decode(args[1].decode(...))
  const decode = args.map((x) => x.decode).reduce(wrap, id);
  return { encode, decode };
}

/**
 * Encodes integer radix representation to array of strings using alphabet and back.
 * Could also be array of strings.
 *
 */
export function alphabet(
  letters: string | string[]
): Coder<number[], string[]> & { has: (char: string) => boolean } {
  // mapping 1 to "b"
  const lettersA = typeof letters === 'string' ? letters.split('') : letters;
  const len = lettersA.length;
  astrArr('alphabet', lettersA);

  // mapping "b" to 1
  const indexes = new Map(lettersA.map((l, i) => [l, i]));
  const has = (char: string): boolean => indexes.has(char); // Add the 'has' method
  return {
    encode: (digits: number[]) => {
      aArr(digits);
      return digits.map((i) => {
        if (!Number.isSafeInteger(i) || i < 0 || i >= len)
          throw new Error(
            `alphabet.encode: digit index outside alphabet "${i}". Allowed: ${letters}`
          );
        return lettersA[i]!;
      });
    },
    decode: (input: string[]): number[] => {
      aArr(input);
      return input.map((letter) => {
        astr('alphabet.decode', letter);
        const i = indexes.get(letter);
        if (i === undefined) throw new Error(`Unknown letter: "${letter}". Allowed: ${letters}`);
        return i;
      });
    },
    has, // Include 'has' in the returned object
  };
}

// Import necessary types/functions if they are used internally by moved functions

// Moved functions with export keyword added

export function assertNumber(n: number): void {
  if (!Number.isSafeInteger(n)) throw new Error(`integer expected: ${n}`);
}

export function mod(a: number, b: number): number {
  const result = a % b;
  return result >= 0 ? result : b + result;
}

export function fillArr<T>(length: number, val: T): T[] {
  return new Array(length).fill(val);
}

/**
 * Interleaves byte blocks.
 * @param blocks [[1, 2, 3], [4, 5, 6]]
 * @returns [1, 4, 2, 5, 3, 6]
 */
export function interleaveBytes(...blocks: Uint8Array[]): Uint8Array {
  let len = 0;
  for (const b of blocks) len = Math.max(len, b.length);
  const res = [];
  for (let i = 0; i < len; i++) {
    for (const b of blocks) {
      if (i >= b.length) continue; // outside of block, skip
      res.push(b[i]);
    }
  }
  return new Uint8Array(res);
}

export function includesAt<T>(lst: T[], pattern: T[], index: number): boolean {
  if (index < 0 || index + pattern.length > lst.length) return false;
  for (let i = 0; i < pattern.length; i++) if (pattern[i] !== lst[index + i]) return false;
  return true;
}

// Optimize for minimal score/penalty
export function best<T>(): {
  add(score: number, value: T): void;
  get: () => T | undefined;
  score: () => number;
} {
  let best: T | undefined;
  let bestScore = Infinity;
  return {
    add(score: number, value: T): void {
      if (score >= bestScore) return;
      best = value;
      bestScore = score;
    },
    get: (): T | undefined => best,
    score: (): number => bestScore,
  };
}

// Global symbols in both browsers and Node.js since v11
// See https://github.com/microsoft/TypeScript/issues/31535
declare const TextEncoder: any;
/**
 * @example utf8ToBytes('abc') // new Uint8Array([97, 98, 99])
 */
export function utf8ToBytes(str: string): Uint8Array {
  if (typeof str !== 'string') throw new Error(`utf8ToBytes expected string, got ${typeof str}`);
  return new Uint8Array(new TextEncoder().encode(str)); // https://bugzil.la/1681809
}
