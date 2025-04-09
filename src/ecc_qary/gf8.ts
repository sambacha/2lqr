/**
 * Galois Field GF(2^3) = GF(8) operations using primitive polynomial x^3 + x + 1 (11 decimal, 0b1011 binary).
 * Symbols are represented by numbers 0-7.
 */

// Precompute log/exp tables for GF(8)
const GF8_EXP: number[] = new Array(8);
const GF8_LOG: number[] = new Array(8);
const GF8_POLY = 0b1011; // x^3 + x + 1

let _x = 1;
for (let i = 0; i < 7; i++) {
  // GF(8) has 7 non-zero elements
  GF8_EXP[i] = _x;
  GF8_LOG[_x] = i;
  _x <<= 1;
  if (_x & 0b1000) {
    // If overflow (>= 8)
    _x ^= GF8_POLY; // Reduce with primitive polynomial
  }
}
GF8_EXP[7] = 1; // exp[7] wraps around to exp[0]
GF8_LOG[0] = -1; // Log of 0 is undefined

/** GF(8) Addition (XOR) */
export function gf8Add(x: number, y: number): number {
  return x ^ y;
}

/** GF(8) Multiplication */
export function gf8Mul(x: number, y: number): number {
  if (x === 0 || y === 0) {
    return 0;
  }
  if (x === 1) return y;
  if (y === 1) return x;
  const logX = GF8_LOG[x];
  const logY = GF8_LOG[y];
  if (logX === -1 || logY === -1) throw new Error(`gf8Mul: Log undefined for ${x} or ${y}`);
  return GF8_EXP[(logX + logY) % 7]; // Modulo 7 for the 7 non-zero elements cycle
}

/** GF(8) Inverse */
export function gf8Inv(x: number): number {
  if (x === 0) {
    throw new Error('gf8Inv: Cannot invert 0');
  }
  const logX = GF8_LOG[x];
  if (logX === -1) throw new Error(`gf8Inv: Log undefined for ${x}`);
  return GF8_EXP[(7 - logX) % 7];
}

/** GF(8) Power */
export function gf8Pow(x: number, power: number): number {
  if (power === 0) return 1;
  if (x === 0) return 0;
  const logX = GF8_LOG[x];
  if (logX === -1) throw new Error(`gf8Pow: Log undefined for ${x}`);
  // Ensure power is handled correctly (modulo 7 for exponents)
  const effPower = ((power % 7) + 7) % 7; // Handle negative powers correctly
  const logResult = (logX * effPower) % 7;
  return GF8_EXP[logResult];
}

// --- Polynomial Operations over GF(8) ---
// Polynomials are represented as arrays of coefficients (numbers 0-7), highest degree first.
// e.g., [1, 2, 3] represents 1*x^2 + 2*x + 3

/** Remove leading zeros from a polynomial */
function polyStripLeadingZeros(p: number[]): number[] {
  let firstNonZero = 0;
  while (firstNonZero < p.length - 1 && p[firstNonZero] === 0) {
    firstNonZero++;
  }
  return p.slice(firstNonZero);
}

/** Get degree of polynomial */
function polyDegree(p: number[]): number {
  return p.length - 1;
}

/** Evaluate polynomial p(x) at x=a using Horner's method */
function polyEval(p: number[], a: number): number {
  if (a === 0) {
    // The value at x=0 is the constant term (last coefficient)
    return p[polyDegree(p)];
  }
  let result = p[0];
  for (let i = 1; i < p.length; i++) {
    result = gf8Add(gf8Mul(result, a), p[i]);
  }
  return result;
}

/** Multiply two polynomials over GF(8) */
function polyMul(p: number[], q: number[]): number[] {
  const degreeP = polyDegree(p);
  const degreeQ = polyDegree(q);
  const result = new Array(degreeP + degreeQ + 1).fill(0);
  for (let i = 0; i <= degreeP; i++) {
    for (let j = 0; j <= degreeQ; j++) {
      result[i + j] = gf8Add(result[i + j], gf8Mul(p[i], q[j]));
    }
  }
  return polyStripLeadingZeros(result);
}

