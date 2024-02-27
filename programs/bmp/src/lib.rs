use anchor_lang::prelude::*;

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
        ctx.accounts.handler(ctx.bumps.authority, ctx.bumps.mint)
    }

    pub fn init_epoch(ctx: Context<InitEpoch>, input_epoch: u64) -> Result<()> {
        ctx.accounts.handler(input_epoch, ctx.bumps.epoch_inscription, ctx.bumps.auction, ctx.bumps.reputation, ctx.bumps.authority, ctx.bumps.mint)
    }

    pub fn bid(ctx: Context<AuctionBid>, input_epoch: u64, bid_amount: u64) -> Result<()> {
        ctx.accounts.handler(input_epoch, bid_amount, ctx.bumps.auction_escrow, ctx.bumps.reputation)
    }

    pub fn claim(ctx: Context<AuctionClaim>, input_epoch: u64) -> Result<()> {
        ctx.accounts.handler(input_epoch, ctx.bumps.auction_escrow, ctx.bumps.authority)
    }

    pub fn transfer_example(ctx: Context<TransferExample>) -> Result<()> {
        ctx.accounts.handler()
    }

}





