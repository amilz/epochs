use std::str::FromStr;

use anchor_lang::prelude::*;

use crate::constants::MINTER_SEED;
use crate::state::TimeMachine;
use crate::{EpochError, AUTHORITY};

#[derive(Accounts)]
pub struct TimeMachineInit<'info> {
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
        space = TimeMachine::get_size()
    )]
    pub time_machine: Account<'info, TimeMachine>,

    pub system_program: Program<'info, System>,
}

impl<'info> TimeMachineInit<'info> {
    pub fn handler (&mut self, 
        time_machine_bump: u8,
        items_available: u64, 
        start_time: i64
    ) -> Result<()> {
        let time_machine: &mut Account<'_, TimeMachine> = &mut self.time_machine;
        time_machine.initialize(time_machine_bump, items_available, start_time)?;
        Ok(())
    }
}