/** Add two polynomials over GF(8) */
function polyAdd(p: number[], q: number[]): number[] {
  const degreeP = polyDegree(p);
  const degreeQ = polyDegree(q);
  const maxDegree = Math.max(degreeP, degreeQ);
  const result = new Array(maxDegree + 1).fill(0);
  for (let i = 0; i <= maxDegree; i++) {
    // Align coefficients by degree (from lowest degree up)
    const coeffP = i <= degreeP ? p[degreeP - i] : 0;
    const coeffQ = i <= degreeQ ? q[degreeQ - i] : 0;
    result[maxDegree - i] = gf8Add(coeffP, coeffQ);
  }
  return polyStripLeadingZeros(result);
}

/** Multiply polynomial by a scalar */
function polyMulScalar(p: number[], scalar: number): number[] {
  if (scalar === 0) return [0];
  if (scalar === 1) return p;
  const result = p.map((coeff) => gf8Mul(coeff, scalar));
  return polyStripLeadingZeros(result);
}

/** Multiply polynomial by x^degree * scalar */
function polyMulMonomial(p: number[], degree: number, scalar: number): number[] {
  if (scalar === 0) return [0];
  if (degree === 0) return polyMulScalar(p, scalar);
  const result = new Array(p.length + degree).fill(0);
  for (let i = 0; i < p.length; i++) {
    result[i] = gf8Mul(p[i], scalar);
  }
  return polyStripLeadingZeros(result);
}

/** Calculate remainder of polynomial division over GF(8) */
function polyRemainder(dividend: number[], divisor: number[]): number[] {
  let remainder = [...dividend];
  const degreeDividend = polyDegree(dividend);
  const degreeDivisor = polyDegree(divisor);
  const leadDivisor = divisor[0];

  if (degreeDividend < degreeDivisor) return remainder; // No division needed if dividend degree is smaller

  if (leadDivisor === 0) throw new Error("Divisor's leading coefficient cannot be zero.");
  const invLeadDivisor = gf8Inv(leadDivisor);

  for (let i = 0; i <= degreeDividend - degreeDivisor; i++) {
    const leadRemainder = remainder[i];
    if (leadRemainder !== 0) {
      const term = gf8Mul(leadRemainder, invLeadDivisor);
      for (let j = 0; j <= degreeDivisor; j++) {
        // Subtract term * divisor[j] * x^(degreeDividend - i - j)
        // Subtraction is XOR (gf8Add)
        if (divisor[j] !== 0) {
          remainder[i + j] = gf8Add(remainder[i + j], gf8Mul(term, divisor[j]));
        }
      }
    }
  }
  // The remainder starts after the part that was reduced
  const remainderStartIndex = degreeDividend - degreeDivisor + 1;
  return polyStripLeadingZeros(remainder.slice(remainderStartIndex));
}

/** Generate the generator polynomial for RS codes over GF(8) */
function rsGeneratorPoly(nsym: number): number[] {
  if (nsym <= 0) throw new Error('Number of ECC symbols must be positive.');
  let g = [1]; // g(x) = 1 initially
  for (let i = 0; i < nsym; i++) {
    // g(x) = g(x) * (x - alpha^i) = g(x) * (x + alpha^i) since + and - are XOR in GF(8)
    g = polyMul(g, [1, gf8Pow(2, i)]); // alpha = 2 is a generator for GF(8) with poly x^3+x+1
  }
  return g;
}

// --- Reed-Solomon Coder for GF(8) ---

export interface RSCoderGF8 {
  encode(message: number[]): number[];
  decode(codeword: number[]): number[]; // Returns corrected message or throws error
}

