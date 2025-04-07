// Uses Web Crypto API (crypto.subtle) for SHA-256 hashing

/**
 * Calculates the transformation value h(K', i) mod q for scrambling.
 * Uses SHA-256(K' || i) and takes the first 3 bits (mod 8).
 *
 * @param keyMaterial Derived key material K'.
 * @param index The index i of the symbol.
 * @returns A Promise resolving to the transformation value (0-7).
 */
async function getTransformValue(keyMaterial: Uint8Array, index: number): Promise<number> {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
        throw new Error("Web Crypto API (crypto.subtle) is not available in this environment.");
    }

    // Create the message buffer: K' || i
    // Represent index 'i' as a fixed-size byte array (e.g., 4 bytes / 32 bits)
    const indexBuffer = new ArrayBuffer(4);
    new DataView(indexBuffer).setUint32(0, index, false); // Big-endian

    const messageBuffer = new Uint8Array(keyMaterial.length + 4);
    messageBuffer.set(keyMaterial, 0);
    messageBuffer.set(new Uint8Array(indexBuffer), keyMaterial.length);

    // Calculate SHA-256 hash
    const hashBuffer = await crypto.subtle.digest('SHA-256', messageBuffer);
    const hashArray = new Uint8Array(hashBuffer);

    // Take the first byte and get the first 3 bits (mod 8)
    // Ensure hashArray is not empty (shouldn't happen with SHA-256)
    if (hashArray.length === 0) {
        throw new Error("Hash calculation resulted in an empty array.");
    }
    const transformValue = hashArray[0] & 0x07; // Mask for the first 3 bits (0b00000111)

    return transformValue;
}

/**
 * Applies the XOR transformation step of scrambling to a permuted codeword.
 * c'_i <- c_{\pi_K(i)} \oplus h(K', i) \pmod q
 * Since q=8, this is just XOR.
 *
 * @param permutedCodeword The codeword after permutation. Symbols are 0-1023 (GF elements).
 * @param keyMaterial Derived key material K'.
 * @returns A Promise resolving to the final scrambled codeword (symbols 0-255 for GF256 PoC).
 */
export async function applyTransform(
    permutedCodeword: Uint8Array, // Changed to Uint8Array for GF256 PoC
    keyMaterial: Uint8Array
): Promise<Uint8Array> { // Changed to Uint8Array
    const n = permutedCodeword.length;
    const transformedCodeword = new Uint8Array(n); // Changed to Uint8Array

    for (let i = 0; i < n; i++) {
        const transformValue = await getTransformValue(keyMaterial, i); // Value 0-7
        const permutedSymbol = permutedCodeword[i];

        // XOR the symbol with the transform value.
        // Since symbols are 0-255 and transformValue is 0-7,
        // this XOR operates on the lower bits.
        transformedCodeword[i] = permutedSymbol ^ transformValue; // Simple XOR for GF(256)
    }

    return transformedCodeword;
}

/**
 * Applies the inverse XOR transformation step for descrambling.
 * c_{\pi_K(i)} <- c'_i \oplus h(K', i) \pmod q
 * Since XOR is its own inverse.
 *
 * @param scrambledCodeword The received scrambled codeword (symbols 0-1023).
 * @param keyMaterial Derived key material K'.
 * @returns A Promise resolving to the descrambled (but still permuted) codeword (GF256 PoC).
 */
export async function applyInverseTransform(
    scrambledCodeword: Uint8Array, // Changed to Uint8Array
    keyMaterial: Uint8Array
): Promise<Uint8Array> { // Changed to Uint8Array
    // XOR is its own inverse, so the process is identical to applyTransform
    return applyTransform(scrambledCodeword, keyMaterial);
}

// Removed GF import as simple XOR is used now
