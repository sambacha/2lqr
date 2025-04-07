// Geometric definitions for the 8 textured patterns
// Based on SPEC.md section 8.1

export interface PatternDefinition {
    id: number; // 1-8
    name: string;
    // Function to draw the pattern onto a context (e.g., SVG string builder, pixel buffer)
    // Assumes a 1x1 coordinate system for the module, origin at top-left.
    draw: (ctx: any, x: number, y: number, size: number) => void;
}

// Placeholder draw functions - these will be implemented properly in renderer.ts
const placeholderDraw = (_ctx: any, _x: number, _y: number, _size: number) => { /* Implementation in renderer */ };

export const PATTERN_DEFINITIONS: PatternDefinition[] = [
    { id: 1, name: "Square Center", draw: placeholderDraw },
    { id: 2, name: "Circle Center", draw: placeholderDraw },
    { id: 3, name: "Diagonal Cross", draw: placeholderDraw },
    { id: 4, name: "Horizontal Bar", draw: placeholderDraw },
    { id: 5, name: "Vertical Bar", draw: placeholderDraw },
    { id: 6, name: "Corner Dots", draw: placeholderDraw },
    { id: 7, name: "Checkered", draw: placeholderDraw },
    { id: 8, name: "Border Frame", draw: placeholderDraw },
];

// Map pattern index (0-7) to definition (id 1-8)
export function getPatternDefinition(index: number): PatternDefinition | undefined {
    if (index < 0 || index > 7) return undefined;
    return PATTERN_DEFINITIONS[index]; // index 0 maps to id 1, etc.
}
