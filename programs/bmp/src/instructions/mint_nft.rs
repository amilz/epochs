use anchor_lang::prelude::*;

use crate::utils::validate::get_and_validate_epoch;
use crate::constants::*;
use crate::state::*;

#[derive(Accounts)]
#[instruction(input_epoch: u64)]
pub struct MintNftInCollection<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init, 
        seeds = [EPOCH_INSCRIPTION_SEED.as_bytes(), &input_epoch.to_le_bytes()],
        bump, 
        payer = user,
        space = EpochInscription::get_size(),
    )]
    pub epoch_inscription: Account<'info, EpochInscription>,

    #[account(
        init,
        seeds = [AUCTION_SEED.as_bytes(), &input_epoch.to_le_bytes()],
        bump, 
        payer = user,
        space = Auction::get_size()
    )]
    pub auction: Account<'info, Auction>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<MintNftInCollection>, input_epoch: u64) -> Result<()> {
    let current_epoch = get_and_validate_epoch(input_epoch)?;
    let epoch_inscription: &mut Account<'_, EpochInscription> = &mut ctx.accounts.epoch_inscription;
    let user: Pubkey = ctx.accounts.user.key();
    let auction: &mut Account<'_, Auction> = &mut ctx.accounts.auction;
    
    epoch_inscription.generate_and_set_asset(
        current_epoch, 
        user, 
        ctx.bumps.epoch_inscription
    );

    auction.create(
        current_epoch,
        // TODO UPDATE WITH MINT OR RENAME
        epoch_inscription.key(),
        user,
        ctx.bumps.auction,
    );

    Ok(())
}