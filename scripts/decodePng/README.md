
# PNG to Rust Types Converter

This tool converts 19x25 pixel PNG images into a Rust types format, specifically designed for representing pixel data in a structured manner. The output is formatted as Rust arrays, making it easy to integrate into Rust projects.

## Requirements

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

## Setup

1. Clone or download this repository to your local machine.
2. Navigate to the project directory in your terminal.
3. Install the required dependencies:
   ```bash
   npm install
   ```
   or if you use yarn:
   ```bash
   yarn install
   ```

## Usage

1. Place your 19x25 pixel PNG image in the `./scripts/decodePng/images/` directory.
2. Open the TypeScript script and update the `fileName` variable with the name of your image file (without the `.png` extension).
   ```typescript
   const fileName = 'your-image-file-name';
   ```
3. Run the script using the following command:
   ```bash
   npm run decodePng
   ```

4. The script will read the specified PNG image, convert it to the Rust types format, and save the output in the `./scripts/decodePng/outputs/` directory with the same name as the input file but with a `.rs` extension.

5. Check the `./scripts/decodePng/outputs/` directory for the resulting `.rs` file. The console will also confirm the completion of the conversion process.

## Notes

- Ensure your PNG images are exactly 19x25 pixels to match the expected format (or modify the script before executing)
- The output Rust array represents pixel data in `(R, G, B)` tuples, where each value is zero-padded to three digits for readability.
