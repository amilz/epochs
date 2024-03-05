use std::str::FromStr;

use crate::{
    generate_asset, log_heap_usage, utils::generate_json_metadata, EpochError, MinterClaim, AUTHORITY_SEED, COLLECTION_SEED, CREATOR_WALLET_1, DAO_TREASURY_WALLET, MINTER_CLAIM_SEED, NFT_MINT_SEED
};
use anchor_lang::{
    prelude::*,
    solana_program::{
        instruction::Instruction,
        program::invoke_signed,
    },
};
use nifty_asset::{
    extensions::{CreatorsBuilder, ExtensionBuilder, LinksBuilder},
    instructions::{AllocateBuilder, CreateBuilder, GroupBuilder},
    types::{Extension, ExtensionType, Standard},
    ID as NiftyAssetID,
};

#[derive(Accounts)]
pub struct OssRedeem<'info> {
    /// CHECK: New NFT Mint (will be init by OSS Program via CPI - address is derived based on epoch #)
    #[account(
        mut,
        seeds = [NFT_MINT_SEED.as_bytes(), &minter_claim.epoch.to_le_bytes()],
        bump,
    )]
    pub asset: UncheckedAccount<'info>,

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

    #[account(
        // mut,
        // TODO NEED TO EITHER WAIT TIL MINT CONFIG IS EMPTY
        // OR GET RID OF CLOSE...b/c then they could re-init
        // close = payer,
        seeds = [MINTER_CLAIM_SEED.as_bytes(), payer.key().as_ref()],
        bump = minter_claim.bump,
        constraint = minter_claim.claimer == payer.key()
    )]
    pub minter_claim: Account<'info, MinterClaim>,

    pub system_program: Program<'info, System>,

    /// CHECK: use address constraint
    #[account(
        address = NiftyAssetID @ EpochError::InvalidWnsProgram
    )]
    pub oss_program: UncheckedAccount<'info>,
}

impl<'info> OssRedeem<'info> {
    pub fn generate_inscription(&self, asset_bump: u8) -> Result<()> {
        let minter_claim = &self.minter_claim;
        let mint_epoch= minter_claim.epoch;

        let account_infos = vec![
            self.asset.to_account_info(),
            self.payer.to_account_info(),
            self.oss_program.to_account_info(),
            self.system_program.to_account_info(),
        ];

        let asset_seeds = &[
            NFT_MINT_SEED.as_bytes(),
            &mint_epoch.to_le_bytes(),
            &[asset_bump],
        ];
        let asset_signer_seeds: &[&[&[u8]]; 1] = &[&asset_seeds[..]];

        self.allocate_blob(&account_infos, asset_signer_seeds)?;

        Ok(())
    }

    pub fn create_asset_w_metadata(
        &self,
        authority_bump: u8,
        asset_bump: u8,
    ) -> Result<()> {
        let account_infos = vec![
            self.asset.to_account_info(),
            self.payer.to_account_info(),
            self.authority.to_account_info(),
            self.oss_program.to_account_info(),
            self.system_program.to_account_info(),
        ];

        let current_epoch = self.minter_claim.epoch;
        let asset_seeds = &[
            NFT_MINT_SEED.as_bytes(),
            &current_epoch.to_le_bytes(),
            &[asset_bump],
        ];
        let asset_signer_seeds: &[&[&[u8]]; 1] = &[&asset_seeds[..]];

        //TBD/TODO: Might not need this (since at collection-level)
        //self.write_creators(&account_infos, asset_signer_seeds)?;
        self.write_links(&account_infos, asset_signer_seeds)?;
        self.create_asset(&account_infos, asset_signer_seeds)?;
        self.add_to_group(authority_bump)?;

        Ok(())
    }

    fn allocate_blob(&self, account_infos: &[AccountInfo], signer_seeds: &[&[&[u8]]; 1]) -> Result<()> {

        let current_epoch = self.minter_claim.epoch;
        let assets = generate_asset(current_epoch, self.payer.key());

        let json_raw = generate_json_metadata(current_epoch, self.payer.key(), assets.1).unwrap();

        let bmp_raw = &assets.0;

        let total_size: usize = bmp_raw.len() + json_raw.len();
        let mut data = Vec::with_capacity(total_size);

        // Write data directly into Vec
        data.extend_from_slice(&bmp_raw);
        data.extend_from_slice(&json_raw);

        let extension_data = Extension {
            extension_type: ExtensionType::Blob, 
            length: data.len() as u32,
            data: Some(data), 
        };

        let instruction_data = AllocateInstructionData {
            discriminator: 4, 
        };

        let mut serialized_extension_data = match extension_data.try_to_vec() {
            Ok(data) => data,
            Err(e) => return Err(e.into()),
        };

        let mut serialized_instruction_data = match instruction_data.try_to_vec() {
            Ok(data) => data,
            Err(e) => return Err(e.into()),
        };

        // Append the serialized extension data to the instruction data
        serialized_instruction_data.append(&mut serialized_extension_data);

        // Define the accounts involved in the instruction
        let accounts = vec![
            AccountMeta::new(self.asset.key(), true),
            AccountMeta::new(self.payer.key(), true),
            AccountMeta::new_readonly(self.system_program.key(), false),
        ];

        // Construct the instruction
        let allocate_blob_ix = Instruction {
            program_id: self.oss_program.key(), // Replace `crate::ASSET_ID` with the actual program ID for the Allocate instruction
            accounts,
            data: serialized_instruction_data,
        };

        invoke_signed(&allocate_blob_ix, account_infos, signer_seeds)?;
        log_heap_usage(7);

        Ok(())
    }

    fn _write_creators(&self, account_infos: &[AccountInfo], signer_seeds: &[&[&[u8]]; 1]) -> Result<()> {
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

        invoke_signed(&creator_ix, account_infos, signer_seeds)?;

        Ok(())
    }

    fn write_links(&self, account_infos: &[AccountInfo], signer_seeds: &[&[&[u8]]; 1]) -> Result<()> {
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

        invoke_signed(&links_ix, account_infos, signer_seeds)?;

        Ok(())
    }

    fn create_asset(&self, account_infos: &[AccountInfo], signer_seeds: &[&[&[u8]]; 1]) -> Result<()> {
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

        invoke_signed(&create_ix, account_infos, signer_seeds)?;

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
