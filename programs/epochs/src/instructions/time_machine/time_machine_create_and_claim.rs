use crate::{
    utils::{create_asset, write_rawimg_and_traits},
    EpochError, TimeMachineReceipt, AUTHORITY_SEED, COLLECTION_SEED, NFT_MINT_SEED,
    TIME_MACHINE_RECEIPT_SEED,
};
use anchor_lang::prelude::*;

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
        address = nifty_asset::ID @ EpochError::InvalidOssProgram
    )]
    pub oss_program: UncheckedAccount<'info>,
}

impl<'info> TimeMachienCreateAndClaim<'info> {
    pub fn handler(&mut self, authority_bump: u8, asset_bump: u8) -> Result<()> {
        let receipt = &self.receipt;
        require_keys_eq!(self.payer.key(), receipt.claimer, EpochError::InvalidWinner);
        let mint_epoch = receipt.epoch;

        let account_infos = vec![
            self.asset.to_account_info(),
            self.payer.to_account_info(),
            self.group.to_account_info(),
            self.authority.to_account_info(),
            self.oss_program.to_account_info(),
            self.system_program.to_account_info(),
        ];

        let asset_seeds = &[
            NFT_MINT_SEED.as_bytes(),
            &mint_epoch.to_le_bytes(),
            &[asset_bump],
        ];
        let asset_signer_seeds: &[&[&[u8]]; 1] = &[&asset_seeds[..]];
        let authority_seeds = &[AUTHORITY_SEED.as_bytes(), &[authority_bump]];
        let combined_signer_seeds = &[&asset_seeds[..], &authority_seeds[..]];

        write_rawimg_and_traits(
            self.asset.to_account_info(),
            self.payer.to_account_info(),
            self.system_program.to_account_info(),
            self.oss_program.to_account_info(),
            &account_infos,
            asset_signer_seeds,
            mint_epoch,
        )?;
        create_asset(
            self.asset.key(),
            self.payer.key(),
            self.authority.key(),
            receipt.claimer,
            self.group.key(),
            &account_infos,
            combined_signer_seeds,
            mint_epoch,
        )?;

        Ok(())
    }
}
