use std::str::FromStr;

use crate::{generate_asset, log_heap_usage, utils::generate_json_metadata, EpochError, CREATOR_WALLET, DAO_TREASURY_WALLET};
use anchor_lang::{
    prelude::*,
    solana_program::{instruction::Instruction, program::invoke},
};
use nifty_asset::{
    extensions::{CreatorsBuilder, ExtensionBuilder, ExtensionData, Links, LinksBuilder},
    instructions::{AllocateBuilder, CreateBuilder},
    types::{Extension, ExtensionType, Standard},
    ID as NiftyAssetID,
};

#[derive(Accounts)]
pub struct OssCreate<'info> {
    #[account(mut)]
    pub asset: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,

    /// CHECK: use address constraint
    #[account(
        address = NiftyAssetID @ EpochError::InvalidWnsProgram
    )]
    pub oss_program: UncheckedAccount<'info>,
}

impl<'info> OssCreate<'info> {
    pub fn handler(&self) -> Result<()> {
        let account_infos = vec![
            self.asset.to_account_info(),
            self.payer.to_account_info(),
            self.oss_program.to_account_info(),
            self.system_program.to_account_info(),
        ];

        log_heap_usage();

        self.allocate_blob(&account_infos)?;

        log_heap_usage();

        self.write_creators(&account_infos)?;

        log_heap_usage();

        self.write_links(&account_infos)?;

        log_heap_usage();

        self.create_asset(&account_infos)?;

        Ok(())
    }

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

    pub fn handle_rest(&self) -> Result<()> {
        let account_infos = vec![
            self.asset.to_account_info(),
            self.payer.to_account_info(),
            self.oss_program.to_account_info(),
            self.system_program.to_account_info(),
        ];

        self.write_creators(&account_infos)?;
        self.write_links(&account_infos)?;
        self.create_asset(&account_infos)?;

        Ok(())
    }


    fn allocate_blob(&self, account_infos: &[AccountInfo]) -> Result<()> {
        let current_epoch = Clock::get()?.epoch;
        let assets = generate_asset(current_epoch, self.payer.key());


        let img_raw = generate_json_metadata(
            current_epoch,
            self.payer.key(),
            assets.1,
        ).unwrap();

        let bmp_raw = assets.0;
        let mut data = Vec::new();
/*         data.extend_from_slice(&bmp_raw);
        data.extend_from_slice(&img_raw); */

        let allocate_blob_ix: Instruction = AllocateBuilder::new()
            .asset(self.asset.key())
            .payer(Some(self.payer.key()))
            .system_program(Some(self.system_program.key()))
            .extension(Extension {
                extension_type: ExtensionType::Blob,
                length: data.len() as u32,
                data: Some(data),
            })
            .instruction();

        invoke(&allocate_blob_ix, account_infos)?;

        Ok(())
    }

    fn write_creators(&self, account_infos: &[AccountInfo]) -> Result<()> {
        let mut creators = CreatorsBuilder::default();
        creators.add(&self.payer.key(), true, 10);
        creators.add(&Pubkey::from_str(DAO_TREASURY_WALLET).unwrap(), true, 80);
        creators.add(&Pubkey::from_str(CREATOR_WALLET).unwrap(), true, 10);
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
            .authority(self.payer.key())
            .holder(self.payer.key())
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
}
