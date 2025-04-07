import './style.css';
// Import from the linked local library
// Revert to using main package entry point, assuming exports are now correct
import { encode2LQR, Bitmap } from '../dist/dual/encoder.js';
import type { Encode2LQROptions, PatternMap } from 'qr2';

// --- DOM Element References ---
const publicDataInput = document.getElementById('public-data') as HTMLTextAreaElement;
const privateDataInput = document.getElementById('private-data') as HTMLTextAreaElement;
const privateKeyInput = document.getElementById('private-key') as HTMLInputElement;
const generateButton = document.getElementById('generate-button') as HTMLButtonElement;
const qrCodeContainer = document.getElementById('qr-code-container') as HTMLDivElement;
const debugInfoContainer = document.getElementById('debug-info') as HTMLDivElement;
const tabsContainer = document.querySelector('.tabs') as HTMLDivElement;

// Debug content areas
const paramsContent = document.getElementById('params-content')?.querySelector('pre') as HTMLPreElement;
const patternsContent = document.getElementById('patterns-content')?.querySelector('pre') as HTMLPreElement;
const timingContent = document.getElementById('timing-content')?.querySelector('pre') as HTMLPreElement;
const errorsContent = document.getElementById('errors-content')?.querySelector('pre') as HTMLPreElement;

// --- Tab Switching Logic ---
tabsContainer.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  if (!target.classList.contains('tab-button')) return;

  const tabName = target.dataset.tab;
  if (!tabName) return;

  // Update button active state
  tabsContainer.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
  target.classList.add('active');

  // Update content active state
  debugInfoContainer.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  const activeContent = document.getElementById(`${tabName}-content`);
  if (activeContent) {
    activeContent.classList.add('active');
  }
});

// Function to activate a specific tab
function showTab(tabName: 'params' | 'patterns' | 'timing' | 'errors') {
   const button = tabsContainer.querySelector(`.tab-button[data-tab="${tabName}"]`);
   if (button) {
       button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
   }
}

// --- QR Code Generation Logic ---
generateButton.addEventListener('click', async () => {
  const publicData = publicDataInput.value;
  const privateData = privateDataInput.value;
  const privateKey = privateKeyInput.value;

  // Clear previous results and errors
  qrCodeContainer.innerHTML = '';
  paramsContent.textContent = 'Generating...';
  patternsContent.textContent = 'Generating...';
  timingContent.textContent = 'Generating...';
  errorsContent.textContent = 'No errors yet.';
  showTab('params'); // Show params tab initially

  const startTime = performance.now();

  try {
    const opts: Encode2LQROptions = {
      privateData: privateData,
      privateKey: privateKey,
      // Add other options if needed, e.g., ecc: 'medium'
    };

    // Call the encode function from the linked library
    const result = await encode2LQR(publicData, opts);
    const endTime = performance.now();

    // --- Render QR Code ---
    // We need the actual Bitmap instance from the result to call toSVG
    // Assuming the result structure is { bitmap: Bitmap, patternMap: PatternMap, version: number, mask: number }
    // We need to ensure 'qr2' exports Bitmap or provides a way to render
    if (result.bitmap && typeof (result.bitmap as any).toSVG === 'function') {
       // Need to cast bitmap to access methods if it's not directly typed as Bitmap instance
       const bitmapInstance = result.bitmap as Bitmap;
       const svgString = bitmapInstance.toSVG(result.patternMap);
       qrCodeContainer.innerHTML = svgString;

       // Adjust SVG size for display
       const svgElement = qrCodeContainer.querySelector('svg');
       if (svgElement) {
           svgElement.style.width = '300px'; // Example size
           svgElement.style.height = '300px';
           svgElement.style.imageRendering = 'pixelated'; // Keep pixels sharp
       }
    } else {
        throw new Error("Encoding result did not contain a renderable Bitmap instance.");
    }


    // --- Display Debug Info ---
    paramsContent.textContent = `Version: ${result.version}\nMask: ${result.mask}\nECC Level: ${opts.ecc || 'medium'} (Assumed)`; // Adjust if ECC is returned

    // Simple pattern map summary
    let patternSummary = `Dimensions: ${result.patternMap.length}x${result.patternMap[0]?.length || 0}\n`;
    let patternCount = 0;
    // Add explicit types for row and cell
    result.patternMap.forEach((row: (number | undefined)[]) => {
        row.forEach((cell: number | undefined) => {
            if (cell !== undefined) patternCount++;
        });
    });
    patternSummary += `Patterns placed: ${patternCount}`;
    patternsContent.textContent = patternSummary;

    timingContent.textContent = `Encoding Time: ${(endTime - startTime).toFixed(2)} ms`;
    errorsContent.textContent = 'Encoding successful.'; // Clear previous errors

  } catch (error) {
    const endTime = performance.now();
    console.error("Encoding failed:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    errorsContent.textContent = `Encoding Failed:\n${errorMessage}`;
    timingContent.textContent = `Attempt Time: ${(endTime - startTime).toFixed(2)} ms`;
    paramsContent.textContent = 'Failed';
    patternsContent.textContent = 'Failed';
    showTab('errors'); // Show errors tab on failure
  }
});

// Initial message
paramsContent.textContent = 'Enter data and click "Generate".';
patternsContent.textContent = '';
timingContent.textContent = '';
errorsContent.textContent = '';
