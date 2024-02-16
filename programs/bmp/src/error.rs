use anchor_lang::prelude::*;


#[error_code]
pub enum InscriptionError {
    #[msg("Current Epoch does not match the supplied epoch")]
    InvalidEpoch,
}

#[error_code]
pub enum AuctionError {
    #[msg("zzz")]
    Zzz,
}