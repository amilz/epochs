use std::str::FromStr;

use crate::{
    EpochError, AUTHORITY_SEED,
    COLLECTION_SEED, CREATOR_WALLET_1, CREATOR_WALLET_2, DAO_TREASURY_WALLET,
};
use anchor_lang::{
    prelude::*,
    solana_program::{
        instruction::Instruction,
        program::invoke_signed,
    },
};
use nifty_asset::{
    extensions::{CreatorsBuilder, ExtensionBuilder, GroupBuilder, LinksBuilder},
    instructions::{AllocateBuilder, CreateBuilder},
    types::{Extension, ExtensionType, Standard},
    ID as NiftyAssetID,
};

#[derive(Accounts)]
pub struct CreateGroup<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: WNS inits it as a Mint Account
    #[account(
        mut,
        seeds = [COLLECTION_SEED.as_bytes()],
        bump,
    )]
    pub asset: UncheckedAccount<'info>,

    /// CHECK: Program Authority: The account that will be used to sign transactions
    #[account(
        seeds = [AUTHORITY_SEED.as_bytes()],
        bump,
    )]
    pub authority: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,

    /// CHECK: use address constraint
    #[account(
        address = NiftyAssetID @ EpochError::InvalidOssProgram
    )]
    pub oss_program: UncheckedAccount<'info>,
}

impl<'info> CreateGroup<'info> {
    pub fn handler(&self, authority_bump: u8, asset_bump: u8) -> Result<()> {
        let account_infos = vec![
            self.asset.to_account_info(),
            self.authority.to_account_info(),
            self.payer.to_account_info(),
            self.oss_program.to_account_info(),
            self.system_program.to_account_info(),
        ];

        let authority_seeds = &[AUTHORITY_SEED.as_bytes(), &[authority_bump]];
        let asset_seeds = &[COLLECTION_SEED.as_bytes(), &[asset_bump]];
        let combined_signer_seeds = &[&asset_seeds[..], &authority_seeds[..]];


        self.write_creators(&account_infos, combined_signer_seeds)?;
        self.write_links(&account_infos, combined_signer_seeds)?;
        self.create_group(&account_infos, combined_signer_seeds)?;
        self.create_asset(&account_infos, combined_signer_seeds)?;
        // TODO Add Royalties Extension (after PR is merged)

        Ok(())
    }
    fn write_creators(
        &self,
        account_infos: &[AccountInfo],
        signer_seeds: &[&[&[u8]]; 2]
    ) -> Result<()> {
        let mut creators = CreatorsBuilder::default();
        creators.add(&Pubkey::from_str(DAO_TREASURY_WALLET).unwrap(), true, 80);
        creators.add(&Pubkey::from_str(CREATOR_WALLET_1).unwrap(), true, 10);
        creators.add(&Pubkey::from_str(CREATOR_WALLET_2).unwrap(), true, 10);
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

    fn create_group(&self, account_infos: &[AccountInfo], signer_seeds: &[&[&[u8]]; 2]) -> Result<()> {
        let mut group_builder = GroupBuilder::default();
        let group_data = group_builder.build();

        let group_ix: Instruction = AllocateBuilder::new()
            .asset(self.asset.key())
            .payer(Some(self.payer.key()))
            .system_program(Some(self.system_program.key()))
            .extension(Extension {
                extension_type: ExtensionType::Grouping,
                length: group_data.len() as u32,
                data: Some(group_data),
            })
            .instruction();

        invoke_signed(&group_ix, account_infos, signer_seeds)?;

        Ok(())
    }

    fn write_links(&self, account_infos: &[AccountInfo], signer_seeds: &[&[&[u8]]; 2]) -> Result<()> {
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


    fn create_asset(
        &self,
        account_infos: &[AccountInfo],
        signer_seeds: &[&[&[u8]]; 2]
    ) -> Result<()> {
        let create_ix = CreateBuilder::new()
            .asset(self.asset.key())
            .authority(self.authority.key())
            .holder(self.authority.key())
            .group(None)
            .payer(Some(self.payer.key()))
            .system_program(Some(self.system_program.key()))
            .name("Epoch Collection".to_string())
            .standard(Standard::NonFungible)
            .mutable(false)
            .instruction();

        invoke_signed(&create_ix, account_infos, signer_seeds)?;

        Ok(())
    }
}
