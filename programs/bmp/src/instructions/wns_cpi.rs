use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::Instruction;
use anchor_lang::solana_program::program::{invoke, invoke_signed};
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_2022::Token2022;

use crate::utils::{wns_mint_nft, CreateMintAccountArgs};
use crate::{EpochError, AUTHORITY_SEED};

#[derive(Accounts)]
pub struct WnsCpi<'info> {
    // new signer
    #[account(mut)]
    pub payer: Signer<'info>,

    // MY PDA
    #[account(
        mut,
        seeds = [AUTHORITY_SEED.as_bytes()],
        bump,
    )]
    /// CHECK: can be any account
    pub authority: UncheckedAccount<'info>,

    #[account()]
    /// CHECK: can be any account
    pub receiver: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: can be any account
    pub mint: Signer<'info>,

    #[account(mut)]
    /// CHECK: must be ata reciever/mint
    pub mint_token_account: UncheckedAccount<'info>,
    /// CHECK: This account's data is a buffer of TLV data

    /// CHECK: Need to metaseed, mint, WNS pda

    /*         init_if_needed,
           space = get_meta_list_size(None),
           seeds = [META_LIST_ACCOUNT_SEED, mint.key().as_ref()],
           bump,
           payer = payer,
    */
    #[account(mut)]
    pub extra_metas_account: UncheckedAccount<'info>,

    #[account(
/*         seeds = [MANAGER_SEED],
        bump */
    )]
    /// CHECK: must be manager
    pub manager: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token2022>,
    /// CHECK: must be WNS
    pub wns_program: UncheckedAccount<'info>,
}

impl<'info> WnsCpi<'info> {
    pub fn handler(&self, authority_bump: u8) -> Result<()> {
        let instruction_data = CreateMintAccountArgs {
            name: "The Epochs".to_string(),
            symbol: "EPOCH".to_string(),
            uri: "https://something".to_string(),
        };

        wns_mint_nft(
            &self.payer,
            &self.authority,
            &self.receiver,
            &self.mint,
            &self.mint_token_account,
            &self.extra_metas_account,
            &self.manager,
            &self.system_program,
            &self.rent.to_account_info(),
            &self.associated_token_program,
            &self.token_program,
            &self.wns_program,
            authority_bump,
            instruction_data,
        )
    }
}
