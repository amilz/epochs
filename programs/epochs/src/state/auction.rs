use anchor_lang::{
    prelude::*,
    solana_program:: stake_history::Epoch
};

use crate::EpochError;

#[account]
pub struct Auction {
    pub epoch: u64,
    pub mint: Pubkey,
    pub state: AuctionState,
    pub high_bidder: Pubkey,
    pub high_bid_lamports: u64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Copy, Clone, PartialEq, Eq)]
pub enum AuctionState {
    UnClaimed,
    Claimed,
}

impl Default for AuctionState {
    fn default() -> Self {
        Self::UnClaimed
    }
}

impl Auction {
    pub fn get_size() -> usize {
        8 +     // discriminator
        8 +     // epoch_id
        32 +    // mint
        2 +     // state
        32 +    // high_bidder
        8 +     // high_bid
        1 // bump
    }

    pub fn create(&mut self, epoch: Epoch, mint: Pubkey, initiator: Pubkey, bump: u8) {
        self.epoch = epoch;
        self.mint = mint;
        self.state = AuctionState::UnClaimed;
        self.high_bidder = initiator;
        self.high_bid_lamports = 0;
        self.bump = bump;
    }

    pub fn claim(&mut self) -> Result<()>{
        require!(self.state == AuctionState::UnClaimed, EpochError::AuctionAlreadyClaimed);
        self.state = AuctionState::Claimed;
        Ok(())
    }

    fn validate_bid(&self, bid_amount_lamports: u64) -> Result<()> {
        let min_bid = self.high_bid_lamports + 10_000_000;
        require!(self.state == AuctionState::UnClaimed, EpochError::AuctionAlreadyClaimed);
        require!(bid_amount_lamports >= min_bid, EpochError::BidTooLow);
        Ok(())
    }

    pub fn bid(&mut self, bidder: Pubkey, amount: u64) -> Result<()> {
        self.validate_bid(amount)?;
        self.high_bid_lamports = amount;
        self.high_bidder = bidder;
        Ok(())
    }
}
