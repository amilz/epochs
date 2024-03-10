use anchor_lang::{
    prelude::*,
    solana_program::{instruction::Instruction, program::invoke_signed, system_program},
};
use nifty_asset::{
    extensions::{AttributesBuilder, ExtensionBuilder},
    instructions::{AllocateBuilder, CreateBuilder},
    types::{ExtensionInput, ExtensionType, Standard},
};

use crate::generate_asset;

type Pixel = (u8, u8, u8);
type SelectTraitsResults = (usize, usize, usize, usize, Pixel);

pub fn write_attributes(
    asset: Pubkey,
    payer: Pubkey,
    account_infos: &[AccountInfo],
    signer_seeds: &[&[&[u8]]; 1],
    traits: SelectTraitsResults,
) -> Result<()> {
    let mut attributes_builder = AttributesBuilder::default();
    attributes_builder.add("Hat", &traits.0.to_string());
    attributes_builder.add("Clothes", &traits.1.to_string());
    attributes_builder.add("Glasses", &traits.2.to_string());
    attributes_builder.add("Body", &traits.3.to_string());
    let attributes_data: Vec<u8> = attributes_builder.build();

    let attributes_ix: Instruction = AllocateBuilder::new()
        .asset(asset)
        .payer(Some(payer))
        .system_program(Some(system_program::ID))
        .extension(ExtensionInput {
            extension_type: ExtensionType::Attributes,
            length: attributes_data.len() as u32,
            data: Some(attributes_data),
        })
        .instruction();

    invoke_signed(&attributes_ix, account_infos, signer_seeds)?;

    Ok(())
}

pub fn write_rawimg_and_traits(
    asset: Pubkey,
    payer: Pubkey,
    account_infos: &[AccountInfo],
    signer_seeds: &[&[&[u8]]; 1],
    epoch: u64,
) -> Result<()> {
    let assets = generate_asset(epoch, payer);
    write_attributes(asset, payer, &account_infos, signer_seeds, assets.1)?;
    let mut blob_data = Vec::new();
    set_data(&mut blob_data, "img/bmp", &assets.0);

    // Custom Blob Builder to minimize Heap
    let extension_data = ExtensionInput {
        extension_type: ExtensionType::Blob,
        length: blob_data.len() as u32,
        data: Some(blob_data),
    };
    let mut serialized_extension_data = extension_data.try_to_vec()?;

    let instruction_data = AllocateInstructionData {
        discriminator: 4, // The discriminator for allocate
    };

    // Serialize instruction data
    let mut serialized_instruction_data = instruction_data.try_to_vec()?;
    serialized_instruction_data.append(&mut serialized_extension_data);

    let accounts = vec![
        AccountMeta::new(asset, true),
        AccountMeta::new(payer, true),
        AccountMeta::new_readonly(system_program::ID, false),
    ];

    let blob_ix = Instruction {
        program_id: nifty_asset::ID,
        accounts,
        data: serialized_instruction_data,
    };

    invoke_signed(&blob_ix, account_infos, signer_seeds)?;
    Ok(())
}

pub fn create_asset(
    asset: Pubkey,
    payer: Pubkey,
    authority: Pubkey,
    owner: Pubkey,
    group: Pubkey,
    account_infos: &[AccountInfo],
    signer_seeds: &[&[&[u8]]; 2],
    epoch: u64,
) -> Result<()> {
    // define var name that is Epoch #{epoch}
    let name = format!("Epoch #{}", epoch);
    let create_ix = CreateBuilder::new()
        .asset(asset)
        .authority(authority)
        .owner(owner)
        .group(Some(group))
        .payer(Some(payer))
        .system_program(Some(system_program::ID))
        .name(name)
        .standard(Standard::NonFungible)
        .mutable(false)
        .add_remaining_account(AccountMeta::new_readonly(authority, true))
        .instruction();
    invoke_signed(&create_ix, account_infos, signer_seeds)?;
    Ok(())
}

#[derive(AnchorDeserialize, AnchorSerialize)]
struct AllocateInstructionData {
    discriminator: u8,
}


// Alternative to BlobBuilder to reduce heap allocations

pub struct LightweightPrefixStr;

impl LightweightPrefixStr {
    /// Prepends the length of the string to the string bytes and returns the combined Vec<u8>.
    pub fn with_length_prefix(content_type: &str) -> Vec<u8> {
        let length = content_type.len() as u8;
        let mut prefixed_str = Vec::with_capacity(1 + length as usize);
        prefixed_str.push(length);
        prefixed_str.extend_from_slice(content_type.as_bytes());
        prefixed_str
    }
}

pub fn set_data(buffer: &mut Vec<u8>, content_type: &str, data: &[u8]) {
    buffer.clear();

    // Create the content-type prefix string
    let prefixed_content_type = LightweightPrefixStr::with_length_prefix(content_type);

    // Reserve space in the buffer to avoid multiple allocations
    buffer.reserve(prefixed_content_type.len() + data.len());

    // Append the prefixed content type and data to the buffer
    buffer.extend_from_slice(&prefixed_content_type);
    buffer.extend_from_slice(data);
}
