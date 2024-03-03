use std::str::FromStr;

use crate::{
    generate_asset, log_heap_usage, utils::generate_json_metadata, EpochError, AUTHORITY_SEED, COLLECTION_SEED, CREATOR_WALLET_1, DAO_TREASURY_WALLET
};
use anchor_lang::{
    prelude::*,
    solana_program::{instruction::Instruction, program::{invoke, invoke_signed}},
};
use nifty_asset::{
    extensions::{CreatorsBuilder, ExtensionBuilder, LinksBuilder},
    instructions::{AllocateBuilder, CreateBuilder, GroupBuilder},
    types::{Extension, ExtensionType, Standard},
    ID as NiftyAssetID,
};

#[derive(Accounts)]
pub struct OssCreate<'info> {
    #[account(mut)]
    pub asset: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: WNS inits it as a Mint Account
    #[account(
        mut,
        seeds = [COLLECTION_SEED.as_bytes()],
        bump,
    )]
    pub group: UncheckedAccount<'info>,

    /// CHECK: Program Authority: The account that will be used to sign transactions
    #[account(
        seeds = [AUTHORITY_SEED.as_bytes()],
        bump,
    )]
    pub authority: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,

    /// CHECK: use address constraint
    #[account(
        address = NiftyAssetID @ EpochError::InvalidWnsProgram
    )]
    pub oss_program: UncheckedAccount<'info>,
}

impl<'info> OssCreate<'info> {
    pub fn handle_blob(&self) -> Result<()> {
        let account_infos = vec![
            self.asset.to_account_info(),
            self.payer.to_account_info(),
            self.oss_program.to_account_info(),
            self.system_program.to_account_info(),
        ];

        self.allocate_blob(&account_infos)?;

        Ok(())
    }

    pub fn handle_rest(&self, authority_bump: u8) -> Result<()> {
        let account_infos = vec![
            self.asset.to_account_info(),
            self.payer.to_account_info(),
            self.authority.to_account_info(),
            self.oss_program.to_account_info(),
            self.system_program.to_account_info(),
        ];

        //TBD/TODO: Might not need this (since at collection-level)
        //self.write_creators(&account_infos)?;
        self.write_links(&account_infos)?;
        self.create_asset(&account_infos)?;
        self.add_to_group(authority_bump)?;

        Ok(())
    }

    fn allocate_blob(&self, account_infos: &[AccountInfo]) -> Result<()> {
        log_heap_usage(1);

        let current_epoch = Clock::get()?.epoch;
        let assets = generate_asset(current_epoch, self.payer.key());
        log_heap_usage(2);

        let json_raw = generate_json_metadata(current_epoch, self.payer.key(), assets.1).unwrap();
        log_heap_usage(3);

        let bmp_raw = &assets.0;

        // Estimate total size
        let total_size: usize = bmp_raw.len() + json_raw.len();
        log_heap_usage(4);
        // Create Vec with exact capacity
        let mut data = Vec::with_capacity(total_size);
        log_heap_usage(5);

        // Write data directly into Vec
        data.extend_from_slice(&bmp_raw);
        data.extend_from_slice(&json_raw);
        log_heap_usage(6);

        let extension_data = Extension {
            extension_type: ExtensionType::Blob, // Assuming ExtensionType::Blob is an enum or similar
            length: data.len() as u32,
            data: Some(data), // The actual data you want to include
        };

        let instruction_data = AllocateInstructionData {
            discriminator: 4, // Assuming '4' is the correct discriminator for your instruction
        };

        let mut serialized_extension_data = match extension_data.try_to_vec() {
            Ok(data) => data,
            Err(e) => return Err(e.into()), // Handle the serialization error appropriately
        };

        let mut serialized_instruction_data = match instruction_data.try_to_vec() {
            Ok(data) => data,
            Err(e) => return Err(e.into()), // Handle the serialization error appropriately
        };

        // Append the serialized extension data to the instruction data
        serialized_instruction_data.append(&mut serialized_extension_data);

        // Define the accounts involved in the instruction
        let accounts = vec![
            AccountMeta::new(self.asset.key(), true), // Asset account, assuming it's a signer
            AccountMeta::new(self.payer.key(), true), // Payer account, assuming it's a signer
            AccountMeta::new_readonly(self.system_program.key(), false), // System program, readonly
        ];

        // Construct the instruction
        let allocate_blob_ix = Instruction {
            program_id: self.oss_program.key(), // Replace `crate::ASSET_ID` with the actual program ID for the Allocate instruction
            accounts,
            data: serialized_instruction_data,
        };

        invoke(&allocate_blob_ix, account_infos)?;
        log_heap_usage(7);

        Ok(())
    }

