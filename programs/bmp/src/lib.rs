use anchor_lang::prelude::*;

pub mod utils;
pub mod constants;
pub mod instructions;
pub mod state;
pub mod error;

pub use utils::traits::*;
pub use utils::heap::log_heap_usage;
pub use constants::*;
pub use instructions::{time_machine, *};
pub use state::*;
pub use error::*;

declare_id!("epochsiFg8ornJS22urHE3jgveYuFydxPC79tdcbYc8");

#[program]
pub mod bmp {

    use super::*;

    pub fn create_group(ctx: Context<CreateGroup>) -> Result<()> {
        ctx.accounts.handler(ctx.bumps.authority, ctx.bumps.asset)
    }

    pub fn inscribe_epoch(ctx: Context<CreateAsset>, input_epoch: u64) -> Result<()> {
        ctx.accounts.generate_inscription(input_epoch, ctx.bumps.asset)
    }

    pub fn create_epoch(ctx: Context<CreateAsset>, input_epoch: u64) -> Result<()> {
        ctx.accounts.create_asset_w_metadata(ctx.bumps.authority, ctx.bumps.asset, input_epoch)
    }

    pub fn auction_init(ctx: Context<AuctionInit>, input_epoch: u64) -> Result<()> {
        ctx.accounts.handler(input_epoch, ctx.bumps.auction, ctx.bumps.reputation)
    }

    pub fn auction_bid(ctx: Context<AuctionBid>, input_epoch: u64, bid_amount: u64) -> Result<()> {
        ctx.accounts.handler(input_epoch, bid_amount, ctx.bumps.auction_escrow, ctx.bumps.reputation)
    }

    pub fn auction_claim(ctx: Context<AuctionClaim>, input_epoch: u64) -> Result<()> {
        ctx.accounts.handler(input_epoch, ctx.bumps.auction_escrow, ctx.bumps.authority)
    }

    pub fn time_machine_init(ctx: Context<TimeMachineInit>, items_available: u64, start_time: i64) -> Result<()> {
        ctx.accounts.handler(ctx.bumps.time_machine, items_available, start_time)
    }

    pub fn time_machine_attempt(ctx: Context<TimeMachineAttempt>) -> Result<()> {
        ctx.accounts.handler(ctx.bumps.minter_claim)
    }

    pub fn time_machine_inscribe(ctx: Context<TimeMachienCreateAndClaim>) -> Result<()> {
        ctx.accounts.generate_inscription(ctx.bumps.asset)
    }

    pub fn time_machine_claim(ctx: Context<TimeMachienCreateAndClaim>) -> Result<()> {
        ctx.accounts.create_asset_w_metadata(ctx.bumps.authority, ctx.bumps.asset)
    }

}





