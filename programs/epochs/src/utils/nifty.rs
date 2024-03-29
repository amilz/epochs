use anchor_lang::{
    prelude::*,
    solana_program::{instruction::Instruction, program::invoke_signed, system_program},
};
use nifty_asset::{
    allocate_and_write, allocate_instruction_data, extensions::{AttributesBuilder, ExtensionBuilder}, instructions::{
        AllocateBuilder, AllocateCpiAccounts, CreateBuilder, WriteBuilder, WriteCpi, WriteCpiAccounts, WriteCpiBuilder
    }, types::{ExtensionInput, ExtensionType, Standard}
};

use crate::generate_asset;

use super::log_heap_usage;

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
    let attributes_data = attributes_builder.data();

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

pub fn write_rawimg_and_traits<'a>(
    asset: AccountInfo<'a>,
    payer: AccountInfo<'a>,
    system_program: AccountInfo<'a>,
    nifty_asset_program: AccountInfo<'a>,
    account_infos: &[AccountInfo<'a>],
    signer_seeds: &[&[&[u8]]; 1],
    epoch: u64,
) -> Result<()> {
    log_heap_usage(0);
    let assets = generate_asset(epoch, payer.key());
    write_attributes(
        asset.key(),
        payer.key(),
        &account_infos,
        signer_seeds,
        assets.1,
    )?;
    let mut blob_data = Vec::new();
    set_data(&mut blob_data, "img/bmp", &assets.0);

    allocate_and_write!(
        nifty_asset_program,
        asset,
        payer,
        system_program,
        ExtensionType::Blob,
        &blob_data,
        signer_seeds
    );

    //let borrowed_blob = &blob_data;
/*     let empty: &Vec<u8> = &Vec::new();
    log_heap_usage(0);
    AllocateCpiAccounts {
        asset: &asset,
        payer: Some(&payer),
        system_program: Some(&system_program),
    }
    .invoke_signed(
        &nifty_asset_program,
        allocate_instruction_data!(ExtensionType::Blob, blob_data.len(), empty),
        signer_seeds,
    )?;

    log_heap_usage(1);
    WriteCpiBuilder::new(&nifty_asset_program)
        .asset(&asset)
        .payer(&payer)
        .system_program(&system_program)
        .overwrite(false)
        .bytes(blob_data[..1100].to_vec())
        .invoke_signed(signer_seeds)?;
    log_heap_usage(2);
    WriteCpiBuilder::new(&nifty_asset_program)
        .asset(&asset)
        .payer(&payer)
        .system_program(&system_program)
        .overwrite(false)
        .bytes(blob_data[1100..2200].to_vec())
        .invoke_signed(signer_seeds)?;
    log_heap_usage(3);
    WriteCpiBuilder::new(&nifty_asset_program)
        .asset(&asset)
        .payer(&payer)
        .system_program(&system_program)
        .overwrite(false)
        .bytes(blob_data[2200..].to_vec())
        .invoke_signed(signer_seeds)?;
 */

/*     log_heap_usage(1);
    let write_ix_1 = WriteBuilder::new()
        .asset(asset.key())
        .payer(payer.key())
        .system_program(system_program.key())
        .overwrite(false)
        .bytes(blob_data[..1100].to_vec())
        .instruction();

    invoke_signed(&write_ix_1, account_infos, signer_seeds)?;

    log_heap_usage(2);
    let write_ix_2 = WriteBuilder::new()
        .asset(asset.key())
        .payer(payer.key())
        .system_program(system_program.key())
        .overwrite(false)
        .bytes(blob_data[1100..2200].to_vec())
        .instruction();

    invoke_signed(&write_ix_2, account_infos, signer_seeds)?;

    log_heap_usage(3);
    let write_ix_3 = WriteBuilder::new()
        .asset(asset.key())
        .payer(payer.key())
        .system_program(system_program.key())
        .overwrite(false)
        .bytes(blob_data[2200..].to_vec())
        .instruction();

    invoke_signed(&write_ix_3, account_infos, signer_seeds)?;

    log_heap_usage(4); */

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
        .authority(authority, true)
        .owner(owner)
        .group(Some(group))
        .payer(Some(payer))
        .system_program(Some(system_program::ID))
        .name(name)
        .standard(Standard::NonFungible)
        .mutable(false)
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
