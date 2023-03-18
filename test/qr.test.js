import { deepStrictEqual } from 'assert';
import { readFileSync } from 'fs';
import { gunzipSync } from 'zlib';
import { should } from 'micro-should';
import createQR, { _tests } from '../index.js';
const jsonGZ = (path) => JSON.parse(gunzipSync(readFileSync(path)));
const TEST_CASES = jsonGZ('./test/vectors/small-vectors.json.gz');

should('qr v1', () => {
  const v1_data = new Uint8Array([
    32, 9, 64, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 203, 10, 29,
    40, 162, 45, 18,
  ]);
  const v1 = _tests.drawQR(1, 'low', v1_data, 0).border(2);
  deepStrictEqual(
    v1.toASCII(),
    `
█████████████████████████
██ ▄▄▄▄▄ ██ ▀ ▄█ ▄▄▄▄▄ ██
██ █   █ █▄ █ ▄█ █   █ ██
██ █▄▄▄█ ███▄█ █ █▄▄▄█ ██
██▄▄▄▄▄▄▄█ ▀▄▀ █▄▄▄▄▄▄▄██
██▄  ▀▄▄▄ ▄▄ ▄█▄ ███ ▀███
███▀█▄▄ ▄▀▀▀ █▄█▀█▄█▀▀▄██
██▄▄▄█▄▄▄█  █▀▄▀▄▀▄▀▄▄▄██
██ ▄▄▄▄▄ █ ▀  ▀ ▄ ▀ ▄▀███
██ █   █ █▄▀█▄█▄ ▄█▄ ▀▄██
██ █▄▄▄█ █ ▄ █▄█▀█▄█▀▀ ██
██▄▄▄▄▄▄▄█▄▄▄█▄█▄█▄█▄█▄██
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
`.replace('\n', '')
  );
});

should('qr v5', () => {
  const v5_data = new Uint8Array([
    32, 9, 64, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 236,
    17, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17,
    236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 236,
    17, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17,
    236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 236,
    17, 236, 70, 127, 85, 241, 187, 169, 44, 239, 53, 251, 49, 213, 252, 27, 247, 26, 174, 115, 28,
    158, 228, 203, 151, 46, 173, 141,
  ]);
  const v5 = _tests.drawQR(5, 'low', v5_data, 0).border(2);
  deepStrictEqual(
    v5.toASCII(),
    `
█████████████████████████████████████████
██ ▄▄▄▄▄ ██▀▄██▀▄██▀▄██▀▄██▀▄███ ▄▄▄▄▄ ██
██ █   █ █▄▀█▄▀▀█▄▀▀█▄▀▀█▄▀▀█▄▀█ █   █ ██
██ █▄▄▄█ ██▄▀▀ ▄▀▀ ▄▀▀ ▄▀▀ ▄▀▀ █ █▄▄▄█ ██
██▄▄▄▄▄▄▄█ █▄▀▄█▄▀▄█▄▀▄█▄▀▄█▄▀▄█▄▄▄▄▄▄▄██
██ ▄ ▀ ▄▄  ▀█▀ ▀█▀ ▀█▀ ▀█▀ ▀█▀  ▄█▀█ ████
██▄███▀▄▄▀▀▀█▄ ▀ ▄ ▀ ▄ ▀ ▄ ▀ ▄ █▄█▀█▀█▄██
███▄██▄ ▄ █ █ ██  ██  ██  ██  ██▄ ▄▀▄▀▄██
██▀▀ █ █▄██▄▀▀█▄█▀█▄█▀█▄█▀█▄█▀█ ▀ ▄ ▄ ▀██
██▀ ▀█▀█▄██ ▀▀ ▀█▀ ▀█▀ ▀█▀ ▀█▀  ██ ▄ ▄███
██▀▀█ █▄▄▄▀▀▀▄ ▀ ▄ ▀ ▄ ▀ ▄ ▀ ▄ █▄█▀█▀█▄██
██ ▄███▄▄ ▀█▀ ██  ██  ██  ██  ██▄ ▄▀▄▀▄██
██ ▀█  █▄██ ▀▀█▄█▀█▄█▀█▄█▀█▄█▀█ ▀ ▄ ▄ ▀██
██▄▄  ▀▀▄█▀█ ▀ ▀█▀ ▀█▀ ▀█▀ ▀█▀  ██ ▄  ███
██▄▀ ▄▀▀▄▄ ▄ ▄ ▀ ▄ ▀ ▄ ▀ ▄ ▀ ▄ █▄█▀█▀▀▄██
██▄█▄██▄▄▄ ▄  ██  ██  ██  ██ ▄ ▄▄▄ ▀▄▄▄██
██ ▄▄▄▄▄ █ ▄▄▀█▄█▀█▄█▀█▄█▀█▄█▀ █▄█  ▄▀███
██ █   █ █▄▀ ▀ ▀█▀ ▀█▀ ▀█▀ ▀██▄ ▄▄▄▄ ▀▄██
██ █▄▄▄█ █ ▄▄▄ ▀ ▄ ▀ ▄ ▀ ▄ ▀ ▀▄▄ █▄█▀▀ ██
██▄▄▄▄▄▄▄█▄██▄██▄▄██▄▄██▄▄██▄▄████▄█▄█▄██
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
`.replace('\n', '')
  );
});

