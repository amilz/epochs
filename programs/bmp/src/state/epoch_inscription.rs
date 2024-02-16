use anchor_lang::prelude::*;

#[account]
pub struct EpochInscription {
    pub epoch_id: u64,
    pub bump: u8,
    pub buffer: EpochBuffer
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default, Eq, PartialEq, Debug)]
pub struct EpochBuffer {
    pub raw_data: Vec<u8>
}

impl EpochInscription {
    pub fn get_size() -> usize {
        8 +     // discriminator
        8 +     // epoch_id
        1 +     // bump
        4 +     // Vec<T> minimum length
        3126     // buffer of 32x32 .bmp
    }
}