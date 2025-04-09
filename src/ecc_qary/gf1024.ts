// Galois Field GF(2^10) = GF(1024) implementation
// Using primitive polynomial: x^10 + x^3 + 1 (0x409)

const FIELD_SIZE = 1024;
const PRIMITIVE_POLYNOMIAL = 0x409; // x^10 + x^3 + 1

let expTable: Uint16Array;
let logTable: Uint16Array;

function initializeTables() {
  if (expTable && logTable) return; // Already initialized

  expTable = new Uint16Array(FIELD_SIZE);
  logTable = new Uint16Array(FIELD_SIZE);
  let x = 1;
  for (let i = 0; i < FIELD_SIZE - 1; i++) {
    expTable[i] = x;
    logTable[x] = i;
    x <<= 1;
    if (x >= FIELD_SIZE) {
      x ^= PRIMITIVE_POLYNOMIAL;
      x &= FIELD_SIZE - 1; // Ensure it stays within field bounds
    }
  }
  // logTable[0] is undefined (log of 0 is infinity), often represented as -1 or similar
  // For simplicity in calculations, we might avoid log(0) directly.
  // expTable[FIELD_SIZE - 1] = expTable[0] (which is 1)
  expTable[FIELD_SIZE - 1] = 1;
}

initializeTables();

/**
 * Adds two numbers in GF(1024). (Equivalent to XOR)
 */
export function add(a: number, b: number): number {
  return a ^ b;
}

/**
 * Multiplies two numbers in GF(1024).
 */
export function multiply(a: number, b: number): number {
  if (a === 0 || b === 0) {
    return 0;
  }
  const logA = logTable[a];
  const logB = logTable[b];
  const logResult = (logA + logB) % (FIELD_SIZE - 1);
  return expTable[logResult];
}

/**
 * Calculates the power of a number in GF(1024).
 */
export function power(a: number, exponent: number): number {
  if (exponent === 0) return 1;
  if (a === 0) return 0;
  const logA = logTable[a];
  const logResult = (logA * exponent) % (FIELD_SIZE - 1);
  // Handle negative results from modulo if exponent is negative
  const finalLog = logResult < 0 ? logResult + (FIELD_SIZE - 1) : logResult;
  return expTable[finalLog];
}

/**
 * Calculates the multiplicative inverse of a number in GF(1024).
 */
export function inverse(a: number): number {
  if (a === 0) {
    throw new Error('Cannot compute inverse of 0');
  }
  const logA = logTable[a];
  const logInverse = (FIELD_SIZE - 1 - logA) % (FIELD_SIZE - 1);
  return expTable[logInverse];
}

// --- Polynomial Operations ---

/**
 * Represents a polynomial with coefficients in GF(1024).
 * Index 0 is the highest degree term. e.g., [1, 2, 3] is x^2 + 2x + 3
 */
// export type Polynomial = Uint16Array; // Removed type alias

/**
 * Removes leading zero coefficients from a polynomial.
 */
// Explicitly type the return value to help with type inference downstream
function trimLeadingZeros(poly: Uint16Array): Uint16Array<ArrayBuffer> {
  let firstNonZero = 0;
  while (firstNonZero < poly.length && poly[firstNonZero] === 0) {
    firstNonZero++;
  }
  // Ensure ALL return paths explicitly create a new Uint16Array backed by ArrayBuffer
  if (firstNonZero === 0) return new Uint16Array(poly);
  if (firstNonZero === poly.length) return new Uint16Array([0]); // All zeros
  return new Uint16Array(poly.slice(firstNonZero));
}

/**
 * Adds two polynomials in GF(1024).
 */
export function polyAdd(a: Uint16Array, b: Uint16Array): Uint16Array<ArrayBuffer> {
  const degreeA = a.length - 1;
  const degreeB = b.length - 1;
  const resultDegree = Math.max(degreeA, degreeB);
  const result = new Uint16Array(resultDegree + 1);

  for (let i = 0; i <= resultDegree; i++) {
    const termA = i <= degreeA ? a[degreeA - i] : 0; // Coefficient of x^i in a
    const termB = i <= degreeB ? b[degreeB - i] : 0; // Coefficient of x^i in b
    result[resultDegree - i] = add(termA, termB);
  }
  return trimLeadingZeros(result);
}

/**
 * Multiplies two polynomials in GF(1024).
 */
export function polyMultiply(a: Uint16Array, b: Uint16Array): Uint16Array<ArrayBuffer> {
  if ((a.length === 1 && a[0] === 0) || (b.length === 1 && b[0] === 0)) {
    return new Uint16Array([0]);
  }
  const degreeA = a.length - 1;
  const degreeB = b.length - 1;
  const resultDegree = degreeA + degreeB;
  const result = new Uint16Array(resultDegree + 1).fill(0);

  for (let i = 0; i <= degreeA; i++) {
    for (let j = 0; j <= degreeB; j++) {
      const coeffA = a[i];
      const coeffB = b[j];
      const termProduct = multiply(coeffA, coeffB);
      const termDegree = degreeA - i + (degreeB - j);
      const resultIndex = resultDegree - termDegree;
      result[resultIndex] = add(result[resultIndex], termProduct);
    }
  }
  return trimLeadingZeros(result);
}

