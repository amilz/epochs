use anchor_lang::{prelude::*, system_program::{transfer, Transfer}};

use crate::constants::TIME_MACHINE_SEED;
use crate::state::{TimeMachine, TimeMachineReceipt};
use crate::{EpochError, TIME_MACHINE_RECEIPT_SEED};

#[derive(Accounts)]
pub struct TimeMachineAttempt<'info> {
    #[account(
        mut, 
        signer,
    )]
    pub payer: SystemAccount<'info>,

    #[account(
        mut,
        seeds = [TIME_MACHINE_SEED.as_bytes()],
        bump = time_machine.bump, 
    )]
    pub time_machine: Account<'info, TimeMachine>,

    #[account(
        init,
        seeds = [TIME_MACHINE_RECEIPT_SEED.as_bytes(), payer.key().as_ref()],
        bump, 
        payer = payer,
        space = TimeMachineReceipt::get_size()
    )]
    pub receipt: Account<'info, TimeMachineReceipt>,

    pub system_program: Program<'info, System>,
}

impl<'info> TimeMachineAttempt<'info> {
    pub fn handler (&mut self, 
        minter_claim_bump: u8,
    ) -> Result<()> {
        let time_machine: &mut Account<'_, TimeMachine> = &mut self.time_machine;
        let receipt: &mut Account<'_, TimeMachineReceipt> = &mut self.receipt;
        let claimer = self.payer.key();
        time_machine.redeem_item()?;
        let minter_epoch = time_machine.items_redeemed;


        receipt.set(claimer, minter_epoch, minter_claim_bump)?;

        self.pay()?;
        Ok(())
    }
    fn pay(&self) -> Result<()> {
        // TODO MOVE TO STATE
        let cost: u64 = 1_000_000_000;
        let dao_treasury_lamports: u64 = cost.checked_mul(80).ok_or_else(|| EpochError::Overflow)? / 100;
        let creator_lamports = cost.checked_sub(dao_treasury_lamports).ok_or_else(|| EpochError::Underflow)?;
        // TODO Add creator 2

        // TODO UPDATE DESTINATIONS
        transfer(
            CpiContext::new(
                self.system_program.to_account_info(),
                Transfer {
                    from: self.payer.to_account_info(),
                    to: self.time_machine.to_account_info(),
                },
            ),
            dao_treasury_lamports,
        )?;

        transfer(
            CpiContext::new(
                self.system_program.to_account_info(),
                Transfer {
                    from: self.payer.to_account_info(),
                    to: self.time_machine.to_account_info(),
                },
            ),
            creator_lamports,
        )?;

        Ok(())
    }
}
