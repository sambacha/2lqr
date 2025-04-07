import * as GF from './gf1024.js';

/**
 * Encodes a message using Reed-Solomon over GF(1024).
 *
 * @param message The message polynomial (Uint16Array of symbols 0-1023).
 * @param numEccSymbols The number of error correction symbols to add.
 * @returns The full codeword (message + ECC symbols).
 */
export function encode(message: Uint16Array, numEccSymbols: number): Uint16Array {
  if (numEccSymbols <= 0) {
    throw new Error("Number of ECC symbols must be positive.");
  }

  const generator = GF.buildGeneratorPoly(numEccSymbols);
  const messageDegree = message.length - 1;

  // Create the message polynomial shifted left by the number of ECC symbols
  // This is equivalent to multiplying the message polynomial by x^numEccSymbols
  // Use messageDegree: message.length = messageDegree + 1
  const shiftedMessage = new Uint16Array(messageDegree + 1 + numEccSymbols);
  shiftedMessage.set(message, 0); // Copy message coefficients
  // The remaining numEccSymbols coefficients are implicitly zero

  // Perform polynomial division to find the remainder
  const { remainder } = GF.polyDivide(shiftedMessage, generator);

  // The ECC symbols are the coefficients of the remainder polynomial.
  // We need to pad the remainder with leading zeros if its degree is less than numEccSymbols - 1.
  const eccSymbols = new Uint16Array(numEccSymbols);
  const remainderOffset = numEccSymbols - remainder.length;
  eccSymbols.set(remainder, remainderOffset); // Pad with leading zeros

  // Combine the original message symbols with the ECC symbols
  // Use messageDegree: message.length = messageDegree + 1
  const codeword = new Uint16Array(messageDegree + 1 + numEccSymbols);
  codeword.set(message, 0);
  codeword.set(eccSymbols, messageDegree + 1); // Use messageDegree + 1 for the offset

  return codeword;
}

// Note: Decoding (error correction) is more complex and typically involves:
// 1. Calculating syndromes.
// 2. Using an algorithm like Berlekamp-Massey or Euclidean algorithm to find error locator polynomial.
// 3. Finding error locations (roots of the error locator polynomial).
// 4. Calculating error magnitudes.
// 5. Correcting the errors.
// This encoder only implements the encoding part.