/**
 * Multiplies a polynomial by a scalar in GF(1024).
 */
export function polyMultiplyScalar(poly: Uint16Array, scalar: number): Uint16Array {
  if (scalar === 0) return new Uint16Array([0]);
  if (scalar === 1) return poly;
  const result = new Uint16Array(poly.length);
  for (let i = 0; i < poly.length; i++) {
    result[i] = multiply(poly[i], scalar);
  }
  // No need to trim zeros here as scalar multiplication doesn't change degree unless scalar is 0
  return result;
}

/**
 * Divides polynomial 'dividend' by 'divisor' in GF(1024).
 * Returns { quotient, remainder }.
 */
export function polyDivide(
  dividend: Uint16Array,
  divisor: Uint16Array
): { quotient: Uint16Array; remainder: Uint16Array } {
  if (divisor.length === 1 && divisor[0] === 0) {
    throw new Error('Division by zero polynomial');
  }

  // Explicitly type currentDividend
  let currentDividend: Uint16Array<ArrayBuffer> = new Uint16Array(dividend); // Make a copy
  const divisorDegree = divisor.length - 1;
  const dividendDegree = currentDividend.length - 1;

  if (dividendDegree < divisorDegree) {
    // Ensure remainder is explicitly ArrayBuffer-backed
    return { quotient: new Uint16Array([0]), remainder: new Uint16Array(currentDividend) };
  }

  const quotientDegree = dividendDegree - divisorDegree;
  const quotient = new Uint16Array(quotientDegree + 1).fill(0);
  const leadDivisorTerm = divisor[0];
  const invLeadDivisor = inverse(leadDivisorTerm);

  for (let i = 0; i <= quotientDegree; i++) {
    // Check the lead term *before* potentially slicing and reassigning
    if (currentDividend[0] === 0) {
      // quotient term is 0, shift dividend by creating a new Uint16Array from the slice
      const slicedDividend = currentDividend.slice(1);
      currentDividend = trimLeadingZeros(new Uint16Array(slicedDividend));
      if (currentDividend.length === 1 && currentDividend[0] === 0) break; // Dividend is zero
      continue;
    }
    const leadDividendTerm = currentDividend[0]; // Now get the lead term

    const currentQuotientTerm = multiply(leadDividendTerm, invLeadDivisor);
    quotient[i] = currentQuotientTerm;

    // Subtract (polyMultiplyScalar(divisor, currentQuotientTerm) shifted) from dividend
    const termToSubtract = polyMultiplyScalar(divisor, currentQuotientTerm);
    const subtractDegree = termToSubtract.length - 1;

    // Align degrees for subtraction (polyAdd handles different lengths)
    const alignedDividend = new Uint16Array(currentDividend.length);
    // Use subtractDegree here: termToSubtract.length = subtractDegree + 1
    const shift = currentDividend.length - (subtractDegree + 1);

    for (let k = 0; k < termToSubtract.length; k++) {
      alignedDividend[k + shift] = termToSubtract[k];
    }

    currentDividend = polyAdd(currentDividend, alignedDividend); // Add is XOR, so it's subtraction
    currentDividend = trimLeadingZeros(currentDividend); // Trim leading zeros after subtraction

    // Optimization: if remainder degree is less than divisor degree, we are done
    if (currentDividend.length - 1 < divisorDegree) {
      break;
    }
  }

  // Ensure remainder is explicitly ArrayBuffer-backed
  return { quotient: trimLeadingZeros(quotient), remainder: new Uint16Array(currentDividend) };
}

/**
 * Evaluates a polynomial at a point x in GF(1024) using Horner's method.
 */
export function polyEval(poly: Uint16Array, x: number): number {
  if (x === 0) {
    // Return the constant term (coefficient of x^0)
    return poly[poly.length - 1];
  }
  let result = poly[0];
  for (let i = 1; i < poly.length; i++) {
    result = add(multiply(result, x), poly[i]);
  }
  return result;
}

/**
 * Builds a generator polynomial for Reed-Solomon code with 'numEccSymbols'
 * error correction symbols in GF(1024).
 * Generator is (x - alpha^0)(x - alpha^1)...(x - alpha^(numEccSymbols-1))
 * where alpha is 2 (a primitive element in GF(1024) generated by x^10+x^3+1).
 */
export function buildGeneratorPoly(numEccSymbols: number): Uint16Array<ArrayBuffer> {
  if (numEccSymbols <= 0) {
    throw new Error('Number of ECC symbols must be positive');
  }
  // alpha = 2 is primitive element for x^10+x^3+1
  const alpha = 2;
  // Explicitly type generator
  let generator: Uint16Array<ArrayBuffer> = new Uint16Array([1]); // Starts with 1

  for (let i = 0; i < numEccSymbols; i++) {
    const root = power(alpha, i);
    // Multiply generator by (x - root) which is (x + root) in GF(2^k)
    // Polynomial for (x + root) is [1, root]
    generator = polyMultiply(generator, new Uint16Array([1, root]));
  }
  return generator;
}
