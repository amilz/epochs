use anchor_lang::{prelude::*, solana_program::stake_history::Epoch};

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
        1       // bump
    }

    pub fn create(&mut self, epoch: Epoch, mint: Pubkey, bump: u8, initiator: Pubkey) {
        self.epoch = epoch;
        self.mint = mint;
        self.state = AuctionState::UnClaimed;
        self.high_bidder = initiator;
        self.high_bid_lamports = 0;
        self.bump = bump;
    }

    pub fn claim(&mut self, ) {
        if self.state == AuctionState::Claimed {
            //return Err(ErrorCode::AuctionAlreadyClaimed.into());

        }
        self.state = AuctionState::Claimed;
    }

    pub fn bid(&mut self, bidder: Pubkey, amount: u64) {
        // DO IMPLEMENT BID THRESHOLDS
        if amount <= self.high_bid_lamports {
            //return Err(ErrorCode::BidTooLow.into());
        }
        self.high_bid_lamports = amount;
        self.high_bidder = bidder;
    }


}