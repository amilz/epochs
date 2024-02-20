use anchor_lang::prelude::*;

#[error_code]
pub enum EpochError {

    // Errors related to time/epoch

    #[msg("The input epoch is in the future, which is not allowed")]
    FutureEpochNotAllowed,
    
    #[msg("The input epoch is in the past, which is not allowed")]
    PastEpochNotAllowed,
    
    #[msg("The input epoch does not match the current epoch")]
    EpochMismatch,


    // Auction Errors

    #[msg("Bid does not meet minimum bid threshold")]
    BidTooLow,

    #[msg("Previous bidder passed does not match the current high bidder")]
    InvalidPreviousBidder,


    // Reputation Errors

    #[msg("Contributor does not match signer of the transaction")]
    InvalidContributor,
    
    #[msg("Reputation overflow")]
    Overflow,
}