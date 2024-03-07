use crate::{
    generate_asset, utils::generate_json_metadata, EpochError, TimeMachineReceipt, AUTHORITY_SEED, COLLECTION_SEED, TIME_MACHINE_RECEIPT_SEED, NFT_MINT_SEED
};
use anchor_lang::{
    prelude::*,
    solana_program::{
        instruction::Instruction,
        program::invoke_signed,
    },
};
use nifty_asset::{
    extensions::{ExtensionBuilder, LinksBuilder},
    instructions::{AllocateBuilder, CreateBuilder, GroupBuilder, TransferBuilder},
    types::{Extension, ExtensionType, Standard},
    ID as NiftyAssetID,
};

#[derive(Accounts)]
pub struct TimeMachienCreateAndClaim<'info> {
    /// CHECK: New NFT Mint (will be init by OSS Program via CPI - address is derived based on epoch #)
    #[account(
        mut,
        seeds = [NFT_MINT_SEED.as_bytes(), &receipt.epoch.to_le_bytes()],
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
        seeds = [TIME_MACHINE_RECEIPT_SEED.as_bytes(), payer.key().as_ref()],
        bump = receipt.bump,
        constraint = receipt.claimer == payer.key()
    )]
    pub receipt: Account<'info, TimeMachineReceipt>,

    pub system_program: Program<'info, System>,

    /// CHECK: use address constraint
    #[account(
        address = NiftyAssetID @ EpochError::InvalidOssProgram
    )]
    pub oss_program: UncheckedAccount<'info>,
}

impl<'info> TimeMachienCreateAndClaim<'info> {
    pub fn generate_inscription(&self, asset_bump: u8) -> Result<()> {
        let receipt = &self.receipt;
        let mint_epoch= receipt.epoch;

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

        let current_epoch = self.receipt.epoch;
        let asset_seeds = &[
            NFT_MINT_SEED.as_bytes(),
            &current_epoch.to_le_bytes(),
            &[asset_bump],
        ];
        let asset_signer_seeds: &[&[&[u8]]; 1] = &[&asset_seeds[..]];

        self.write_links(&account_infos, asset_signer_seeds)?;
        self.create_asset(&account_infos, asset_signer_seeds)?;
        self.add_to_group(authority_bump)?;
        self.distribute_nft(&account_infos, authority_bump)?;


        Ok(())
    }

    fn allocate_blob(&self, account_infos: &[AccountInfo], signer_seeds: &[&[&[u8]]; 1]) -> Result<()> {

        let current_epoch = self.receipt.epoch;
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

        Ok(())
    }

    fn write_links(&self, account_infos: &[AccountInfo], signer_seeds: &[&[&[u8]]; 1]) -> Result<()> {
        // TODO DYANMIC LINKS
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
        let signer_seeds = &[&authority_seeds[..]];

        let account_infos = vec![
            self.asset.to_account_info(),
            self.payer.to_account_info(),
            self.oss_program.to_account_info(),
            self.group.to_account_info(),
            self.authority.to_account_info(),
        ];

        invoke_signed(&add_to_group_ix, &account_infos, signer_seeds)?;

        Ok(())
    }
    
    fn distribute_nft(&self, account_infos: &[AccountInfo], authority_bump: u8) -> Result<()> {
        let authority_seeds = &[AUTHORITY_SEED.as_bytes(), &[authority_bump]];
        let signer_seeds = &[&authority_seeds[..]];

        let transfer_ix: Instruction = TransferBuilder::new()
            .asset(self.asset.key())
            .signer(self.authority.key())
            .recipient(self.payer.key())
            .instruction();

        invoke_signed(&transfer_ix, &account_infos, signer_seeds)?;

        Ok(())
    }


}

#[derive(AnchorDeserialize, AnchorSerialize)]
struct AllocateInstructionData {
    discriminator: u8,
}