should('qr v10', () => {
  const v10_data = new Uint8Array([
    32, 236, 236, 17, 2, 17, 17, 236, 80, 236, 236, 17, 0, 17, 17, 236, 236, 236, 236, 17, 17, 17,
    17, 236, 236, 236, 236, 17, 17, 17, 17, 236, 236, 236, 236, 17, 17, 17, 17, 236, 236, 236, 236,
    17, 17, 17, 17, 236, 236, 236, 236, 17, 17, 17, 17, 236, 236, 236, 236, 17, 17, 17, 17, 236,
    236, 236, 236, 17, 17, 17, 17, 236, 236, 236, 236, 17, 17, 17, 17, 236, 236, 236, 236, 17, 17,
    17, 17, 236, 236, 236, 236, 17, 17, 17, 17, 236, 236, 236, 236, 17, 17, 17, 17, 236, 236, 236,
    236, 17, 17, 17, 17, 236, 236, 236, 236, 17, 17, 17, 17, 236, 236, 236, 236, 17, 17, 17, 17,
    236, 236, 236, 236, 17, 17, 17, 17, 236, 236, 236, 236, 17, 17, 17, 17, 236, 236, 236, 236, 17,
    17, 17, 17, 236, 236, 236, 236, 17, 17, 17, 17, 236, 236, 236, 236, 17, 17, 17, 17, 236, 236,
    236, 236, 17, 17, 17, 17, 236, 236, 236, 236, 17, 17, 17, 17, 236, 236, 236, 236, 17, 17, 17,
    17, 236, 236, 236, 236, 17, 17, 17, 17, 236, 236, 236, 236, 17, 17, 17, 17, 236, 236, 236, 236,
    17, 17, 17, 17, 236, 236, 236, 236, 17, 17, 17, 17, 236, 236, 236, 236, 17, 17, 17, 17, 236,
    236, 236, 236, 17, 17, 17, 17, 236, 236, 236, 236, 17, 17, 17, 17, 236, 236, 236, 236, 17, 17,
    17, 17, 236, 236, 236, 236, 17, 17, 17, 17, 236, 236, 236, 236, 17, 17, 17, 17, 236, 236, 17,
    72, 86, 39, 17, 6, 191, 118, 111, 152, 83, 190, 181, 29, 81, 145, 123, 225, 59, 99, 65, 203, 59,
    213, 241, 60, 236, 119, 29, 20, 136, 195, 197, 97, 83, 226, 109, 151, 173, 240, 239, 161, 10,
    21, 196, 53, 183, 189, 219, 2, 26, 47, 234, 144, 127, 51, 136, 245, 248, 234, 111, 113, 52, 253,
    151, 77, 143, 120, 17, 130, 234, 89, 223,
  ]);
  const v10 = _tests.drawQR(10, 'low', v10_data, 0).border(2);
  deepStrictEqual(
    v10.toASCII(),
    `
█████████████████████████████████████████████████████████████
██ ▄▄▄▄▄ ██▄ ▄▄ ▄█▄█  ▀ ▄█▄ ██▀█▄ ▄ ██▀█▄ ▄ ██▀█▄ ██ ▄▄▄▄▄ ██
██ █   █ █▄ █▄▀ ▄█▄█▀ █ ▄█▄█▄█ █▄ ▄ ▀█ █▄ ▄ ▀█ ▀▄ ██ █   █ ██
██ █▄▄▄█ ██ ▄█▀ ▄█▄█  ▀ ▄█▄▀ ▄▄▄  ▄ ██▀█▄ ▄ ██▀█▀▄██ █▄▄▄█ ██
██▄▄▄▄▄▄▄█ █ ▀▄█▄▀▄▀ █ █▄▀▄▀ █▄█ █▄▀▄▀▄█ █▄▀▄▀▄█ ▀▄█▄▄▄▄▄▄▄██
██   █  ▄▄  █ ▀█▄█  █ ▄█▄█  ▄   ▄█▄ ▄ ▀█▀█▄ ▄ ▀█▀ ▄▄ ▀▀▀▄████
██  ▀▄█▄▄██ ▀█  ▀█▀█▄ ▄ ▀█▀ ▄ █▄ ▀▄ ▄▄██ ▀▄ ▄▄██  ▄█  █▀▄█▄██
██▀█ ▀▀▄▄▄  █ ▄ ██ █▄ ▄ ██  ▄ ▀█▀ ▀ ▄█▄█▀ ▀ ▄█▄█▀ ▄█▀ ▀▀▄▀▄██
███▀█ ▀█▄▀▄▄ █▄ ▀█▀█▄ ▄ ▀█▀ ▄ ██  █ ▄█▄█  █ ▄█▄█  ▄▀▄ █ ▄ ▀██
██▀ █▀██▄ ▄▄  █ ██ █▄ ▄ ██  ▄ ▀█▀ ▀ ▄█▄█▀ ▀ ▄█▄█▀ ▄ ▄ ▀ ▄ ███
██▄ ▀ █ ▄▄██▄███▄█▀█▄ ▄ ▀█▀ ▄▄██  █ ▄█▄█  █ ▄█▄█  ▄ ▄▄█ ▄ ▀██
██▀▄▀▄▄▀▄▄▄▄█ ▀█▄█ █▄ ▄ ██ ▄ █▄█▀ ▀ ▄█▄█▀ ▀ ▄█▄█▀█  ▄█▄▄  ███
██▀█  ▄ ▄▀ █▄ █ ▄█▀█▄ ▄ ▀█▀█▀█▄█  █▄ █▄▀▄ █▄ █▄▀▄█▀ ▄█▄█▀█▄██
██▄ ▄▄██▄▀█ ▄ ▄▀█ ▄█▄█  █ ▄█ █▄█▀ ▀█▀█▄ ▄ ▀█▀█▄ ▄█  ▄█▄█  ▄██
██ ▀ ▄ ▄▄▄ ▀██▀▄▄ ▄ ▀█▀█▄ ▄  ▄▄▄ ▄██ ▀▄ ▄▄██ ▀▄ ▄█ ▄▄▄ █▀ ▀██
██ ▀▄█ █▄█ ▀█ ▀   ▄ ██ █▄ ▄▄ █▄█ █▄█▀ ▀ ▄█▄█▀ ▀ ▄▄ █▄█ █ ▄███
██▄ ▀▄▄▄▄ ▄ █▄█▀  ▄ ▀█▀█▄ ▄█▄ ▄ ▄█▄█  █ ▄█▄█  █ ▄▀ ▄▄ ▄█▀█▄██
██▄█▀▀▄█▄ ▄█  ▄▄  ▄ ██ █▄ ▄▄█ ▄█▄█▄█▀ ▀ ▄█▄█▀ ▀ ▄▄ █▄ ▄█ █▄██
███▄▀▄▀▄▄▀▀ █  █▄ ▄ ▀█▀█▄ ▄██ ▄█▄█▄█  █ ▄█▄█  █ ▄  █▄ ▄█▀█▄██
██▄▄▄██▄▄▄▀▄▄ ▄█▄ ▄ ██ █▄ ▄▄█ ▄█▄█▄█▀ ▀ ▄█▄█▀ ▀ ▄▄  ▀ ▄▀▄▀ ██
██▀▀▄█▄▄▄█▀  ▄▄▀▄ ▄ ▀█▀█▄ ▄▀█ ▄█▄█▄▀▄ █▄ █▄▀▄ █▄  █ █ ▄ ▄▀▄██
██  █   ▄▀▄█▄▄   █  █ ▄█▄█ ▀ █ █▄█▄ ▄ ▀█▀█▄ ▄ ▀█▀▀█ ▀█  ▄█▄██
██▀ █ ▄▀▄▄▀▄▄ ▄█▀█▀█▄ ▄ ▀█▀▀ █▀█▄▀▄ ▄▄██ ▀▄ ▄▄██ ▀█ ██▀ ▄█▄██
██▀▄▀▄▀█▄▄ █ ▄▄▄▀█ █▄ ▄ ██ ▀ █ █▄ ▀ ▄█▄█▀ ▀ ▄█▄█▀▀█ ▀█  ▄▀▄██
██ ▀ ▀▀▄▄▀▀ ▀ ▀▄ █▀█▄ ▄ ▀█▀▀ █▀█▄ █ ▄█▄█  █ ▄█▄█ ▀█ ██▀ ▄ ▀██
████████▄▄▀▀ █▀  █ █▄ ▄ ██ ▀ ▄▄▄  ▀ ▄█▄█▀ ▀ ▄█▄█▀█ ▄▄▄  ▄ ███
██ ▄▄▄▄▄ █    ▀  █▀█▄ ▄ ▀█▀  █▄█  █ ▄█▄█  █ ▄█▄█ ▀ █▄█  ▄ ▀██
██ █   █ █▄▄█ █▄▀█ █▄ ▄ ██ █▄ ▄▄  ▀ ▄█▄█▀ ▀ ▄█▄█▀█▄▄  ▄▄  ███
██ █▄▄▄█ █ ██▄▄███▀█▄ ▄ ▀█▀█▄ ▀█▀ █▄ █▄▀▄ █▄ █▄▀▄█▄█▀ ▀█▀▀ ██
██▄▄▄▄▄▄▄█▄▄▄█▄██▄▄█▄█▄▄█▄▄█▄▄██▄▄████▄▄▄▄████▄▄▄█▄█▄▄██▄█▄██
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
`.replace('\n', '')
  );
  const v10_6 = _tests.drawQR(10, 'low', v10_data, 6).border(2);
  console.log(v10_6.toASCII());
  deepStrictEqual(
    v10_6.toASCII(),
    `
█████████████████████████████████████████████████████████████
██ ▄▄▄▄▄ █▄▀ ▀ ▀  ▄ ▄▀██▄  ▀▀ ▀  ▀ ██ █▄ █▄█▀▄█ ▄ ██ ▄▄▄▄▄ ██
██ █   █ ███▀ ██▀  ▀██ █ ▀  ▀ ▄▀ █▀██▀▄ ▀█ ▄█ █▄▄ ██ █   █ ██
██ █▄▄▄█ ███▀▄█▄▄ ▀▄▄▄▀█▀▄ █ ▄▄▄ ▄▄█ ▄█▀▄█▀▀▀▀▀ ▀▄██ █▄▄▄█ ██
██▄▄▄▄▄▄▄█ ▀ █ █ █▄█▄█▄▀▄█ ▀ █▄█ █ █▄█ █▄▀▄█ ▀ ▀ █ █▄▄▄▄▄▄▄██
██▄▄█ ▄█▄▀██▀▄█ ▀ ▄▄▀█▀  ▀▄█ ▄▄▄  ▀█ ▄█ ▄  ▄ █▄ █▄ ▀▄███▀▀ ██
██▄▄▀▀ █▄▀██▄▄▄▄▀ ▄▄ ▄▄█▄▄█▄▄█ █▄█▄█▀█▀▀ ▄▀▀  █ █▀ ▀ █   ▀▄██
███▄▄▄▀▀▄█▄███ ▀▀    ▀ ██ ▄▀ █▀ █▀██▄  ▄██▀█ ▄  ▀█ ▄██▀▄   ██
██▀▄ ██▀▄▄▀▀▄▀ █▄ █▀ █▀██▀██▀█▀▀▄█ █ ▀  ██▀▄  ▀ ▄▄ ▄▀█▀▄ █▄██
███▄█▄ ▄▄▄▄▀█▀▀▄█ █▄ ▄▄█ ▄▄▄▄█▄▄█▄▀█▀▄ ▀▀█▄▀ ▀▄ ▄▀ ▄▄█▄▀ ▄███
██ ▀████▄█▀ ▄ ▀▄  ▀  ▀ █▀ █▀ ▀█ ▄▀▀█▄  ▄▄███ ▄   █ ▀ ▀██ ▀███
███▀▄▀ █▄▀▀▀▀▄█ ▀ ▄▀ █▀█▀▀▄▀█  ▀██▄█ ▀  ▄██▄  ▀ █▀▄█▀   ▄█ ██
███▀ █▀▀▄█  ▀▀▀▄▄ ▄▄ ▄▄█▄▄█▀▀ ▀▄▄▄█▀█▄ █▄█ █▄▀▄▄▀▄█▄▄ ▀▄█▀▄██
██ ▀ ▀█ ▄ ▀█▄█  ▀█▄  ▄▄███ ▄▄ ▄ █▀█ ▀  ▀ █▀ █▄ █▄ ▄▀  ▄ ▄▀ ██
██▄▄█▀ ▄▄▄ ▄▀▀█▀▀█ ▄█ ▄  ▄ █ ▄▄▄ ▀  ▄█ █▀▀▀▀▄▄▀█ ▀ ▄▄▄ ▀██▄██
██▄█▄  █▄█ ▄ ▀█▄ █▀▀▀▀  ▀▀   █▄█ ▀▄ ▄▀█▄▄ ▀▄█▄▀█▀█ █▄█ ▄▄ ███
██ ▀█▀▄ ▄  ██▀▀ ▄█▄██▄█ ▄█ ▄ ▄▄▄ ▄   █▀▀  ▄ ▄▀▀█▄▄▄▄ ▄▄ █▄ ██
██  ▄▄ ▀▄█▀ ▄▄ ▀██ ▄▀ █  ▄ ▀ █ ▀  ▀ █▄██▀  ▀██▄█  ▄ ▀█ ▀▄ ▀██
██▀ ▀▀▄█▄█▀█ ▀▄▀▄█▀▀█▀▀ ▀▀ ▀██▀▄ ▀▄ █▀▀▄▄ ▀▄▄▄██▀▀▄▀▄█▀▄█▀▄██
██ █  █▀▄██▀▄█ ▄ █▄█▀▄▄ ▄█ █▀█▄  ▄  ▀██▀  ▄ █▀██▄▀▄▀██▄▄  ▄██
███▄▀   ▄ ▄█▄  ▄▀█ ▄█ ▄  ▄ ▄ █ ▀  ▀▄ ▄▀▀█  █ █ ▀▄▄▀█ █ ▄ ▄▀██
██▄▄███▀▄█▄ ▀█▄▄  █▀▀▄▄ ▀▄▄█  █▄ ▀▄█▀▀█▀▀ ▀▀ ▄▀ ▄ ▀▄▀ █▀ ▀▄██
███▀▀█▄▄▄██▀▄█ ▄█ ▀  ▀ █▀ █ ▄ ▀    █▄▀▀▄▄▄▄█ █▀  ▄▀▀▀ ▀█ ▄ ██
███▀▄▀█▀▄▀█ ▄  ▀▄ ▄▀ █▀█▀▀▄▄█ ▄▀ █▄█ ▀  ▄██▄  ▀ ██▀█▄ ▄▄ ▄▀██
██ ▀ ▀▀▄▄█▀█▄▀█   ▄▄ ▄▄█▄▄██  ▄▄ ▄██▀▄ ▀ █ ▀ ▀▄ █ ▀▄█ ▄▀ ▄▀██
████████▄█▀▄  █▀▄    ▀ ██ ▄  ▄▄▄ ▀██▄  ▄██▀█ ▄  ▀  ▄▄▄ █ ▀▀██
██ ▄▄▄▄▄ ███▄▄███ █▀ █▀██▀██ █▄█ █ █ ▀  ██▀▄  ▀ ▄█ █▄█ ▄ █▄██
██ █   █ █ ▀ ▀▀ ▀ █▄ ▄▄█ ▄▄▀▄▄ ▄▄▄▀█▀▄ ▀▀█▄▀ ▀▄ ▄▄   ▄ █▄▄███
██ █▄▄▄█ █▀ █▀ ▄▀ ▀  ▀ █▀ █▄ █▀ █▀▀▀     ██▀▄▄ ▄▄  ▄██▀ █ ▄██
██▄▄▄▄▄▄▄█▄█▄█▄▄▄█▄█▄▄███▄▄▄████▄█▄▄██▄██████▄██▄█▄▄████▄▄███
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
`.replace('\n', '')
  );
  const v10_1 = _tests.drawQR(10, 'low', v10_data, 1).border(2);
  console.log(v10_1.toASCII());
  deepStrictEqual(
    v10_1.toASCII(),
    `
█████████████████████████████████████████████████████████████
██ ▄▄▄▄▄ █ ▀ ▀▄█▄ ▄  █▀█▄ ▄██ ▀ ▄█▄██ ▀ ▄█▄██ ▀ ▄ ██ ▄▄▄▄▄ ██
██ █   █ ████▀▀█▄ ▄ ▀███▄ ▄ ▄   ▄█▄█▀   ▄█▄█▀  ▄▄ ██ █   █ ██
██ █▄▄▄█ █ █▄ ▀█▄ ▄  █▀█▄ ▄▄ ▄▄▄ █▄██ ▀ ▄█▄██ ▀ ▀▄██ █▄▄▄█ ██
██▄▄▄▄▄▄▄█ ▀ █▄▀▄█▄█ ▀ ▀▄█▄█ █▄█ ▀▄█▄█▄▀ ▀▄█▄█▄▀ █▄█▄▄▄▄▄▄▄██
██ ▄ ▀▀▄▄▀ ███▀ ▄  ███▄ ▄  █▄▄ ▄▄ ▄█▄█▀ ▀ ▄█▄█▀ ▀█▄  ▄ ██ ▄██
██ █▀▀█▀▄ ██▀  █▀ ▀ ▄█▄█▀ ▀█▄██▀ ▄▄█▄▀█  ▄▄█▄▀█  █▄  ██▄▄ ▄██
██▀  ▄▀▀▄▀ ███▄██   ▄█▄██  █▄█▀ ▀█▀█▄ ▄ ▀█▀█▄ ▄ ▀█▄ ▀█▀▄▄▄▄██
███▄██▀ ▄▄▄▀  ▄█▀ ▀ ▄█▄█▀ ▀█▄██  ███▄ ▄  ███▄ ▄  █▄▄▄███▄█▀██
██▀██▄█ ▄█▄▀ ████   ▄█▄██  █▄█▀ ▀█▀█▄ ▄ ▀█▀█▄ ▄ ▀█▄█▄█▀█▄████
██▄█▀███▄▀█ ▄ █ ▄ ▀ ▄█▄█▀ ▀█▄▀█  ███▄ ▄  ███▄ ▄  █▄█▄▀██▄█▀██
██▀▀▀▀▄▄▄▀▄▀██▀ ▄   ▄█▄██  ▀  ▄ ▀█▀█▄ ▄ ▀█▀█▄ ▄ ▀  █▄ ▄▀ ████
██▀  █▄█▄▄  ▄███▄ ▀ ▄█▄█▀ ▀ ▀ ▄  ██▀  ▄▄▄██▀  ▄▄▄ ▀█▄ ▄ ▀ ▄██
██▄█▄▀█ ▄▄██▄█▄▄██▄ ▄  ███▄   ▄ ▀█▀ ▀ ▄█▄█▀ ▀ ▄█▄  █▄ ▄  █▄██
██ ▄ ▀ ▄▄▄ ▄█ ▀▀▄█▄█▀ ▀ ▄█▄█ ▄▄▄ ▀█  ▄▄█▄▀█  ▄▄█▄  ▄▄▄  ▀█▀██
██ ▄▄  █▄█ ▄██▀█ █▄██   ▄█▄▀ █▄█  ▄ ▀█▀█▄ ▄ ▀█▀█▄▀ █▄█   ▀███
██▄█▀▀▄ ▄▄▄██▀█▄ █▄█▀ ▀ ▄█▄ ▄▄▄▄▄ ▄  ███▄ ▄  ███▄▄  ▄▄▄ ▀ ▄██
██▄ ▀▄▄ ▄█▄  █▄▀ █▄██   ▄█▄▀██▄ ▄ ▄ ▀█▀█▄ ▄ ▀█▀█▄▀  ▄█▄   ▄██
███▀▀▀▀▀▄▄▀███  ▄█▄█▀ ▀ ▄█▄ ██▄ ▄ ▄  ███▄ ▄  ███▄█  ▄█▄ ▀ ▄██
██▄▀▄ █▀▄▀▀▀▄█▄ ▄█▄██   ▄█▄▀██▄ ▄ ▄ ▀█▀█▄ ▄ ▀█▀█▄▀ █▀█▄▄▄▄ ██
██▀▄▄ ▄▀▄ ▀█ ▀▄▄▄█▄█▀ ▀ ▄█▄▄██▄ ▄ ▄▄▄██▀  ▄▄▄██▀ █████▄█▄▄▄██
██ ███ █▄▄▄ ▄▀ █   ███▄ ▄  ▄    ▄ ▄█▄█▀ ▀ ▄█▄█▀ ▀▄██▀  █▄ ▄██
██▀███▄▄▄▀▀▀▄█▄ ▀ ▀ ▄█▄█▀ ▀▄  ▀ ▄▄▄█▄▀█  ▄▄█▄▀█  ▄███ ▀█▄ ▄██
██▀▀▀▀▀ ▄▀   ▀▄▀▀   ▄█▄██  ▄    ▄█▀█▄ ▄ ▀█▀█▄ ▄ ▀▄██▀  █▄▄▄██
██ ▀ ▀▀▄▄▄▀█▀█▀▀  ▀ ▄█▄█▀ ▀▄  ▀ ▄███▄ ▄  ███▄ ▄  ▄███ ▀█▄█▀██
████████▄█▀▄  ▀█    ▄█▄██  ▄ ▄▄▄ █▀█▄ ▄ ▀█▀█▄ ▄ ▀  ▄▄▄ █▄████
██ ▄▄▄▄▄ █▀█ █▀█  ▀ ▄█▄█▀ ▀█ █▄█ ███▄ ▄  ███▄ ▄  ▄ █▄█ █▄█▀██
██ █   █ ██▀███▀▀   ▄█▄██   ▄▄▄  █▀█▄ ▄ ▀█▀█▄ ▄ ▀ ▄  ▄▄▀ ████
██ █▄▄▄█ █  █▀▄ █ ▀ ▄█▄█▀ ▀ ▄█▀ ▀██▀  ▄▄▄██▀  ▄▄▄ ▄ ▀█▀ ▀▄ ██
██▄▄▄▄▄▄▄█▄█▄▄▄▄██▄▄▄▄▄███▄▄▄██▄▄██▄█▄▄█▄██▄█▄▄█▄▄▄▄▄██▄▄▄▄██
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
`.replace('\n', '')
  );
});

