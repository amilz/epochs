use anchor_lang::prelude::*;

#[error_code]
pub enum EpochError {
    #[msg("The supplied epoch is greater than the current epoch")]
    EpochInFuture,
    
    #[msg("The supplied epoch is less than the current epoch")]
    EpochInPast,
    
    #[msg("The supplied epoch does not match the current epoch")]
    InvalidEpoch,
}

#[error_code]
pub enum AuctionError {
    #[msg("Bid does not meet minimum bid threshold")]
    BidTooLow,
}

#[error_code]
pub enum ReputationError {
    #[msg("Contributor does not match signer of the transaction")]
    InvalidContributor,
    #[msg("Reputation overflow")]
    Overflow,
}