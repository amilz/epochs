/// Represents the `AuctionBid` instruction, which allows anybody to bid on an auction.
/// This instruction updates the auction state, transfers funds to the auction escrow account,
/// returns funds to the previous high bidder, and updates the reputation of the bidder.
/// 
/// # Instruction Context
/// 
/// - `bidder`: The account of the bidder. Must be a signer.
/// - `auction`: The auction account to be updated based on the bid. The account is seeded on the user-input epoch.
/// - `auction_escrow`: The auction escrow account that holds the funds for the auction.
/// - `high_bidder`: The account of the previous high bidder. Their funds will be returned to them.
/// - `reputation`: The account that stores the reputation for the bidder. The account is seeded on the user's pubkey.
/// - `system_program`: The system program account.
/// 
/// # Instruction Arguments
///
/// - `input_epoch`: The user-input epoch used to seed the auction account.
/// - `bid_amount`: The amount of the bid in lamports.
/// 
/// # Errors
/// 
/// This instruction can return the following errors:
/// 
/// - `EpochError::InvalidPreviousBidder`: If the previous high bidder is not the expected account.
/// - `EpochError::BidTooLow`: If the bid amount is lower than the minimum bid amount.
/// - `EpochError::InvalidEpoch`: If the input epoch is invalid.
/// 

use anchor_lang:: prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

use crate::utils::validate::get_and_validate_epoch;
use crate::{constants::*, EpochError};
use crate::state::*;

#[derive(Accounts)]
#[instruction(input_epoch: u64)]
pub struct AuctionBid<'info> {

    /// Anybody can bid on an auction.
    /// No constraits--just need to be a signer
    #[account(mut, signer)]
    bidder: SystemAccount<'info>,

    /// We will update the auction PDA based on the bid
    /// Seeded on user-input epoch (verified in program to be current epoch)
    /// See state/auction.rs for more details
    #[account(
        mut,
        seeds = [AUCTION_SEED.as_bytes(), &input_epoch.to_le_bytes()],
        bump = auction.bump,
        has_one = high_bidder @ EpochError::InvalidPreviousBidder,
    )]
    auction: Account<'info, Auction>,

    /// The auction escrow account will hold the funds for the auction
    #[account(
        mut,
        seeds = [AUCTION_ESCROW_SEED.as_ref()],
        bump
    )]
    pub auction_escrow: SystemAccount<'info>,

    /// The previous high bidder will have their funds returned to them
    /// CHECK: This is checks in the has_one constraint above
    #[account(mut)]
    high_bidder: AccountInfo<'info>,

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
    get_and_validate_epoch(input_epoch)?;
    // Must do transfers before updating auction state to avoid reentrancy attacks

    ctx.accounts.transfer_funds_to_escrow(bid_amount)?;
    ctx.accounts.transfer_funds_to_previous_high_bidder(ctx.bumps.auction_escrow)?;
    ctx.accounts.update_auction_and_reputation(bid_amount, ctx.bumps.reputation)?;

    Ok(())
}

impl AuctionBid<'_> {
    pub fn handler(&mut self, 
        input_epoch: u64, 
        bid_amount: u64,
        escrow_bump: u8,
        reputation_bump: u8
    ) -> Result<()> {
        get_and_validate_epoch(input_epoch)?;

        self.transfer_funds_to_escrow(bid_amount)?;
        self.transfer_funds_to_previous_high_bidder(escrow_bump)?;
        self.update_auction_and_reputation(bid_amount, reputation_bump)?;

        Ok(())
    }

    /// Transfers the bid amount from the bidder to the auction escrow account.
    pub fn transfer_funds_to_escrow(&self, bid_amount: u64) -> Result<()>   {
        transfer(
            CpiContext::new(
                self.system_program.to_account_info(),
                Transfer {
                    from: self.bidder.to_account_info(),
                    to: self.auction_escrow.to_account_info(),
                },
            ),
            bid_amount,
        )?;
        Ok(())
    }
    
    /// Transfers the previous high bid amount from the auction escrow account to the previous high bidder.
    pub fn transfer_funds_to_previous_high_bidder(&self, escrow_bump: u8) -> Result<()> {
        require!(self.auction.high_bidder == self.high_bidder.key(), EpochError::InvalidPreviousBidder);
        let previous_high_bid_lamports = self.auction.high_bid_lamports;

        // Do this check b/c first bid is 0. 
        if previous_high_bid_lamports == 0 {
            return Ok(());
        }
        
        let bump = &[escrow_bump];
        let seeds: &[&[u8]] = &[AUCTION_ESCROW_SEED.as_ref(), bump];
        let signer_seeds = &[&seeds[..]];

        transfer(
            CpiContext::new(
                self.system_program.to_account_info(),
                Transfer {
                    from: self.auction_escrow.to_account_info(),
                    to: self.high_bidder.to_account_info(),
                },
            ).with_signer(signer_seeds),
            previous_high_bid_lamports,
        )?;
        Ok(())
    }
    
    /// Updates the auction state and the reputation of the bidder.
    pub fn update_auction_and_reputation(&mut self, bid_amount: u64, reputation_bump: u8) -> Result<()> {
        let auction = & mut self.auction;
        let reputation = & mut self.reputation;
        let bidder = self.bidder.key();

        auction.bid(
            bidder,
            bid_amount
        )?;

        reputation.init_if_needed(bidder, reputation_bump);
        reputation.increment_with_validation(Points::BID, bidder)?;
        Ok(())
    }

}