should('qr v20', () => {
  console.log('V20');
  const v20_data = new Uint8Array([
    32, 17, 236, 17, 17, 17, 17, 17, 2, 236, 17, 236, 236, 236, 236, 236, 80, 17, 236, 17, 17, 17,
    17, 17, 0, 236, 17, 236, 236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236,
    236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236, 236, 236, 236, 236, 236,
    17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236, 236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17,
    17, 17, 236, 17, 236, 236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236,
    236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236, 236, 236, 236, 236, 236,
    17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236, 236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17,
    17, 17, 236, 17, 236, 236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236,
    236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236, 236, 236, 236, 236, 236,
    17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236, 236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17,
    17, 17, 236, 17, 236, 236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236,
    236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236, 236, 236, 236, 236, 236,
    17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236, 236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17,
    17, 17, 236, 17, 236, 236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236,
    236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236, 236, 236, 236, 236, 236,
    17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236, 236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17,
    17, 17, 236, 17, 236, 236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236,
    236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236, 236, 236, 236, 236, 236,
    17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236, 236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17,
    17, 17, 236, 17, 236, 236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236,
    236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236, 236, 236, 236, 236, 236,
    17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236, 236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17,
    17, 17, 236, 17, 236, 236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236,
    236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236, 236, 236, 236, 236, 236,
    17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236, 236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17,
    17, 17, 236, 17, 236, 236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236,
    236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236, 236, 236, 236, 236, 236,
    17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236, 236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17,
    17, 17, 236, 17, 236, 236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236,
    236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236, 236, 236, 236, 236, 236,
    17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236, 236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17,
    17, 17, 236, 17, 236, 236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236,
    236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236, 236, 236, 236, 236, 236,
    17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236, 236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17,
    17, 17, 236, 17, 236, 236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236,
    236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236, 236, 236, 236, 236, 236,
    17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236, 236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17,
    17, 17, 236, 17, 236, 236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236,
    236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236, 236, 236, 236, 236, 236,
    17, 236, 17, 17, 17, 17, 17, 17, 236, 17, 236, 236, 236, 236, 236, 236, 17, 236, 17, 17, 17, 17,
    17, 236, 236, 236, 236, 236, 40, 201, 192, 107, 107, 107, 107, 107, 21, 182, 92, 234, 234, 234,
    234, 234, 69, 250, 221, 120, 120, 120, 120, 120, 100, 179, 151, 154, 154, 154, 154, 154, 184,
    30, 161, 110, 110, 110, 110, 110, 11, 78, 183, 155, 155, 155, 155, 155, 195, 189, 74, 86, 86,
    86, 86, 86, 112, 254, 36, 60, 60, 60, 60, 60, 23, 255, 74, 245, 245, 245, 245, 245, 52, 111, 38,
    205, 205, 205, 205, 205, 22, 133, 178, 204, 204, 204, 204, 204, 165, 57, 240, 61, 61, 61, 61,
    61, 156, 249, 95, 49, 49, 49, 49, 49, 7, 105, 102, 224, 224, 224, 224, 224, 196, 65, 186, 143,
    143, 143, 143, 143, 226, 8, 15, 95, 95, 95, 95, 95, 204, 212, 126, 222, 222, 222, 222, 222, 19,
    100, 138, 97, 97, 97, 97, 97, 251, 145, 189, 122, 122, 122, 122, 122, 145, 124, 191, 162, 162,
    162, 162, 162, 239, 103, 7, 110, 110, 110, 110, 110, 111, 22, 122, 169, 169, 169, 169, 169, 156,
    92, 57, 205, 205, 205, 205, 205, 209, 214, 54, 103, 103, 103, 103, 103, 179, 21, 33, 168, 168,
    168, 168, 168, 163, 97, 158, 194, 194, 194, 194, 194, 117, 8, 244, 39, 39, 39, 39, 39, 79, 230,
    210, 115, 115, 115, 115, 115,
  ]);
  const v20 = _tests.drawQR(20, 'low', v20_data, 0).border(2);
  deepStrictEqual(
    v20.toASCII(),
    `
█████████████████████████████████████████████████████████████████████████████████████████████████████
██ ▄▄▄▄▄ ██▄▀ ▀▀▀  ▄▄ ███▄ ██▄ ██▄  ▄█▄█▄ ▄█▄ ▄█▄ ▄█▄ ▄█▄ ▄█▄ ▄██▄ ▀█▀ ▀█▀ ▀█▀ ▀█▀ ▀█▀ ▀█▄ █ ▄▄▄▄▄ ██
██ █   █ █▄███▀▀  ▀▄ ▄▄▄█  ▄█  ▄█   ▄▀▄ ▀ ▄ ▀ ▄ ▀ ▄ ▀ ▄ ▀ ▄ ▀ ▄▄█  ▀█▀ ▀█▀ ▀█▀ ▀█▀ ▀█▀  █▄ █ █   █ ██
██ █▄▄▄█ ████ ▀▄█  ▀▄ ███▄ ██▄ ██  ▄▄▄  █ ▄ █ ▄ █ ▄ █ ▄ █ ▄ █  ▄▄▄ ▀█▀▄▀█▀▄▀█▀▄▀█▀▄▀█▀▄▀█▀▄█ █▄▄▄█ ██
██▄▄▄▄▄▄▄█ ▀ ▀ ▀▄█ ▀▄█▄█ █ █ █ █ █ █▄█ ▀▄█▄▀▄█▄▀▄█▄▀▄█▄▀▄█▄▀▄▀ █▄█ ▀ ▀ ▀ ▀ ▀ ▀ ▀ ▀ ▀ ▀ ▀ ▀ █▄▄▄▄▄▄▄██
██▄▄ ▀▄ ▄  ▀▀▄▀▀ ██▄▀▄   ▀   ▀   ▄ ▄▄▄  ▄█▄ ▄█▄ ▄█▄ ▄█▄ ▄█▄ ▄█▄  ▄▄▀ ▄ ▀ ▄ ▀ ▄ ▀ ▄ ▀ ▄ ▀ ▀   █▀▀▄████
██ ▀█▀ ▄▄▄██ ▀▀▄██▀▄▄█▄▄ ▀▄▄ ▀▄▄ ▀ █▄█▀▄ █▄▄ █▄▄ █▄▄ █▄▄ █▄▄ █▄▀▄▄█▀  █▀  █▀  █▀  █▀  █▀ ▀  ██  ▄█▄██
████   █▄ █▄▀▄▀████▀▄▄   ██  ██  ▀▄█▄ ▄█▀█▄█▀█▄█▀█▄█▀█▄█▀█▄█▀█▄▀███▀ ▀█▀ ▀█▀ ▀█▀ ▀█▀ ▀█▀ ▀  ▀█▀ ▄█▄██
██ ▀█▀▀ ▄▄█  ▀▀  █▀█▀█▄▄ ▄▀▄ ▄▀▄ ███▄ ▄█ █▄█ █▄█ █▄█ █▄█ █▄█ █▄▄▀▄█▀ ▀ ▀ ▀ ▀ ▀ ▀ ▀ ▀ ▀ ▀ ▀▄ ██  ▄█▄██
████  ▀▀▄ █▄▀▄▀  ██▄ ▄   ▀   ▀   ▄▀█▄█ █▀█▄█▀█▄█▀█▄█▀█▄█▀█▄█▀█▄  ██▀ ▄ ▀ ▄ ▀ ▄ ▀ ▄ ▀ ▄ ▀ ██ ▀█▀ ▄█▄██
██ ▀▀▄█▀▄▄█  ▀▀  ███ █ ▀▄▀ ▀▄▀ ▀▄▀ █▄█▀█ █▄█ █▄█ █▄█ █▄█ █▄█ █▄▀▄▄██   █   █   █   █   █ ▄▀ ██ ▀▄█▄██
██ █ █▀ ▄ █▄▀▄█   █▄  ▀▀█▀ ▀█▀ ▀█▀ █▄█ █▀█▄█▀█▄█▀█▄█▀█▄█▀█▄█▀█▄▀███▄█▄ ▄█▄ ▄█▄ ▄█▄ ▄█▄ ▄█▀ █▄█▀█ ▀▄██
██▄▄▄▀█▀▄▄█  ▀▄    █ █ ▄▀▀ ▄▀▀ ▄▀▀ █▄█▀█ ▀▄█ ▀▄█ ▀▄█ ▀▄█ ▀▄█ █▄▀█▄▀▀█  ▀█  ▀█  ▀█  ▀█  ▀█▀▄█▄ ▄█▀ ▀██
██▄ █▄▀ ▄ █▄▀█▄  ▄█▄     ▀   ▀   ▀ █▄█ █▀ ▀█▀ ▀█▀ ▀█▀ ▀█▀ ▀█▀▀▄▀█▀ ▀ ▄ ▀ ▄ ▀ ▄ ▀ ▄ ▀ ▄ ▀ ██ ▀ ▄▀▄▄███
███▀█▀█▀▄▄█  ▀▄   ██ ▄▄▀▄▀ ▀▄▀ ▀▄▀  ▀█▀█ ▄██ ▄██ ▄██ ▄██ ▄██  ▀▀█▀▄█   █   █   █   █   █ ▄█ ██  ▄█▄██
██▀█▀▀▀ ▄ █▄▀ ▄  ▀▀▄ ▀█▀█▀ ▀█▀ ▀█▀  ██ █▀█▄█▀█▄█▀█▄█▀█▄█▀█▄█▀▄█▀███▄█▄ ▄█▄ ▄█▄ ▄█▄ ▄█▄ ▄████▄█▀▄ ▀▄██
██▄▄ ▀█▀▄▄█  ▄▀    █  █▀█▀ ▀█▀ ▀█▀ █▄█▀█ ▀▄█ ▀▄█ ▀▄█ ▀▄█ ▀▄█ █▄▀█▄▀██  ██  ██  ██  ██  ██▄██▄ ▄█▀█▄██
██ ▀▀▀ ▄▄▄ ▄▀▄█  ▀▀▄ █ ▀█▀ ▀█▀ ▀█▀ ▄▄▄ █▀ ▀█▀ ▀█▀ ▀█▀ ▀█▀ ▀█▀▀ ▄▄▄ ▄█▄ ▄█▄ ▄█▄ ▄█▄ ▄█▄ ▄██ ▄▄▄ █  ▄██
██ █ ▀ █▄█ ▀▄█ ▄▄▄▀▀▄ █▀█▀ ▀█▀ ▀██ █▄█ ▀▄ █▀▄ █▀▄ █▀▄ █▀▄ █▀▄▀ █▄█ ██  ██  ██  ██  ██  ██  █▄█ █▀ ▀██
██  ▀▀ ▄▄▄ ██▄█▀ ▀▀▄▄█ ▀█▀ ▀█▀ ▀█▀▄ ▄ ▄ ▄ ▀ ▄ ▀ ▄ ▀ ▄ ▀ ▄ ▀ ▄▄▄   ▄▄█▄ ▄█▄ ▄█▄ ▄█▄ ▄█▄ ▄█▄  ▄▄▄█  ███
██ █ ▀▀▀▄█▀█▀█ ██▄▀▀▀ █▀█▀▄▀█▀▄▀█ ▄▄  ▀▄  █▄  █▄  █▄  █▄  █▄ ▄█▀ ▀███ ███ ███ ███ ███ ████  ▄█▄█▀ ▀██
██  ▀▀ █▄▀▄▀ ▄█ █▀▀▄ █ ▀███▀███▀█ ▄█▀ ██▀ ▀█▀ ▀█▀ ▀█▀ ▀█▀ ▀█▀██▀ ▀█▄█▀█▄█▀█▄█▀█▄█▀█▄█▀█▄██▀ ▄█▄█  ███
██ █ ▀ █▄█▀ ▄█ ▄▀▄▀▄▄ █▀█▄▀▀█▄▀▀█ ▄█  ▀▀▄ █▀▄ █▀▄ █▀▄ █▀▄ █▀▄▄█▀ ▀███▀ ██▀ ██▀ ██▀ ██▀ ███  ▄█▄█▀ ▀██
██  ▀▀▄ ▄█ ▄▄▄█▀█▀▀█▀█ ▀█▀ ▀█▀ ▀██ █▀▄█ ▄ ▀ ▄ ▀ ▄ ▀ ▄ ▀ ▄ ▀ ▄██▀ ▀█▄█▄ ▄█▄ ▄█▄ ▄█▄ ▄█▄ ▄██▀ ▄█▄█  ███
██ █ ▀ ▄▄█▀█ █ █▄▄▀ █ █▄▀▀▄▀█▀▄▀██▀█ █▄ ▄ █ ▄ █ ▄ █ ▄ █ ▄ █ ▄▄██ ▀███ ███ ███ ███ ███ ████  ▄█▄█▀ ▀██
██  ▀█▄ ▄▄ ▀▄▄█ ▀▀▀▄██   ██▀███▀█ ▄█▀▀▄ ▄ ▀ ▄ ▀ ▄ ▀ ▄ ▀ ▄ ▀ ▄██▄█▀█▄█▀█▄█▀█▄█▀█▄█▀█▄█▀█▄██▀ ▄█▄█  ███
██ █▄▀▀█▄▄▄█▀█▄██▄█ █ ▀▄ ▄█▄▀▄█▄▀ ▄█  ▀ ▄ █ ▄ █ ▄ █ ▄ █ ▄ █ ▄▄█▀█▀█▀█▀█▀█▀█▀█▀█▀█▀█▀█▀█▀█ ▄ ▄█▄█▀ ▀██
██▄▄██ █▄█▄▀▄▄  ▀▄▄▄██▀  ██  ██  █ █▀▄█ ▄ ▀ ▄ ▀ ▄ ▀ ▄ ▀ ▄ ▀ ▄██▀ ▀█▀ ▀█▀ ▀█▀ ▀█▀ ▀█▀ ▀█▀  ▄ ▄█▄▀▄▄███
██▀█▄▄  ▄▄▄█▀▄ ██▀▀ ███▄ ▄█▀▄▄█▀▄█▀█ █▄ ▄▄█ ▄▄█ ▄▄█ ▄▄█ ▄▄█ ▄▄██ ▀██ ▀██ ▀██ ▀██ ▀██ ▀██ █  ▄█▄ ▄█▄██
██▀▄▄█ ▄▄█▄▀▄▀▄ ▀▄▀▄█▄   ██▀███▀██ █▀█▄ ▄█▄ ▄█▄ ▄█▄ ▄█▄ ▄█▄ ▄██▄█▀█▄█▀█▄█▀█▄█▀█▄█▀█▄█▀█▄██▀▄ █▄▄ ▀▄██
██ ███  ▄▄▄█▀▀███▄▀ █▄▀▄ ▄█▄▀▄█▄▀█▀█ █▄ ▄▀▄ ▄▀▄ ▄▀▄ ▄▀▄ ▄▀▄ ▄▄▀██▀█▀█▀█▀█▀█▀█▀█▀█▀█▀█▀█▀█ ▄█▀▀▄█▀ ▀██
████▀█ ▄▄▄ ▀▄▀█ ▀ ▀▄█▀█  ██  ██  ▀ ▄▄▄  ▄ ▀ ▄ ▀ ▄ ▀ ▄ ▀ ▄ ▀ ▄▀ ▄▄▄ ▀ ▀█▀ ▀█▀ ▀█▀ ▀█▀ ▀█▀   ▄▄▄ ▀▄ ▀██
██  █  █▄█ █▀████▀▄ █▀█▄ ▄█▄ ▄█▄ ▄ █▄█  ▄▄█ ▄▄█ ▄▄█ ▄▄█ ▄▄█ ▄█ █▄█ ▀ ▀█▀ ▀█▀ ▀█▀ ▀█▀ ▀█▀ ▀ █▄█  ▄▀▄██
██ ██▄▄▄▄ ▄▀▄▀▄ ▀█▀▄█▄▄  ██  ██  █    ▄ ▄█▄ ▄█▄ ▄█▄ ▄█▄ ▄█▄ ▄▀▄▄  ▄▀ ▀█▀ ▀█▀ ▀█▀ ▀█▀ ▀█▀  ▄ ▄▄  ▄█▄██
██  █ █▄▄▄▄▄▀▄█ █ ▄ ▀▄██▄▄█▄ ▄█▄    █ ▄▄ █▄▄ █▄▄ █▄▄ █▄▄ █▄▄ █   ██▀ ▀█▀ ▀█▀ ▀█▀ ▀█▀ ▀█▀ ▀██▄█▀ ▄█▄██
██ ▄█▄██▄ ▄▄█▀▄ ▀█▀█▄▄▄ ▄██  ██  ▄ █▄ ▄█▀█▄█▀█▄█▀█▄█▀█▄█▀█▄█▀█▀▄ ▄▀▀ ▀█▀ ▀█▀ ▀█▀ ▀█▀ ▀█▀ ▀██▄ ▄ ▄█▄██
██  █ █▄▄▄▄ █▄█▄  ▄▄█▄█  ▄▀▄ ▄▀▄   █▄ ▄▀▄█▄▀▄█▄▀▄█▄▀▄█▄▀▄█▄▀▄ ▄  ▀ ▀ ▀ ▀ ▀ ▀ ▀ ▀ ▀ ▀ ▀ ▀ ▀█ ▀ ▄ ▄█▄██
██ ▄█▄██▄ ▄▀█▀▄ ██▀ ▀▄▄ ▄▀   ▀   ▄  ▀ ▄ ▄█▄ ▄█▄ ▄█▄ ▄█▄ ▄█▄ ▄ ▄▄ ▀▄▀ ▄ ▀ ▄ ▀ ▄ ▀ ▄ ▀ ▄ ▀ ▀█ ██  ▄█▄██
██  █ █▄▄▄ ▄█▄█▀▀ ▄▀▀▄█ ▀▀▄▄ ▀▄▄    █ ▄▄ █▄▄ █▄▄ █▄▄ █▄▄ █▄▄  ▄  ██▀  █▀  █▀  █▀  █▀  █▀ ▀█ ▀█▀ ▄█▄██
██ ▄█▄██▄▄▀ ▀▀▄▄▀█▀▄▄▄▄▀▄██  ██  ▄ █▄ ▄█▀█▄█▀█▄█▀█▄█▀█▄█▀█▄█▀ ▄▄ ▄█▀ ▀█▀ ▀█▀ ▀█▀ ▀█▀ ▀█▀ ▀█ ██  ▄█▄██
██  █ █▄▄▄▄█▀▄███ ▄▀ ▄██ ▄▀▄ ▄▀▄  ██▄ ▄█ █▄█ █▄█ █▄█ █▄█ █▄█  ▄  ██▀ ▀ ▀ ▀ ▀ ▀ ▀ ▀ ▀ ▀ ▀ ▀█ ▀█▀ ▄█▄██
██ ▄█ ▄ ▄█▀▄█▀▄▀██▀█▀▄▄▄▄▀   ▀   ▀██▄ ▄█▀█▄█▀█▄█▀█▄█▀█▄█▀█▄█▀ ▄▄ ▄█▀ ▄ ▀ ▄ ▀ ▄ ▀ ▄ ▀ ▄ ▀ ▀█ ██  ▄█▄██
██  █▄█▄▄ ▀█ ▄███ ▄▀ ▄██▀▀ ▀▄▀ ▀▄▀ █▄█ █ █▄█ █▄█ █▄█ █▄█ █▄█  ▄  ███   █   █   █   █   █ ▀█ ▀█▀ ▄█▄██
██▄ █▀ ▄▄▀ ▄█ █▀█▀██▀█▀▄▄▀ ▀█▀ ▀█▄ █▄█▀█▀█▄█▀█▄█▀█▄█▀█▄█▀█▄█▀ ▄▀▄▄█▄█▄ ▄█▄ ▄█▄ ▄█▄ ▄█▄ ▄█▀  ██ ▄ ▀▄██
██▀█▀██▀▄█▄█  ▀██ ▄▀ ▀██▀▀ ▄▀▀ ▄▀ ██▄ ▄█ ▀▄█ ▀▄█ ▀▄█ ▀▄█ ▀▄█  ▄▀███▀█  ▀█  ▀█  ▀█  ▀█  ▀█▄  ▀█▀█▀ ▀██
██▄▄▄▄▄█▄▄ ▄██▄▀█▄▀█▀ ▀▄▄▀   ▀   █ ▄▄▄ █▀ ▀█▀ ▀█▀ ▀█▀ ▀█▀ ▀█▀  ▄▄▄ ▀ ▄ ▀ ▄ ▀ ▄ ▀ ▄ ▀ ▄ ▀ ▄ ▄▄▄ ▀▄▄███
██ ▄▄▄▄▄ █ █  ▀██▄█▀ ▄ █▀▀ ▀▄▀ ▀▄▀ █▄█ █ ▄██ ▄██ ▄██ ▄██ ▄██ ▀ █▄█ █   █   █   █   █   █ ▀ █▄█  ▄█▄██
██ █   █ █▄▄█ █▀█▀ █▀▀▀▄▄▀ ▀█▀ ▀██▄ ▄▄▄█▀█▄█▀█▄█▀█▄█▀█▄█▀█▄█▀ ▄▄ ▄ ▄█▄ ▄█▄ ▄█▄ ▄█▄ ▄█▄ ▄██▄▄  ▄▄ ▀▄██
██ █▄▄▄█ █ █ ▀ ██ █▀ ▀ █▀▀ ▀█▀ ▀██▄ ▄▀▄█ ▀▄█ ▀▄█ ▀▄█ ▀▄█ ▀▄█ ▀█▄█  ██  ██  ██  ██  ██  ██▀▄█  ▀█▀▀ ██
██▄▄▄▄▄▄▄█▄▄██▄██▄███▄▄▄▄█▄███▄███▄▄▄▄███▄███▄███▄███▄███▄████▄██▄▄▄█▄▄▄█▄▄▄█▄▄▄█▄▄▄█▄▄▄█▄███▄██▄█▄██
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
`.replace('\n', '')
  );
});

