use anchor_lang::prelude::*;

use crate::constants::MINTER_SEED;
use crate::state::{Minter, MinterClaim};
use crate::MINTER_CLAIM_SEED;

#[derive(Accounts)]
pub struct ClaimMint<'info> {
    #[account(
        mut, 
        signer,
    )]
    pub payer: SystemAccount<'info>,

    #[account(
        mut,
        seeds = [MINTER_SEED.as_bytes()],
        bump = minter.bump, 
    )]
    pub minter: Account<'info, Minter>,

    #[account(
        init,
        seeds = [MINTER_CLAIM_SEED.as_bytes(), payer.key().as_ref()],
        bump, 
        payer = payer,
        space = MinterClaim::get_size()
    )]
    pub minter_claim: Account<'info, MinterClaim>,

    pub system_program: Program<'info, System>,
}

impl<'info> ClaimMint<'info> {
    pub fn handler (&mut self, 
        minter_claim_bump: u8,
    ) -> Result<()> {
        let minter: &mut Account<'_, Minter> = &mut self.minter;
        let minter_claim: &mut Account<'_, MinterClaim> = &mut self.minter_claim;
        let claimer = self.payer.key();
        minter.redeem_item()?;
        let minter_epoch = minter.items_redeemed;
        minter_claim.set(claimer, minter_epoch, minter_claim_bump)?;
        Ok(())
    }
}
