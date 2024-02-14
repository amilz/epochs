use anchor_lang::{prelude::*, solana_program::keccak};

const MERGE_COLOR: Pixel = (255, 000, 246);

type SelectTraitsArgs = (u64, Pubkey, u32, u32, u32, u32);
type SelectTraitsResults = (usize, usize, usize, usize, Pixel);

#[inline(never)]
pub fn select_traits(args: SelectTraitsArgs) -> SelectTraitsResults {
    let (epoch, signer, num_items_hat, num_items_clothes, num_items_glasses, num_items_body) = args;
    let mut hasher = keccak::Hasher::default();

    hasher.hash(&epoch.to_le_bytes());
    hasher.hash(&signer.to_bytes());

    let hash_bytes = hasher.result().to_bytes();
    let hat_index = u32::from_le_bytes(hash_bytes[0..4].try_into().unwrap()) % num_items_hat;
    let clothes_index = u32::from_le_bytes(hash_bytes[4..8].try_into().unwrap()) % num_items_clothes;
    let glasses_index = u32::from_le_bytes(hash_bytes[8..12].try_into().unwrap()) % num_items_glasses;
    let body_index: u32 = u32::from_le_bytes(hash_bytes[12..16].try_into().unwrap()) % num_items_body;
    let r_index: u32 = u32::from_le_bytes(hash_bytes[16..20].try_into().unwrap()) % 256;
    let g_index = u32::from_le_bytes(hash_bytes[20..24].try_into().unwrap()) % 256;
    let b_index = u32::from_le_bytes(hash_bytes[24..28].try_into().unwrap()) % 256;
    let background: Pixel = (r_index as u8, g_index as u8, b_index as u8);
    (hat_index as usize, clothes_index as usize, glasses_index as usize, body_index as usize, background)
}

#[inline(never)]
fn merge_layers(top_layer: &Epoch, bottom_layer: &mut Epoch) {
    for (y, row) in top_layer.iter().enumerate() {
        for (x, &pixel) in row.iter().enumerate() {
            // If the pixel from the top layer is not (0,0,0), overwrite the corresponding pixel in the bottom layer.
            if pixel != MERGE_COLOR {
                bottom_layer[y][x] = pixel;
            }
        }
    }
}

#[inline(never)]
pub fn create_epoch(hat: &Epoch, clothes: &Epoch, glasses: &Epoch, body: Epoch) -> Epoch {
    let mut epoch = body; 
    merge_layers(hat, &mut epoch);
    merge_layers(clothes, &mut epoch);
    merge_layers(glasses, &mut epoch);
    msg!("Epoch created");
    epoch
}

#[inline(never)]
pub fn create_color_bmp_buffer(pattern: Epoch, background_color: Pixel) -> Vec<u8> {
    let new_width = 32; // New width with added background columns
    let new_height = 32; // New height with added background rows
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

#[inline(never)]
pub fn replace_pixels(pattern: &mut Epoch, pixel_to_replace: Pixel, replacement_pixel: Pixel) {
    for row in pattern.iter_mut() {
        for pixel in row.iter_mut() {
            if *pixel == pixel_to_replace {
                *pixel = replacement_pixel;
            }
        }
    }
}

#[inline(never)]
pub fn apply_shadow(pixel: Pixel, shadow_intensity: i16) -> Pixel {
    let apply_light_change = |color_value: u8, change: i16| -> u8 {
        // Ensure that we don't underflow or overflow the color values
        let new_value = i16::from(color_value) + change;
        new_value.clamp(0, 255) as u8
    };

    let (r, g, b) = pixel;

    // For a simple shadow, we could just subtract a fixed amount from each color component
    // If you want to add a specific color tint to the shadow, adjust these values
    let shadow_r = shadow_intensity; // Example: 20
    let shadow_g = shadow_intensity; // Example: 20
    let shadow_b = shadow_intensity; // Example: 40 for a cooler shadow

    (
        apply_light_change(r, -shadow_r),
        apply_light_change(g, -shadow_g),
        apply_light_change(b, -shadow_b),
    )
}

// Example usage:
// let pixel = (200, 150, 100);
// let shadowed_pixel = apply_shadow(pixel, 20);


 type Pixel = (u8, u8, u8); // Represents a color in RGB format


// Define the Epoch type to be composed of Head, Face, and Body.
 type Epoch = [[Pixel; 32]; 32]; // 19W x 25H