export function ReedSolomonGF8(eccSymbols: number): RSCoderGF8 {
  // GF(8) has n=7 max block size. eccSymbols = n - k
  if (eccSymbols <= 0 || eccSymbols >= 7) {
    throw new Error(`Invalid number of ECC symbols for GF(8) RS code: ${eccSymbols}. Must be 1-6.`);
  }
  const generator = rsGeneratorPoly(eccSymbols);
  const nMax = 7; // Max codeword length for GF(8)

  return {
    encode: (message: number[]): number[] => {
      const k = message.length;
      if (k <= 0) return []; // No message, no ecc
      const n = k + eccSymbols;
      if (n > nMax) {
        throw new Error(
          `Message length (${k}) + ECC symbols (${eccSymbols}) = ${n} exceeds GF(8) block size limit (${nMax}).`
        );
      }

      // Append eccSymbols zeros to the message polynomial (message is coeffs highest degree first)
      const msgPoly = [...message, ...new Array(eccSymbols).fill(0)];

      // Calculate remainder
      const remainder = polyRemainder(msgPoly, generator);

      // The remainder is the ECC codeword. Pad with leading zeros if needed.
      const eccCodeword = new Array(eccSymbols).fill(0);
      const remainderOffset = eccSymbols - remainder.length;
      for (let i = 0; i < remainder.length; i++) {
        eccCodeword[remainderOffset + i] = remainder[i];
      }
      return eccCodeword;
    },

    decode: (received: number[]): number[] => {
      const n = received.length;
      const k = n - eccSymbols;
      if (k <= 0) throw new Error('Cannot decode: message length is zero or negative.');
      if (n > nMax)
        throw new Error(
          `Received codeword length (${n}) exceeds GF(8) block size limit (${nMax}).`
        );

      const receivedPoly = polyStripLeadingZeros(received); // Treat received codeword as polynomial

      // 1. Calculate Syndromes
      const syndromes = new Array(eccSymbols).fill(0);
      let hasError = false;
      for (let i = 0; i < eccSymbols; i++) {
        const alpha_i = gf8Pow(2, i); // alpha^i
        syndromes[i] = polyEval(receivedPoly, alpha_i);
        if (syndromes[i] !== 0) {
          hasError = true;
        }
      }

      // If all syndromes are zero, no errors detected
      if (!hasError) {
        return received.slice(0, k); // Return message part
      }

      // Syndrome polynomial S(x) = s_(nsym-1) + ... + s_1*x^(nsym-2) + s_0*x^(nsym-1)
      // Note the reversal and degree
      const syndromePoly = polyStripLeadingZeros(syndromes.slice().reverse());
      if (polyDegree(syndromePoly) === -1) {
        // Should have been caught by hasError check
        return received.slice(0, k);
      }

      // 2. Find Error Locator Polynomial (Sigma) and Error Evaluator Polynomial (Omega) using Euclidean Algorithm
      // [Sigma(x), Omega(x)] = ExtendedEuclidean(x^nsym, S(x), floor(nsym/2))
      let rLast = new Array(eccSymbols + 1).fill(0);
      rLast[0] = 1; // x^nsym
      let r = syndromePoly;
      let tLast = [0];
      let t = [1]; // Error locator polynomial (Sigma) starts as 1

      while (polyDegree(r) >= Math.floor(eccSymbols / 2)) {
        const rLastLast = rLast;
        const tLastLast = tLast;
        rLast = r;
        tLast = t;

        if (polyDegree(rLast) === -1 || rLast[0] === 0) {
          throw new Error(
            'RS Decode Error: rLast became zero polynomial during Euclidean algorithm.'
          );
        }

        r = rLastLast;
        let q = [0]; // Quotient polynomial
        const leadR = r[0];
        const leadRLast = rLast[0];
        const degreeDiff = polyDegree(r) - polyDegree(rLast);

        if (degreeDiff < 0) {
          // Should not happen if loop condition is correct?
          break;
        }

        const scale = gf8Mul(leadR, gf8Inv(leadRLast));
        q = polyMulMonomial([1], degreeDiff, scale); // q = (leadR / leadRLast) * x^degreeDiff
        r = polyAdd(r, polyMulMonomial(rLast, degreeDiff, scale)); // r = r - q*rLast (add is XOR)

        // This simplified Euclidean step might be wrong. A full step involves repeated subtraction.
        // Let's refine the Euclidean step based on standard algorithms.

        // Refined Euclidean Step:
        r = rLastLast; // Reset r
        q = [0]; // Reset quotient
        const invLeadRLast = gf8Inv(leadRLast);
        while (polyDegree(r) >= polyDegree(rLast) && polyDegree(r) !== -1) {
          const currentDegreeDiff = polyDegree(r) - polyDegree(rLast);
          const currentScale = gf8Mul(r[0], invLeadRLast);
          const term = polyMulMonomial([1], currentDegreeDiff, currentScale);
          q = polyAdd(q, term);
          r = polyAdd(r, polyMulMonomial(rLast, currentDegreeDiff, currentScale));
        }
        // End Refined Step

        t = polyAdd(polyMul(q, tLast), tLastLast);

        if (polyDegree(r) >= polyDegree(rLast) && polyDegree(r) !== -1) {
          // Check if degree actually decreased
          throw new Error('RS Decode Error: Euclidean division failed to reduce degree.');
        }
      }

      const sigma = t; // Error Locator Polynomial
      const omega = r; // Error Evaluator Polynomial (scaled)

      const numErrors = polyDegree(sigma);
      if (numErrors > Math.floor(eccSymbols / 2)) {
        throw new Error(
          `RS Decode Error: Too many errors detected (${numErrors} > ${Math.floor(eccSymbols / 2)}).`
        );
      }

      // 3. Find Error Locations (Chien Search)
      const errorLocations: number[] = []; // Store error positions (0 to n-1)
      for (let i = 0; i < nMax; i++) {
        // Check all possible locations (powers of alpha)
        const alpha_inv_i = gf8Pow(2, (7 - i) % 7); // alpha^(-i)
        if (polyEval(sigma, alpha_inv_i) === 0) {
          // Location is j where alpha^j = alpha_inv_i => j = (7-i)%7 ? No, location is related to power i.
          // If Sigma(alpha^-i) = 0, then error is at position i (0-based from right/lowest power)
          // The position in the codeword array (left-to-right, high-to-low power) is n-1-i
          const errorPos = n - 1 - i;
          if (errorPos < 0) continue; // Should not happen if n <= 7
          errorLocations.push(errorPos);
        }
      }

      if (errorLocations.length !== numErrors) {
        // Discrepancy between degree of Sigma and number of roots found
        throw new Error(
          `RS Decode Error: Number of error locations found (${errorLocations.length}) does not match degree of Sigma (${numErrors}).`
        );
      }

      // 4. Calculate Error Magnitudes (Forney Algorithm)
      const correctedCodeword = [...received];
      for (let i = 0; i < numErrors; i++) {
        const errorPos = errorLocations[i];
        const locValue = gf8Pow(2, (n - 1 - errorPos) % 7); // alpha^(n-1-errorPos) = alpha^(-errorPos) ? No, it's alpha^location_power
        const invLocValue = gf8Inv(locValue); // alpha^(-location_power)

        // Calculate Sigma'(x) (formal derivative)
        let sigmaPrimeEval = 0;
        for (let j = 1; j <= numErrors; j++) {
          // Iterate through terms of Sigma(x) = s0*x^numErrors + ... + sn
          if (j % 2 !== 0) {
            // Only odd power terms contribute to derivative in GF(2^m)
            sigmaPrimeEval = gf8Add(
              sigmaPrimeEval,
              gf8Mul(sigma[numErrors - j], gf8Pow(invLocValue, j - 1))
            );
          }
        }

        if (sigmaPrimeEval === 0) {
          throw new Error(
            "RS Decode Error: Sigma' evaluated to zero (division by zero in Forney)."
          );
        }

        const omegaEval = polyEval(omega, invLocValue);
        const errorMagnitude = gf8Mul(omegaEval, gf8Inv(sigmaPrimeEval));

        // 5. Correct Error
        correctedCodeword[errorPos] = gf8Add(correctedCodeword[errorPos], errorMagnitude);
      }

      // 6. Verify corrected codeword (optional but recommended)
      // Recalculate syndromes for correctedCodeword. Should all be zero.
      const correctedPoly = polyStripLeadingZeros(correctedCodeword);
      for (let i = 0; i < eccSymbols; i++) {
        const alpha_i = gf8Pow(2, i);
        if (polyEval(correctedPoly, alpha_i) !== 0) {
          throw new Error('RS Decode Error: Correction failed, syndromes are non-zero.');
        }
      }

      // 7. Return Corrected Message
      return correctedCodeword.slice(0, k);
    },
  };
}
