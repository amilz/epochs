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

    pub fn mint_nft(ctx: Context<MintNft>, input_epoch: u64) -> Result<()> {
        mint_nft::handle_mint_nft(ctx, input_epoch)
    }

}





