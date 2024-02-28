use anchor_lang::{prelude::*, solana_program::program::invoke};
use nifty_asset::{instructions::{CreateCpiAccounts, CreateInstructionArgs, Create, CreateCpi}, types::Standard};
use std::str::FromStr;
use anchor_lang::context::CpiContext;
use crate::{EpochError, OSS_PROGRAM};


#[derive(Accounts)]
pub struct OssCreate<'info> {
    #[account(mut)]
    pub asset: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,
    

    pub system_program: Program<'info, System>,
    
    #[account(
        address = Pubkey::from_str(OSS_PROGRAM).unwrap() @ EpochError::InvalidWnsProgram
    )]
    pub oss_program: UncheckedAccount<'info>,
}

impl<'info> OssCreate<'info> {
    pub fn handler(&self, name: String, mutable: bool) -> Result<()> {
        let standard = Standard::NonFungible;
        // Prepare the instruction arguments
        let args = CreateInstructionArgs {
            name,
            standard,
            mutable,
        };

        let create = Create {
                asset: self.asset.key(),
                authority: self.payer.key(), // Assuming payer is the authority
                holder: self.payer.key(),    // Assuming payer is the holder
                group: None,                              // Set this according to your logic
                payer: Some(self.payer.key()),
                system_program: Some(self.system_program.key()),
        };
        let ix = create.instruction(args);
        

        // Set up the CPI accounts
        let cpi_accounts = CreateCpiAccounts {
            asset: &self.asset.to_account_info(),
            authority: &self.payer.to_account_info(), // Assuming payer is the authority
            holder: &self.payer.to_account_info(),    // Assuming payer is the holder
            group: None,                              // Set this according to your logic
            payer: Some(&self.payer.to_account_info()),
            system_program: Some(&self.system_program.to_account_info()),
        };
        let account_infos = vec![
            self.asset.to_account_info(),
            self.payer.to_account_info(),
            self.oss_program.to_account_info(),
            self.system_program.to_account_info(),
        ];

        let cpi = CreateCpi {
            __program: &self.oss_program.to_account_info(),
            asset: &self.asset.to_account_info(),
            authority: &self.payer.to_account_info(), // Assuming payer is the authority
            holder: &self.payer.to_account_info(),    // Assuming payer is the holder
            group: None,                              // Set this according to your logic
            payer: Some(&self.payer.to_account_info()),
            system_program: Some(&self.system_program.to_account_info()),
            __args: args,
        };

        Ok(())
    }
}


