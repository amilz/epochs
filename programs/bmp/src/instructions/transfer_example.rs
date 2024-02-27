use anchor_lang::prelude::*;

use anchor_spl::{
    associated_token::AssociatedToken, token_2022::Token2022, token_interface::{
        transfer_checked, Mint, TokenAccount, TransferChecked
    }
};

#[derive(Accounts)]
#[instruction(claim_epoch: u64)]
pub struct TransferExample<'info> {

    /// CHECK: TEST
    #[account(mut)]
    owner: Signer<'info>,

    /// CHECK: TEST
    #[account(mut)]
    receiver: SystemAccount<'info>,

    /// CHECK: TEST
    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = owner,
        associated_token::token_program = token_program
    )]
    pub source_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init,
        payer = owner,
        associated_token::mint = mint,
        associated_token::authority = receiver,
        associated_token::token_program = token_program
    )]
    pub destination_ata: InterfaceAccount<'info, TokenAccount>,
    
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token2022>,

    // THINK I CPI APPROVE
    // ADD A BOOL TO PARAMS
    // CAN DISABLE APPROVE CPI TO TEST IT BOTH WAYS
}

impl TransferExample<'_> {

    pub fn handler(&self) -> Result<()> {

        let cpi_accounts = TransferChecked {
            from: self.source_ata.to_account_info().clone(),
            mint: self.mint.to_account_info().clone(),
            to: self.destination_ata.to_account_info().clone(),
            authority: self.owner.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
        transfer_checked(cpi_context, 1, 0)?;

        Ok(())
    }
        
}