should('Penalty', () => {
  // python-qrcode
  const VECTORS = [
    [179, 141, 120, 0],
    [204, 195, 240, 0],
    [239, 186, 200, 0],
    [205, 207, 200, 0],
    [210, 192, 240, 0],
    [225, 192, 120, 0],
    [230, 210, 160, 0],
    [207, 189, 160, 0],
  ];
  const data = new Uint8Array([
    32, 9, 64, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 203, 10, 29,
    40, 162, 45, 18,
  ]);
  const sum = (arr) => arr.reduce((acc, i) => acc + i, 0);
  for (let i = 0; i < 8; i++) {
    const v1 = _tests.drawQR(1, 'low', data, i, true);
    deepStrictEqual(_tests.penalty(v1), sum(VECTORS[i]));
  }
});

should('Penalty 2', () => {
  // python-qrcode
  const VECTORS = [
    [289, 312, 80, 0],
    [296, 282, 80, 0],
    [317, 375, 160, 0],
    [260, 282, 120, 0],
    [305, 330, 40, 0],
    [316, 372, 200, 0],
    [321, 339, 200, 0],
    [334, 360, 200, 0],
  ];
  const data = new Uint8Array([
    66, 2, 62, 251, 136, 254, 40, 58, 63, 9, 250, 121, 206, 40, 8, 222, 41, 152, 46, 251, 136, 255,
    9, 248, 248, 239, 9, 249, 72, 223, 9, 249, 75, 176, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17,
    93, 67, 254, 208, 178, 18, 210, 239, 140, 226, 100, 85, 65, 59, 208, 9, 226, 139, 169, 216, 140,
    15, 245, 233, 57, 239,
  ]);
  const sum = (arr) => arr.reduce((acc, i) => acc + i, 0);
  for (let i = 0; i < 8; i++) {
    const v1 = _tests.drawQR(3, 'medium', data, i, true);
    deepStrictEqual(_tests.penalty(v1), sum(VECTORS[i]));
  }
});

