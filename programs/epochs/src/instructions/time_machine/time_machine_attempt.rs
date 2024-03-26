use anchor_lang::{prelude::*, system_program::{transfer, Transfer}};
use std::str::FromStr;

use crate::{constants::TIME_MACHINE_SEED, CREATOR_WALLET_1, CREATOR_WALLET_2, TIME_MACHINE_LAMPORTS};
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

    #[account(
        mut,
        address = Pubkey::from_str(CREATOR_WALLET_1).unwrap() @EpochError::InvalidCreator
    )]
    creator1_wallet: SystemAccount<'info>,

    #[account(
        mut,
        address = Pubkey::from_str(CREATOR_WALLET_2).unwrap() @EpochError::InvalidCreator
    )]
    creator2_wallet: SystemAccount<'info>,

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
        let dao_treasury_lamports = TIME_MACHINE_LAMPORTS.checked_mul(80).ok_or_else(|| EpochError::Overflow)? / 100;
        let creator1_lamports = TIME_MACHINE_LAMPORTS.checked_mul(5).ok_or_else(|| EpochError::Overflow)? / 100;
        let creator2_lamports = TIME_MACHINE_LAMPORTS.checked_sub(dao_treasury_lamports)
            .ok_or_else(|| EpochError::Underflow)?
            .checked_sub(creator1_lamports)
            .ok_or_else(|| EpochError::Underflow)?;

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
                    to: self.creator1_wallet.to_account_info(),
                },
            ),
            creator1_lamports,
        )?;

        transfer(
            CpiContext::new(
                self.system_program.to_account_info(),
                Transfer {
                    from: self.payer.to_account_info(),
                    to: self.creator2_wallet.to_account_info(),
                },
            ),
            creator2_lamports,
        )?;

        Ok(())
    }
}
