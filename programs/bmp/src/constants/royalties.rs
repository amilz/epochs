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


// TODO Replace with actual wallet addresses
#[constant]
pub const CREATOR_WALLET : &str = "zoMw7rFTJ24Y89ADmffcvyBqxew8F9AcMuz1gBd61Fa";

// TODO Replace with actual wallet addresses
#[constant]
pub const DAO_TREASURY_WALLET : &str = "zuVfy5iuJNZKf5Z3piw5Ho4EpMxkg19i82oixjk1axe";