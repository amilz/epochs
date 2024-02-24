use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_2022::Token2022;

use crate::utils::{wns_create_group, CreateGroupAccountArgs};
use crate::{AUTHORITY_SEED, COLLECTION_SEED};

#[derive(Accounts)]
pub struct CreateCollectionNft<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    // This accoutable or a signer in the context of creating a group account.
    #[account(
        mut,
        seeds = [AUTHORITY_SEED.as_bytes()],
        bump,
    )]
    /// CHECK: can be any account
    pub authority: UncheckedAccount<'info>,

    /// CHECK: can be any account
    pub receiver: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: This account will hold the group data, make sure it is properly initialized.
    pub group: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [COLLECTION_SEED.as_bytes()],
        bump,
    )]
    /// CHECK: This should be a newly created mint account, owned by the group or another relevant account.
    pub mint: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: This should be an ATA for the mint, owned by the group or another relevant account.
    pub mint_token_account: UncheckedAccount<'info>,

    /// CHECK: Can be any account, likely used for permission checks or metadata.
    pub manager: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token2022>,
    
    /// CHECK: must be WNS
    pub wns_program: UncheckedAccount<'info>,
}

impl<'info> CreateCollectionNft<'info> {
    pub fn handler(&self, authority_bump: u8, mint_bump:u8) -> Result<()> {
        let group_account_args = CreateGroupAccountArgs {
            name: "GroupName".to_string(),
            symbol: "GRP".to_string(),
            uri: "https://groupinfo.example.com".to_string(),
            max_size: 100, // Example max size
        };

        wns_create_group(
            &self.payer,
            &self.authority,
            &self.receiver,
            &self.group,
            &self.mint,
            &self.mint_token_account,
            &self.manager,
            &self.system_program,
            &self.rent.to_account_info(),
            &self.associated_token_program,
            &self.token_program,
            &self.wns_program,
            authority_bump,
            mint_bump,
            group_account_args,
        )
    }
}
