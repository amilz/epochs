use anchor_lang::prelude::*;

pub struct Royalties {
    pub creator: Pubkey,
    pub amount: u8
}

pub const MAIN_ROYALTIES: Royalties = Royalties {
    creator: Pubkey::new_from_array([0u8; 32]),
    amount: 100
};

pub const ALL_ROYALTIES: [Royalties; 1] = [MAIN_ROYALTIES];