use std::str::FromStr;

use anchor_lang::prelude::*;

use crate::constants::MINTER_SEED;
use crate::state::Minter;
use crate::{EpochError, AUTHORITY};

#[derive(Accounts)]
pub struct OssInitMinter<'info> {
    #[account(
        mut, 
        signer,
        address = Pubkey::from_str(AUTHORITY).unwrap() @ EpochError::InvalidTreasury
)]
    pub authority: SystemAccount<'info>,

    #[account(
        init,
        seeds = [MINTER_SEED.as_bytes()],
        bump, 
        payer = authority,
        space = Minter::get_size()
    )]
    pub minter: Account<'info, Minter>,

    pub system_program: Program<'info, System>,
}

impl<'info> OssInitMinter<'info> {
    pub fn handler (&mut self, 
        minter_bump: u8,
        items_available: u64, 
        start_time: i64
    ) -> Result<()> {
        let minter: &mut Account<'_, Minter> = &mut self.minter;
        minter.initialize(minter_bump, items_available, start_time)?;
        Ok(())
    }
}
