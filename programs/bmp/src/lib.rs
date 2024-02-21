use anchor_lang::prelude::*;
//use anchor_lang::solana_program::log::sol_log_compute_units;

pub mod utils;
pub mod constants;
pub mod instructions;
pub mod state;
pub mod error;

pub use utils::traits::*;
pub use utils::heap::log_heap_usage;
pub use constants::*;
pub use instructions::*;
pub use state::*;
pub use error::*;

declare_id!("7s3va6xk3MHzL3rpqdxoVZKiNWdWcMEHgGi9FeFv1g8R");

#[program]
pub mod bmp {

    use super::*;

    pub fn create_collection_nft(ctx: Context<CreateCollectionNft>) -> Result<()> {
        create_collection_nft::handle_create_collection(ctx)
    }

    pub fn init_epoch(ctx: Context<InitEpoch>, input_epoch: u64) -> Result<()> {
        init_epoch::handle_init_epoch(ctx, input_epoch)
    }

    pub fn bid(ctx: Context<AuctionBid>, input_epoch: u64, bid_amount: u64) -> Result<()> {
        bid::handle_bid(ctx, input_epoch, bid_amount)
    }

    pub fn claim(ctx: Context<AuctionClaim>, input_epoch: u64) -> Result<()> {
        claim::handle_claim(ctx, input_epoch)
    }

}





