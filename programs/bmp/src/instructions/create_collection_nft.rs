/// The `CreateCollectionNft` instruction facilitates the creation of the Epochs Collection NFT (intended to only be used once and then can remove ix)
/// This is achieved through a CPI to the WNS token_program
///
/// # Instruction Context
///
/// - `payer`: The account responsible for paying transaction fees and any other associated costs. Must be a signer.
/// - `authority`: The Program Derived Account (PDA) that acts as the authority for the collection, capable of signing transactions.
///   It is also used as the receiver for the collection NFT to maintain centralized control.
/// - `receiver`: the authoity account will hold the collection NFT.
/// - `group`: An account that will hold the metadata and state of the collection group. Initialized by the WNS program.
/// - `mint`: The mint account for the collection NFT, uniquely identified and constrained by the `COLLECTION_SEED`.
/// - `mint_token_account`: The Associated Token Account (ATA) for the collection NFT, expected to be owned by the collection group or the authority.
/// - `manager`: The WNS manager account, overseeing operations within the WNS program.
/// - `system_program`, `rent`, `associated_token_program`, `token_program`: Standard Solana and SPL programs required for account and token operations.
/// - `wns_program`: The WNS program account, responsible for handling domain and collection logic within the ecosystem.
///

use std::str::FromStr;

use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::Token2022,
};

use crate::utils::{wns_create_group, CreateGroupAccountArgs};
use crate::{AUTHORITY_SEED, COLLECTION_SEED, WNS_PROGRAM};

#[derive(Accounts)]
pub struct CreateCollectionNft<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    
    /// CHECK: Program Authority: The account that will be used to sign transactions
    #[account(
        mut,
        seeds = [AUTHORITY_SEED.as_bytes()],
        bump,
    )]
    pub authority: UncheckedAccount<'info>,

    /// CHECK: Set to be the same as the authority account
    #[account(
        address = authority.key()
    )]
    pub receiver: UncheckedAccount<'info>,

    /// CHECK: This account will hold the collection data (PDA Validated in WNS Program)
    #[account(mut)]
    pub group: UncheckedAccount<'info>,

    // Collection NFT Address is derived from the Collection Seed, so only 1 can be created
    /// CHECK: WNS inits it as a Mint Account
    #[account(
        mut,
        seeds = [COLLECTION_SEED.as_bytes()],
        bump,
    )]
    pub mint: UncheckedAccount<'info>,

    // ATA Validated by WNS (Owner: Authtority, Mint: Mint Account, Program: Token2022, Off-curve)
    /// CHECK: This should be an ATA for the mint, owned by the group or another relevant account.
    #[account(mut)]
    pub mint_token_account: UncheckedAccount<'info>,

    /// CHECK: WNS Manager Account (PDA Validated in WNS Program)
    pub manager: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token2022>,
    
    /// CHECK: must be WNS
    #[account(
        address = Pubkey::from_str(WNS_PROGRAM).unwrap()
    )]
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
            &self.authority,
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
