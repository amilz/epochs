use anchor_lang:: prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token_2022::Token2022};

use crate::utils::validate::get_and_validate_epoch;
use crate::constants::*;
use crate::state::*;

#[derive(Accounts)]
#[instruction(input_epoch: u64)]
pub struct InitEpoch<'info> {

    /// Anybody can kick off a new epoch. 
    /// No constraits--just need to be a signer
    #[account(mut, signer)]
    pub payer: SystemAccount<'info>,


    /// PDA that will store the instricption for the epoch
    /// Seeded on user-input epoch (verified in program to be current epoch)
    /// See state/epoch_inscription.rs for more details
    #[account(
        init, 
        seeds = [EPOCH_INSCRIPTION_SEED.as_bytes(), &input_epoch.to_le_bytes()],
        bump, 
        payer = payer,
        space = EpochInscription::get_size(),
    )]
    pub epoch_inscription: Account<'info, EpochInscription>,

    /// PDA that will store the auction for the epoch
    /// Seeded on user-input epoch (verified in program to be current epoch)
    /// See state/auction.rs for more details
    #[account(
        init,
        seeds = [AUCTION_SEED.as_bytes(), &input_epoch.to_le_bytes()],
        bump, 
        payer = payer,
        space = Auction::get_size()
    )]
    pub auction: Account<'info, Auction>,

    /// PDA that will store the reputation for the user
    /// Seeded on user's pubkey
    /// Need to use `init_if_needed` bc we are not sure if the user has a reputation account
    /// See state/reputation.rs for more details
    #[account(
        init_if_needed,
        seeds = [REPUTATION_SEED.as_bytes(), payer.key().as_ref()],
        bump, 
        payer = payer,
        space = Reputation::get_size(),
    )]
    reputation: Account<'info, Reputation>,


    /// Mint of the NFT is  a random keypair used for minting.
    // Might make sense to make a PDA to use for future signing
    #[account(mut)]
    pub mint: Signer<'info>,

    /// This will be the authority of the Token2022 NFT
    /// CHECK: Just a signer. Safe b/c of seeds/bump
    #[account(
        mut,
        seeds = [AUTHORITY_SEED.as_bytes()],
        bump,
    )]
    pub authority: AccountInfo<'info>,


    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,

    /// NEW FOR WNS

    /// CHECK: must be ata auction/mint/token22/off-curve
    #[account(mut)]
    pub auction_ata: UncheckedAccount<'info>,

    /// CHECK: Need to metaseed, mint, WNS pda
    #[account(mut)]
    pub extra_metas_account: UncheckedAccount<'info>,

    /// CHECK: must be WNS manager
    pub manager: UncheckedAccount<'info>,

    pub rent: Sysvar<'info, Rent>,
    
    /// CHECK: must be WNS
    pub wns_program: UncheckedAccount<'info>,
}

pub fn handle_init_epoch(ctx: Context<InitEpoch>, input_epoch: u64) -> Result<()> {
    let current_epoch = get_and_validate_epoch(input_epoch)?;
    let epoch_inscription: &mut Account<'_, EpochInscription> = &mut ctx.accounts.epoch_inscription;
    let mint: &AccountInfo<'_> = &ctx.accounts.mint;
    let payer: Pubkey = ctx.accounts.payer.key();
    let auction: &mut Account<'_, Auction> = &mut ctx.accounts.auction;
    let reputation: &mut Account<'_, Reputation> = &mut ctx.accounts.reputation;
    
    // Create the inscriptions and return the traits generated
    let _traits = epoch_inscription.generate_and_set_asset(
        current_epoch, 
        payer, 
        ctx.bumps.epoch_inscription
    );
    
    // Create the auction
    auction.create(
        current_epoch,
        mint.key(),
        payer,
        ctx.bumps.auction,
    );

    // Add reputation to the payer
    reputation.init_if_needed(payer, ctx.bumps.reputation);
    reputation.increment_with_validation(Points::INITIATE, payer.key())?;

    // Mint the Token2022 NFT and send it to the auction ATA
    // ctx.accounts.create_and_mint_nft(ctx.bumps.authority, input_epoch, traits)?;
    ctx.accounts.mint_wns_nft(ctx.bumps.authority, current_epoch)?;
    msg!("Succesful CPI to WNS");
    Ok(())

}

