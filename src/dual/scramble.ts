import { deriveKeyMaterialSimple } from '../crypto/kdf.js';
import { generatePermutation, applyPermutation, applyInversePermutation } from '../crypto/permutation.js';
import { applyTransform, applyInverseTransform } from '../crypto/transform.js';

// Define the length of the key material to derive (e.g., 32 bytes for SHA-256 based KDF/hashing)
const DERIVED_KEY_LENGTH = 32;

/**
 * Scrambles an ECC-encoded private codeword using a key.
 * Applies permutation and XOR transformation based on the derived key material.
 *
 * @param eccCodeword The ECC-encoded codeword (symbols 0-1023).
 * @param key The user-provided secret key (string or Uint8Array).
 * @returns A Promise resolving to the scrambled codeword (symbols 0-255 for GF256 PoC).
 */
export async function scramble(
    eccCodeword: Uint8Array, // Changed to Uint8Array for GF256 PoC
    key: string | Uint8Array
): Promise<Uint8Array> { // Changed to Uint8Array
    const n = eccCodeword.length;
    if (n === 0) {
        return new Uint8Array(); // Changed to Uint8Array
    }

    // 1. Derive key material
    const keyMaterial = await deriveKeyMaterialSimple(key, DERIVED_KEY_LENGTH);

    // 2. Generate permutation
    const permutation = generatePermutation(keyMaterial, n);

    // 3. Apply permutation: c_perm[i] = eccCodeword[permutation[i]]
    // Need to convert Uint8Array to regular array for applyPermutation if it expects T[]
    const codewordArray = Array.from(eccCodeword);
    const permutedArray = applyPermutation(codewordArray, permutation);
    const permutedCodeword = new Uint8Array(permutedArray); // Changed to Uint8Array


    // 4. Apply XOR transformation: c_scrambled[i] = c_perm[i] XOR h(K', i)
    const scrambledCodeword = await applyTransform(permutedCodeword, keyMaterial);

    return scrambledCodeword;
}

/**
 * Descrambles a received codeword using a key.
 * Applies inverse XOR transformation and inverse permutation.
 *
 * @param scrambledCodeword The received scrambled codeword (symbols 0-1023).
 * @param key The user-provided secret key (string or Uint8Array).
 * @returns A Promise resolving to the descrambled (but still ECC-encoded) codeword (GF256 PoC).
 */
export async function descramble(
    scrambledCodeword: Uint8Array, // Changed to Uint8Array
    key: string | Uint8Array
): Promise<Uint8Array> { // Changed to Uint8Array
     const n = scrambledCodeword.length;
    if (n === 0) {
        return new Uint8Array(); // Changed to Uint8Array
    }

    // 1. Derive key material (must be identical to scrambling)
    const keyMaterial = await deriveKeyMaterialSimple(key, DERIVED_KEY_LENGTH);

    // 2. Generate permutation (must be identical to scrambling)
    const permutation = generatePermutation(keyMaterial, n);

    // 3. Apply inverse XOR transformation: c_perm[i] = c_scrambled[i] XOR h(K', i)
    const permutedCodeword = await applyInverseTransform(scrambledCodeword, keyMaterial); // Returns Uint8Array now

    // 4. Apply inverse permutation: eccCodeword[permutation[i]] = c_perm[i]
    // Need to convert Uint8Array to regular array
    const permutedArray = Array.from(permutedCodeword);
    const eccCodewordArray = applyInversePermutation(permutedArray, permutation);
    const eccCodeword = new Uint8Array(eccCodewordArray); // Changed to Uint8Array

    return eccCodeword;
}
