use anchor_lang::prelude::*;

use crate::constants::MINTER_SEED;
use crate::state::{TimeMachine, TimeMachineReceipt};
use crate::MINTER_CLAIM_SEED;

#[derive(Accounts)]
pub struct TimeMachineAttempt<'info> {
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
    pub minter: Account<'info, TimeMachine>,

    #[account(
        init,
        seeds = [MINTER_CLAIM_SEED.as_bytes(), payer.key().as_ref()],
        bump, 
        payer = payer,
        space = TimeMachineReceipt::get_size()
    )]
    pub minter_claim: Account<'info, TimeMachineReceipt>,

    pub system_program: Program<'info, System>,
}

impl<'info> TimeMachineAttempt<'info> {
    pub fn handler (&mut self, 
        minter_claim_bump: u8,
    ) -> Result<()> {
        let time_machine: &mut Account<'_, TimeMachine> = &mut self.minter;
        let receipt: &mut Account<'_, TimeMachineReceipt> = &mut self.minter_claim;
        let claimer = self.payer.key();
        time_machine.redeem_item()?;
        let minter_epoch = time_machine.items_redeemed;
        receipt.set(claimer, minter_epoch, minter_claim_bump)?;
        Ok(())
    }
}
