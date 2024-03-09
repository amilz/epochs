use anchor_lang::{
    prelude::*,
    solana_program::{instruction::Instruction, program::invoke_signed, system_program},
};
use nifty_asset::{
    extensions::{AttributesBuilder, ExtensionBuilder},
    instructions::{AllocateBuilder, CreateBuilder},
    types::{Extension, ExtensionType, Standard},
    ID as NiftyAssetID,
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
        .extension(Extension {
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
    epoch: u64
) -> Result<()> {
    let assets = generate_asset(epoch, payer);
    write_attributes(
        asset,
        payer,
        &account_infos,
        signer_seeds,
        assets.1,
    )?;

    let extension_data = Extension {
        extension_type: ExtensionType::Blob,
        length: assets.0.len() as u32,
        data: Some(assets.0),
    };

    // Serialize extension data
    let mut serialized_extension_data = extension_data.try_to_vec()?;

    // Prepare `AllocateInstructionData`
    let instruction_data = AllocateInstructionData {
        discriminator: 4, // The discriminator for allocate
    };

    // Serialize instruction data
    let mut serialized_instruction_data = instruction_data.try_to_vec()?;

    // Append extension data to instruction data
    serialized_instruction_data.append(&mut serialized_extension_data);
    let accounts = vec![
        AccountMeta::new(asset, true),
        AccountMeta::new(payer, true),
        AccountMeta::new_readonly(system_program::ID, false),
    ];

    let allocate_blob_ix = Instruction {
        program_id: NiftyAssetID,
        accounts,
        data: serialized_instruction_data,
    };
    invoke_signed(&allocate_blob_ix, account_infos, signer_seeds)?;
    Ok(())
}


pub fn create_asset(
    asset: Pubkey,
    payer: Pubkey,
    authority: Pubkey,
    holder: Pubkey,
    group: Pubkey,
    account_infos: &[AccountInfo],
    signer_seeds: &[&[&[u8]]; 2],
) -> Result<()> {
    let create_ix = CreateBuilder::new()
        .asset(asset)
        .authority(authority)
        .holder(holder)
        .group(Some(group))
        .payer(Some(payer))
        .system_program(Some(system_program::ID))
        .name("Epoch Asset".to_string())
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
