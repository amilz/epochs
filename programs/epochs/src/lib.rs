use anchor_lang::prelude::*;

pub mod utils;
pub mod constants;
pub mod instructions;
pub mod state;
pub mod error;

pub use utils::traits::*;
pub use constants::*;
pub use instructions::{time_machine, *};
pub use state::*;
pub use error::*;

declare_id!("epoZLPTE49aXQ5WLem3W3Jr2thfVgZWFJwkRJZGBsfS");

#[program]
pub mod epochs {

    use super::*;

    pub fn create_group(ctx: Context<CreateGroup>) -> Result<()> {
        ctx.accounts.handler(ctx.bumps.authority, ctx.bumps.asset)
    }

    pub fn create_epoch(ctx: Context<CreateAsset>, input_epoch: u64) -> Result<()> {
        ctx.accounts.handler(ctx.bumps.authority, ctx.bumps.asset, ctx.bumps.reputation, ctx.bumps.auction, input_epoch)
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
        ctx.accounts.handler(ctx.bumps.receipt)
    }

    pub fn time_machine_claim(ctx: Context<TimeMachienCreateAndClaim>) -> Result<()> {
        ctx.accounts.handler(ctx.bumps.authority, ctx.bumps.asset)
    }

}





