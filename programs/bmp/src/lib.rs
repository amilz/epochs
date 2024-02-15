use anchor_lang::prelude::*;
//use anchor_lang::solana_program::log::sol_log_compute_units;

pub mod utils;
pub mod constants;
pub mod instructions;
pub mod state;

pub use utils::traits::*;
pub use utils::heap::log_heap_usage;
pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("7s3va6xk3MHzL3rpqdxoVZKiNWdWcMEHgGi9FeFv1g8R");

#[program]
pub mod bmp {

    use super::*;

    pub fn create_collection_nft(ctx: Context<CreateCollectionNft>) -> Result<()> {
        create_collection_nft::handler(ctx)
    }

    pub fn mint_nft(ctx: Context<MintNftInCollection>) -> Result<()> {
        mint_nft::handler(ctx)
    }

}





