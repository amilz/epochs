use anchor_lang::solana_program::msg;

type Pixel = (u8, u8, u8); // Represents a color in RGB format

pub fn merge_layers(top_layer: Epoch, bottom_layer: Epoch) -> Epoch {
    let mut merged_layer = [[(0, 0, 0); 19]; 25];
    
    for (y, row) in top_layer.iter().enumerate() {
        for (x, &pixel) in row.iter().enumerate() {
            // If the pixel from the top layer is not (0,0,0), use it, otherwise use the pixel from the bottom layer.
            merged_layer[y][x] = if pixel != (000, 000, 000) { pixel } else { bottom_layer[y][x] };
        }
    }

    merged_layer
}

pub fn merge_layers2(top_layer: &Epoch, bottom_layer: &mut Epoch) {
    for (y, row) in top_layer.iter().enumerate() {
        for (x, &pixel) in row.iter().enumerate() {
            // If the pixel from the top layer is not (0,0,0), overwrite the corresponding pixel in the bottom layer.
            if pixel != (0, 0, 0) {
                bottom_layer[y][x] = pixel;
            }
        }
    }
}


type Epoch = [[Pixel; 19]; 25]; // 19W x 25H

pub fn create_buffer(pattern: Epoch) -> Vec<u8> {
    let new_width = 19; // New width with added background columns
    let new_height = 25; // New height with added background rows
    let row_padding = (4 - (new_width * 3 % 4)) % 4; // Adjusted for new width
    let file_size = 54 + ((3 * new_width + row_padding) * new_height); // Adjusted for new dimensions

    let mut buffer = Vec::with_capacity(file_size as usize);

    // BMP Header
    let header = [
        b'B', b'M', // Signature
        file_size as u8, (file_size >> 8) as u8, 
        (file_size >> 16) as u8, (file_size >> 24) as u8, // File size
        0, 0, 0, 0, // Reserved
        54, 0, 0, 0, // Data offset
    ];
    buffer.extend_from_slice(&header);

    // DIB Header - adjust width and height values
    let dib_header = [
        40, 0, 0, 0, // DIB Header size
        new_width as u8, 0, 0, 0, // Adjusted width
        new_height as u8, 0, 0, 0, // Adjusted height
        1, 0, // Color planes
        24, 0, // Bits per pixel
        0, 0, 0, 0, // Compression
        0, 0, 0, 0, // Image size (0 for uncompressed)
        0, 0, 0, 0, // X pixels per meter
        0, 0, 0, 0, // Y pixels per meter
        0, 0, 0, 0, // Total colors
        0, 0, 0, 0, // Important colors
    ];
    buffer.extend_from_slice(&dib_header);

    // Pixel Data

    // Add the original pattern with 5 columns of background_color to the left and right
    for row in pattern.iter().rev() {

        // Add the original pattern's pixels
        for &pixel in row.iter() {
            let bgr_pixel = [pixel.2, pixel.1, pixel.0];
            buffer.extend_from_slice(&bgr_pixel);
        }

        buffer.extend(vec![0; row_padding]);
    }


    buffer
}
