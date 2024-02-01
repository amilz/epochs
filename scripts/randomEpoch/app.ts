import * as fs from 'fs';

// Function to convert the image to the Rust types format
function createRandomEpoch(numEpochs: number): string {

    const width = 19;
    const height = 25;
    let final = '';
    for (let i = 0; i < numEpochs; i++) {
        let output = `const EPOCH${(i+1).toString()} : Epoch = [\n`;
        for (let y = 0; y < height; y++) {
            output += '    [';
            for (let x = 0; x < width; x++) {
                const r = Math.floor(Math.random() * 256).toString().padStart(3, '0');
                const g = Math.floor(Math.random() * 256).toString().padStart(3, '0');
                const b = Math.floor(Math.random() * 256).toString().padStart(3, '0');
                const idx = (width * y + x) << 2; // Multiply by 4 for each RGBA value
                output += `(${r}, ${g}, ${b}), `;
            }
            output = output.slice(0, -2); // Remove the last comma and space
            output += '],\n';
        }
        output += '];\n\n';
        final += output;

    }
    return final;
}

const fileName = 'randomEpochs'

// Convert and save the output
const rustTypesOutput = createRandomEpoch(20);
fs.writeFileSync(`./outputs/${fileName}.rs`, rustTypesOutput);
console.log('Random dude created.');
