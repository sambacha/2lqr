// Example usage of the 2LQR encoder

import * as fs from 'fs/promises';
import * as path from 'path';
import { encode2LQR } from '../src/dual/encoder.js';
import { Bitmap } from '../src/index.js'; // Import Bitmap for output

async function runExample() {
    const publicData = "Public URL: https://example.com";
    const privateData = "Secret message: The meeting is at dawn!";
    const privateKey = "correct horse battery staple"; // Secret key

    console.log("Encoding 2LQR Code...");
    console.log("Public Data:", publicData);
    console.log("Private Data:", privateData);

    try {
        // Encode the 2LQR code
        const { bitmap, patternMap, version, mask } = await encode2LQR(publicData, {
            privateData: privateData,
            privateKey: privateKey,
            ecc: 'medium', // Standard QR ECC level
            // version: 10, // Optionally force a version
            // privateEccWords: 30 // Optionally specify private ECC words
        });

        console.log(`Generated 2LQR: Version ${version}, Mask ${mask}`);
        console.log(`Bitmap Size: ${bitmap.width}x${bitmap.height}`);

        // Add border and generate SVG output
        const borderSize = 4; // Standard QR border
        const borderedBitmap = bitmap.border(borderSize, false);

        // Create bordered pattern map
        const borderedPatternMap: (number | undefined)[][] = Array.from(
            { length: borderedBitmap.height },
            () => new Array(borderedBitmap.width).fill(undefined)
        );
        for (let y = 0; y < bitmap.height; y++) {
            for (let x = 0; x < bitmap.width; x++) {
                 borderedPatternMap[y + borderSize][x + borderSize] = patternMap[y][x];
            }
        }

        const svgString = borderedBitmap.toSVG(borderedPatternMap);

        // Save SVG to file
        // Use import.meta.url for ES module equivalent of __dirname
        const currentDir = path.dirname(new URL(import.meta.url).pathname);
        const outputDir = path.join(currentDir, 'output');
        await fs.mkdir(outputDir, { recursive: true });
        const outputPath = path.join(outputDir, '2lqr_example.svg');
        await fs.writeFile(outputPath, svgString);

        console.log(`Successfully generated 2LQR SVG: ${outputPath}`);

        // Optional: Generate GIF (requires scale)
        // const scale = 5;
        // const gifBuffer = borderedBitmap.toGIF(borderedPatternMap, scale);
        // const gifPath = path.join(outputDir, '2lqr_example.gif');
        // await fs.writeFile(gifPath, gifBuffer);
        // console.log(`Successfully generated 2LQR GIF: ${gifPath}`);


    } catch (error) {
        console.error("Error generating 2LQR code:", error);
    }
}

runExample();
