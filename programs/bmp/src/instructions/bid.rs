use anchor_lang:: prelude::*;

use crate::utils::validate::get_and_validate_epoch;
use crate::constants::*;
use crate::state::*;

#[derive(Accounts)]
#[instruction(input_epoch: u64)]
pub struct AuctionBid<'info> {

    /// Anybody can bid on an auction.
    /// No constraits--just need to be a signer
    #[account(mut)]
    bidder: Signer<'info>,


    /// We will update the auction PDA based on the bid
    /// Seeded on user-input epoch (verified in program to be current epoch)
    /// See state/auction.rs for more details
    #[account(
        mut,
        seeds = [AUCTION_SEED.as_bytes(), &input_epoch.to_le_bytes()],
        bump = auction.bump,
    )]
    auction: Account<'info, Auction>,

    /// PDA that will store the reputation for the user
    /// Seeded on user's pubkey
    /// Need to use `init_if_needed` bc we are not sure if the user has a reputation account
    /// See state/reputation.rs for more details
    #[account(
        init_if_needed,
        seeds = [REPUTATION_SEED.as_bytes(), bidder.key().as_ref()],
        bump, 
        payer = bidder,
        space = Reputation::get_size(),
    )]
    reputation: Account<'info, Reputation>,

    system_program: Program<'info, System>,
}

pub fn handle_bid(ctx: Context<AuctionBid>, input_epoch: u64, bid_amount: u64) -> Result<()> {
    let _current_epoch = get_and_validate_epoch(input_epoch)?;
    let auction = & mut ctx.accounts.auction;
    let reputation = & mut ctx.accounts.reputation;
    let bidder = ctx.accounts.bidder.key();

    let _ = auction.bid(
        bidder,
        bid_amount
    );

    reputation.init_if_needed(bidder, ctx.bumps.reputation);
    reputation.increment_with_validation(Points::BID, bidder)?;


    Ok(())
}

