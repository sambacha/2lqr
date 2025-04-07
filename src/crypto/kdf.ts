// Uses Web Crypto API (crypto.subtle) for HKDF

/**
 * Derives a fixed-length key material from an input key using HKDF.
 *
 * @param inputKey The user-provided key (string or Uint8Array).
 * @param salt A salt value (Uint8Array). Using a fixed or empty salt is common if not provided.
 * @param info Context/application-specific info (Uint8Array). Can be empty.
 * @param length The desired length of the derived key material in bytes.
 * @returns A Promise resolving to the derived key material as a Uint8Array.
 */
export async function deriveKeyMaterial(
  inputKey: string | Uint8Array,
  salt: Uint8Array,
  info: Uint8Array,
  length: number
): Promise<Uint8Array> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error("Web Crypto API (crypto.subtle) is not available in this environment.");
  }

  // Get the source Uint8Array first
  const ikmSource = (typeof inputKey === 'string')
    ? new TextEncoder().encode(inputKey)
    : inputKey;

  let ikmBuffer: ArrayBuffer;

  // Ensure ikmBuffer is a standard ArrayBuffer, copying if necessary
  if (ikmSource.buffer instanceof ArrayBuffer) {
    ikmBuffer = ikmSource.buffer;
  } else {
    // If it's not an ArrayBuffer (e.g., SharedArrayBuffer), create a copy.
    ikmBuffer = ikmSource.slice().buffer;
  }

  // Import the input keying material for HKDF
  const rootKey = await crypto.subtle.importKey(
    "raw",
    ikmBuffer,
    { name: "HKDF" },
    false, // not extractable
    ["deriveBits"]
  );

  // Derive the bits using HKDF
  // Algorithm details: Use SHA-256 as the hash function
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: salt, // Salt enhances security, prevents rainbow table attacks
      info: info, // Context-specific information
    },
    rootKey,
    length * 8 // Length in bits
  );

  return new Uint8Array(derivedBits);
}

/**
 * A convenience function to derive key material with default salt/info.
 */
export async function deriveKeyMaterialSimple(
    inputKey: string | Uint8Array,
    length: number
): Promise<Uint8Array> {
    // Using empty salt and info for simplicity in this example.
    // For better security, consider using non-empty, context-specific salt/info.
    const empty = new Uint8Array();
    return deriveKeyMaterial(inputKey, empty, empty, length);
}
