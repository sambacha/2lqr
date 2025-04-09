/**
 * Converts a byte array into an array of q-ary symbols (0-7).
 * Each symbol represents 3 bits. Padding with 0 bits is added
 * if the total number of bits is not a multiple of 3.
 * A final '1' bit is added before padding to mark the end of data,
 * followed by zeros. This is a simple padding scheme; more robust
 * schemes might be needed depending on application.
 */
export function bytesToQarySymbols(data: Uint8Array): number[] {
  let bitString = '';
  // Use index-based loop for compatibility
  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    bitString += byte.toString(2).padStart(8, '0');
  }

  // Add terminator bit '1'
  bitString += '1';

  // Pad with '0's until length is multiple of 3
  while (bitString.length % 3 !== 0) {
    bitString += '0';
  }

  const symbols: number[] = [];
  for (let i = 0; i < bitString.length; i += 3) {
    const chunk = bitString.substring(i, i + 3);
    symbols.push(parseInt(chunk, 2));
  }

  return symbols;
}

/**
 * Converts an array of q-ary symbols (0-7) back into a byte array.
 * Assumes the padding scheme used in bytesToQarySymbols (final '1' bit marker).
 */
export function qarySymbolsToBytes(symbols: number[]): Uint8Array {
  let bitString = '';
  for (const symbol of symbols) {
    if (symbol < 0 || symbol > 7) {
      throw new Error(`Invalid q-ary symbol: ${symbol}`);
    }
    bitString += symbol.toString(2).padStart(3, '0');
  }

  // Find the terminator '1' bit
  const terminatorIndex = bitString.lastIndexOf('1');
  if (terminatorIndex === -1) {
    // This case should ideally not happen if encoding was done correctly
    // but handle it defensively. Maybe return empty or throw?
    console.warn('No terminator bit found in q-ary symbol stream.');
    return new Uint8Array();
  }

  // Extract the data bits before the terminator
  const dataBitString = bitString.substring(0, terminatorIndex);

  // Ensure the data bit string length is a multiple of 8
  const byteLength = Math.floor(dataBitString.length / 8);
  const relevantBits = dataBitString.substring(0, byteLength * 8);

  const bytes: number[] = [];
  for (let i = 0; i < relevantBits.length; i += 8) {
    const chunk = relevantBits.substring(i, i + 8);
    bytes.push(parseInt(chunk, 2));
  }

  return new Uint8Array(bytes);
}
