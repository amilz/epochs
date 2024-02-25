use anchor_lang::prelude::*;

use crate::{generate_asset, utils::generate_json_metadata};

#[account]
pub struct EpochInscription {
    pub epoch_id: u64,
    pub bump: u8,
    pub buffers: EpochBuffers,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default, Eq, PartialEq, Debug)]
pub struct EpochBuffers {
    pub image_raw: Vec<u8>,
    pub json_raw: Vec<u8>,
}

impl EpochInscription {
    pub fn get_size() -> usize {
        8 +     // discriminator
        8 +     // epoch_id
        1 +     // bump
        4 +     // Vec<T> minimum length
        3126 +  // buffer of 32x32 .bmp
        600     // buffer of 1000 bytes for JSON (TODO: make dynamic) 500 seems to throw.  Sweet spot 500-600 but may change with mor metadata
    }
    #[inline(never)]
    pub fn generate_and_set_asset(&mut self, current_epoch: u64, user: Pubkey, bump: u8) -> (usize, usize, usize, usize, (u8,u8, u8)) {
        let assets = generate_asset(current_epoch, user);
        self.buffers.image_raw = assets.0;
        self.buffers.json_raw = generate_json_metadata(current_epoch, user, assets.1).unwrap();
        self.epoch_id = current_epoch;
        self.bump = bump;

        assets.1
    }

}