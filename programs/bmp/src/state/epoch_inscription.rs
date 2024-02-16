use anchor_lang::prelude::*;

use crate::generate_asset;

#[account]
pub struct EpochInscription {
    pub epoch_id: u64,
    pub bump: u8,
    pub buffer: EpochBuffer,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default, Eq, PartialEq, Debug)]
pub struct EpochBuffer {
    pub raw_data: Vec<u8>,
}

impl EpochInscription {
    pub fn get_size() -> usize {
        8 +     // discriminator
        8 +     // epoch_id
        1 +     // bump
        4 +     // Vec<T> minimum length
        3126 // buffer of 32x32 .bmp
    }
    #[inline(never)]
    pub fn generate_and_set_asset(&mut self, current_epoch: u64, user: Pubkey, bump: u8) {
        self.buffer.raw_data = generate_asset(current_epoch, user);
        self.epoch_id = current_epoch;
        self.bump = bump;
    }

}