should('Penalty 3', () => {
  // python-qrcode
  const VECTORS = [
    [251, 261, 240, 0],
    [232, 255, 240, 0],
    [297, 330, 120, 0],
    [268, 249, 200, 0],
    [244, 279, 200, 0],
    [263, 267, 160, 0],
    [270, 258, 200, 0],
    [261, 252, 240, 0],
  ];
  const data = new Uint8Array([
    17, 32, 12, 86, 106, 110, 20, 234, 141, 247, 161, 237, 200, 197, 64, 197, 102, 166, 225, 78,
    168, 223, 122, 30, 220, 140, 84, 12, 86, 106, 110, 20, 0, 236, 180, 231, 14, 109, 128, 232, 17,
    242, 86, 28,
  ]);
  const sum = (arr) => arr.reduce((acc, i) => acc + i, 0);
  for (let i = 0; i < 8; i++) {
    const v1 = _tests.drawQR(2, 'low', data, i, true);
    deepStrictEqual(_tests.penalty(v1), sum(VECTORS[i]));
  }
});

should('Full API test', () => {
  const q = createQR('#️⃣🧜‍♂️🏎🔍🔻', 'ascii');
  const exp = `
█████████████████████████████████
██ ▄▄▄▄▄ █▄██▀█▀▀▄ ▀   █ ▄▄▄▄▄ ██
██ █   █ █▄█ ▀██ ▄▄██▀▀█ █   █ ██
██ █▄▄▄█ █▀▀ █ ▄▄ █▀  ▄█ █▄▄▄█ ██
██▄▄▄▄▄▄▄█▄█▄█ █ ▀ ▀▄█▄█▄▄▄▄▄▄▄██
██▄▀▄█▀▀▄ ██▄▀▄  ███▀ ▀██▄▀▀ █▄██
██▀ ▀ ▀▄▄█▄██▄█▀█▄█ ▄▀▀▄▄▄█▀▀▄███
██  █▀  ▄▀▄▄█ ▄▄█▄   █▄▄█ ▀▄█ ▀██
██▀█ ▀ ▀▄  ▄▀ █▄ ▀ ▀▀█▄▀█  ▄▀ ▀██
███▀▀▀ ▄▄██▄▀█▄  █▄▄ ▀██▀█ ▄▄█▀██
██▄▄█▄ ▄▄█▄▄█▄▀▀█ █ █▀▀▄ ▀██▀▀▀██
██▄▄▄▄▄█▄▄ ▄ ▀ ▄█▀█ ▄█ ▄▄▄ ▄█▄ ██
██ ▄▄▄▄▄ █▄▀ ▀▀▄ █  ▀▀ █▄█ ▀▀▄▄██
██ █   █ ██▀ ▀█▄ ▄██▀█ ▄ ▄ ██▄ ██
██ █▄▄▄█ █▄▄▀▄  ▀▀▀ ▄▄▄█  ▀▄ ▄▄██
██▄▄▄▄▄▄▄█▄▄▄▄█▄███▄▄▄██▄███▄█▄██
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
`.replace('\n', '');
  deepStrictEqual(q, exp);
});
// 170 mb of tests
for (let i = 0; i < TEST_CASES.length; i++) {
  const v = TEST_CASES[i];
  const { text: input, out: output, ecc } = v;
  const opt = { ecc };
  should(`small test(${i})`, () => {
    const q = createQR(input, 'ascii', opt);
    deepStrictEqual(q, output);
  });
}

