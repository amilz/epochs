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

#[error_code]
pub enum ReputationError {
    #[msg("Contributor does not match signer of the transaction")]
    InvalidContributor,
    #[msg("Reputation overflow")]
    Overflow,
}