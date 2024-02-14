import { PNG } from 'pngjs';
import * as fs from 'fs';
import * as path from 'path';

interface CategoryData {
    outputs: string;
    names: string[];
}



// Function to convert the image to the Rust types format
function convertImageToRustTypes(filePath: string, name: string): string {
    const png = PNG.sync.read(fs.readFileSync(filePath));
    const { width, height } = png;

    let output = `const ${name.toUpperCase()}: Epoch = [\n`;
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

// Directory containing the PNG files
const directoryPath = './scripts/decodePng/nouns/images/';
// Temporary structure to store the conversion outputs and constant names grouped by category
const categories: Record<string, CategoryData> = {};

// Loop through all PNG files in the directory
fs.readdirSync(directoryPath).forEach(file => {
    if (path.extname(file) === '.png') {
        // Extract category and name from the file name
        const [category, name] = file.replace('.png', '').split('-');

        // Generate the constant name
        const constName = name.toUpperCase();

        // Convert the image to Rust types format
        const filePath = path.join(directoryPath, file);
        const rustTypesOutput = convertImageToRustTypes(filePath, name);

        // Initialize the category if not already present
        if (!categories[category]) {
            categories[category] = { outputs: '', names: [] };
        }

        // Append the output and the constant name
        categories[category].outputs += rustTypesOutput + '\n';
        categories[category].names.push(constName);
    }
});

// Write the output for each category to a corresponding .rs file
Object.entries(categories).forEach(([category, data]: [string, CategoryData]) => {
    const { outputs, names } = data;
    // Generate the array definition line
    const arrayDefinition = `pub const ${category.toUpperCase()}_GROUP: [Epoch; ${names.length}] = [${names.join(', ')}];\n`;

    // Append the array definition to the outputs
    const finalOutput = outputs + arrayDefinition;

    const outputPath = `./scripts/decodePng/nouns/outputs/${category}.rs`;
    fs.writeFileSync(outputPath, finalOutput);
    console.log(`Conversion completed for ${category}. Check ${outputPath} for the result.`);
});