should('Full API test url', () => {
  const q = createQR('https://www.youtube.com/watch?v=eBGIQ7ZuuiU', 'ascii');
  console.log(q);
  const exp = `
█████████████████████████████████████
██ ▄▄▄▄▄ █  ▀▄▄█ ██▀▄▄▄▄█ ▀█ ▄▄▄▄▄ ██
██ █   █ █▀▄▀▄ ▄▄█▄█ ██▀█▀▀█ █   █ ██
██ █▄▄▄█ ██ ▄▄█▄▀▀ ▀ ██ ▄ ▄█ █▄▄▄█ ██
██▄▄▄▄▄▄▄█ ▀ ▀ █▄▀ ▀ ▀▄█ █ █▄▄▄▄▄▄▄██
██ █  ▀ ▄▄▀▀▀ █▀ ▄   ▀▀▄▀ ▄█ ▀█ ▀▄▄██
██▀▀▀  ▀▄▄██▄▀▀▄█▀ ▀▄█    ▀▀▀ ▄ █▄▄██
█████▄▀▀▄▄██ ▀ ▀ ▄▄██▄ ▄▄ ▄ █▀█ █ ███
███   ▄▀▄█▄▄▄█   ▀██▄▄▄▀▀█▄▀ ▄█▀ ████
██▀▀ ▄ ▀▄ ▄▄██▀▄▀▀████▄▄▄ █▄ █  █▀▀██
██▀▀▄ ▄▀▄ ▀▀█▄▀▀▄▄▀▀ █▄▄▀█▀ ▀▄ █▄ ▀██
██▀▄▀██ ▄▄ ▀█▄█▀ ▀ ▀█▄▀▀ █▄▀▀ █  █ ██
███▀█▄▀▄▄ █  █ ██ ██ ▄ █ ▄▄▄ ▄▀▀▄▄ ██
██▄█▄▄▄█▄█ ▄ ▄▀█▀▀ ▄▀ █▀ ▄ ▄▄▄ ▀▄▀▄██
██ ▄▄▄▄▄ █ ▄█▄▀▀ ▀█   █▄█  █▄█ ▀▀▄▀██
██ █   █ █▀ ▄▀█ ██ ▄▄▀██   ▄▄ ▄█   ██
██ █▄▄▄█ █▄  ██▀ ▄▄ ▀█ ▄      ▀▄▄█▀██
██▄▄▄▄▄▄▄█▄███▄█▄█▄▄▄▄█▄█▄████▄▄█████
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
`.replace('\n', '');
  deepStrictEqual(q, exp);
});

// ESM is broken.
import url from 'url';
if (import.meta.url === url.pathToFileURL(process.argv[1]).href) {
  should.run();
}
