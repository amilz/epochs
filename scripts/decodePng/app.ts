import { PNG } from 'pngjs';
import * as fs from 'fs';

// Function to convert the image to the Rust types format
function convertImageToRustTypes(filePath: string): string {
    const png = PNG.sync.read(fs.readFileSync(filePath));
    const { width, height } = png;

    let output = 'const EPOCH: Epoch = [\n';
    for (let y = 0; y < height; y++) {
        output += '    [';
        for (let x = 0; x < width; x++) {
            const idx = (width * y + x) << 2; // Multiply by 4 for each RGBA value
            const r = png.data[idx].toString().padStart(3, '0');
            const g = png.data[idx + 1].toString().padStart(3, '0');
            const b = png.data[idx + 2].toString().padStart(3, '0');
            output += `(${r}, ${g}, ${b}), `;
        }
        output = output.slice(0, -2); // Remove the last comma and space
        output += '],\n';
    }
    output += '];\n';
    return output;
}

const fileName = 'epochs-skin-duck-sm'

// Path to your PNG file
const filePath = `./scripts/decodePng/images/${fileName}.png`;

// Convert and save the output
const rustTypesOutput = convertImageToRustTypes(filePath);
fs.writeFileSync(`./scripts/decodePng/outputs/${fileName}.rs`, rustTypesOutput);
console.log('Conversion completed. Check robot.rs for the result.');