    fn _write_creators(&self, account_infos: &[AccountInfo]) -> Result<()> {
        let mut creators = CreatorsBuilder::default();
        creators.add(&self.payer.key(), true, 10);
        creators.add(&Pubkey::from_str(DAO_TREASURY_WALLET).unwrap(), true, 80);
        creators.add(&Pubkey::from_str(CREATOR_WALLET_1).unwrap(), true, 10);
        let creators_data = creators.build();

        let creator_ix: Instruction = AllocateBuilder::new()
            .asset(self.asset.key())
            .payer(Some(self.payer.key()))
            .system_program(Some(self.system_program.key()))
            .extension(Extension {
                extension_type: ExtensionType::Creators,
                length: creators_data.len() as u32,
                data: Some(creators_data),
            })
            .instruction();

        invoke(&creator_ix, account_infos)?;

        Ok(())
    }

    fn write_links(&self, account_infos: &[AccountInfo]) -> Result<()> {
        let mut links_builder = LinksBuilder::default();
        links_builder.add(
            "metadata",
            "https://arweave.net/2eyYRZpFXeXrNyA17Y8QvSfQV9rNkzAqXZa7ko7MBNA",
        );
        links_builder.add(
            "image",
            "https://arweave.net/aFnc6QVyRR-gVx6pKYSFu0MiwijQzFdU4fMSuApJqms",
        );
        let links_data: Vec<u8> = links_builder.build();

        let links_ix: Instruction = AllocateBuilder::new()
            .asset(self.asset.key())
            .payer(Some(self.payer.key()))
            .system_program(Some(self.system_program.key()))
            .extension(Extension {
                extension_type: ExtensionType::Links,
                length: links_data.len() as u32,
                data: Some(links_data),
            })
            .instruction();

        invoke(&links_ix, account_infos)?;

        Ok(())
    }

    fn create_asset(&self, account_infos: &[AccountInfo]) -> Result<()> {
        let create_ix = CreateBuilder::new()
            .asset(self.asset.key())
            .authority(self.authority.key())
            .holder(self.authority.key())
            .group(None)
            .payer(Some(self.payer.key()))
            .system_program(Some(self.system_program.key()))
            .name("Epoch Asset".to_string())
            .standard(Standard::NonFungible)
            .mutable(false)
            .instruction();

        invoke(&create_ix, account_infos)?;

        Ok(())
    }

    fn add_to_group(&self, authority_bump: u8) -> Result<()> {
        let add_to_group_ix = GroupBuilder::new()
            .asset(self.asset.key())
            .group(self.group.key())
            .authority(self.authority.key())
            .instruction();

        let authority_seeds = &[AUTHORITY_SEED.as_bytes(), &[authority_bump]];
        let signers_seeds = &[&authority_seeds[..]];

        let account_infos = vec![
            self.asset.to_account_info(),
            self.payer.to_account_info(),
            self.oss_program.to_account_info(),
            self.group.to_account_info(),
            self.authority.to_account_info(),
        ];

        invoke_signed(&add_to_group_ix, &account_infos, signers_seeds)?;

        Ok(())
    }

}

#[derive(AnchorDeserialize, AnchorSerialize)]
struct AllocateInstructionData {
    discriminator: u8,
}