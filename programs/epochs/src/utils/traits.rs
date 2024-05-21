use anchor_lang::{prelude::*, solana_program::keccak};

use crate::{
    clothes::SHIRT_GROUP, colors::GREEN_SCREEN, constants::bodies::BODY_GROUP, glasses::LENS_GROUP,
    hats::HEAD_GROUP,
};

type Pixel = (u8, u8, u8);
type Epoch = [[Pixel; 32]; 32];
type SelectTraitsArgs = (u64, Pubkey, u32, u32, u32, u32);
type SelectTraitsResults = (usize, usize, usize, usize, Pixel);

#[inline(never)]
fn select_traits(args: SelectTraitsArgs) -> SelectTraitsResults {
    let (epoch, signer, num_items_hat, num_items_clothes, num_items_glasses, num_items_body) = args;
    let mut hasher = keccak::Hasher::default();

    hasher.hash(&epoch.to_le_bytes());
    hasher.hash(&signer.to_bytes());

    let hash_bytes = hasher.result().to_bytes();
    let hat_index = u32::from_le_bytes(hash_bytes[0..4].try_into().unwrap()) % num_items_hat;
    let clothes_index =
        u32::from_le_bytes(hash_bytes[4..8].try_into().unwrap()) % num_items_clothes;
    let glasses_index =
        u32::from_le_bytes(hash_bytes[8..12].try_into().unwrap()) % num_items_glasses;
    let body_index: u32 =
        u32::from_le_bytes(hash_bytes[12..16].try_into().unwrap()) % num_items_body;
    let background: Pixel = (34 as u8, 34 as u8, 34 as u8);
    (
        hat_index as usize,
        clothes_index as usize,
        glasses_index as usize,
        body_index as usize,
        background,
    )
}

#[inline(never)]
fn merge_layers(top_layer: &Epoch, bottom_layer: &mut Epoch) {
    for (y, row) in top_layer.iter().enumerate() {
        for (x, &pixel) in row.iter().enumerate() {
            // If the pixel from the top layer is not (0,0,0), overwrite the corresponding pixel in the bottom layer.
            if pixel != GREEN_SCREEN {
                bottom_layer[y][x] = pixel;
            }
        }
    }
}

#[inline(never)]
fn create_epoch(hat: &Epoch, clothes: &Epoch, glasses: &Epoch, body: Box<Epoch>) -> Box<Epoch> {
    let mut epoch = *body; // Dereference the box to access the Epoch instance.
    merge_layers(clothes, &mut epoch);
    merge_layers(hat, &mut epoch);
    merge_layers(glasses, &mut epoch);
    Box::new(epoch) // Return a new Box containing the modified Epoch.
}

#[inline(never)]
fn create_color_bmp_buffer(pattern: &Epoch) -> Vec<u8> {
    let new_width = 32; // Width is defined by the Epoch size
    let new_height = 32; // Height is also defined by the Epoch size
    let row_padding = (4 - (new_width * 3 % 4)) % 4; // Padding for alignment
    let file_size = 54 + ((3 * new_width + row_padding) * new_height); // Total file size

    let mut buffer = Vec::with_capacity(file_size as usize);

    // BMP Header
    let header = [
        b'B', b'M', // Signature
        0, 0, 0, 0, // Placeholder for file size, to be updated
        0, 0, 0, 0, // Reserved
        54, 0, 0, 0, // Data offset
    ];
    buffer.extend_from_slice(&header);

    // DIB Header
    #[rustfmt::skip]
    let dib_header = [
        40, 0, 0, 0, // Header size
        new_width as u8, 0, 0, 0, // Width
        new_height as u8, 0, 0, 0, // Height
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
    for row in pattern.iter().rev() {
        // Add the original pattern's pixels
        for &pixel in row.iter() {
            let bgr_pixel = [pixel.2, pixel.1, pixel.0]; // Assuming Pixel is a tuple struct (R, G, B)
            buffer.extend_from_slice(&bgr_pixel);
        }

        // Add padding for each row to align to a 4-byte boundary
        buffer.extend(vec![0; row_padding]);
    }

    // Update the file size in the BMP header after buffer construction
    let file_size = buffer.len() as u32;
    buffer[2] = file_size as u8;
    buffer[3] = (file_size >> 8) as u8;
    buffer[4] = (file_size >> 16) as u8;
    buffer[5] = (file_size >> 24) as u8;

    buffer
}

#[inline(never)]
fn replace_pixels(pattern: &mut Epoch, pixel_to_replace: Pixel, replacement_pixel: Pixel) {
    for row in pattern.iter_mut() {
        for pixel in row.iter_mut() {
            if *pixel == pixel_to_replace {
                *pixel = replacement_pixel;
            }
        }
    }
}

#[inline(never)]
fn _apply_shadow(pixel: Pixel, shadow_intensity: i16) -> Pixel {
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

#[inline(never)]
pub fn generate_asset(current_epoch: u64, user: Pubkey) -> (Vec<u8>, SelectTraitsResults) {
    let (hat_index, clothes_index, glasses_index, body_index, background) = select_traits((
        current_epoch,
        user, // interesting Pubkey::new_unique(),
        HEAD_GROUP.len() as u32,
        SHIRT_GROUP.len() as u32,
        LENS_GROUP.len() as u32,
        BODY_GROUP.len() as u32,
    ));

    let mut epoch = create_epoch(
        &HEAD_GROUP[hat_index],
        &SHIRT_GROUP[clothes_index],
        &LENS_GROUP[glasses_index],
        Box::new(BODY_GROUP[body_index]),
    );
    replace_pixels(&mut epoch, GREEN_SCREEN, background);
    let bmp_buffer = create_color_bmp_buffer(&epoch);
    (
        bmp_buffer,
        (
            hat_index,
            clothes_index,
            glasses_index,
            body_index,
            background,
        ),
    )
}
