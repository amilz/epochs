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

declare_id!("epochsiFg8ornJS22urHE3jgveYuFydxPC79tdcbYc8");

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

    pub fn oss_create_blob(ctx: Context<OssCreate>, input_epoch: u64) -> Result<()> {
        ctx.accounts.generate_inscription(input_epoch, ctx.bumps.asset)
    }

    pub fn oss_create_rest(ctx: Context<OssCreate>, input_epoch: u64) -> Result<()> {
        ctx.accounts.create_asset_w_metadata(ctx.bumps.authority, ctx.bumps.asset, input_epoch)
    }

    pub fn oss_create_group(ctx: Context<OssCreateGroup>) -> Result<()> {
        ctx.accounts.handler(ctx.bumps.authority, ctx.bumps.asset)
    }

    pub fn oss_init_auction(ctx: Context<OssInitAuction>, input_epoch: u64) -> Result<()> {
        ctx.accounts.handler(input_epoch, ctx.bumps.auction, ctx.bumps.reputation)
    }

    pub fn oss_claim(ctx: Context<OssClaim>, input_epoch: u64) -> Result<()> {
        ctx.accounts.handler(input_epoch, ctx.bumps.auction_escrow, ctx.bumps.authority)
    }

    pub fn oss_init_minter(ctx: Context<OssInitMinter>, items_available: u64, start_time: i64) -> Result<()> {
        ctx.accounts.handler(ctx.bumps.minter, items_available, start_time)
    }

    pub fn oss_minter_claim(ctx: Context<ClaimMint>) -> Result<()> {
        ctx.accounts.handler(ctx.bumps.minter_claim)
    }

}





