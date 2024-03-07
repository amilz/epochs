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

    // Initialization Errors
    #[msg("Inscribe the Asset before creating an asset")]
    AssetNotInscribed,

    // Auction Errors

    #[msg("Bid does not meet minimum bid threshold")]
    BidTooLow,

    #[msg("Previous bidder passed does not match the current high bidder")]
    InvalidPreviousBidder,

    #[msg("Signer did not win the auction")]
    InvalidWinner,

    #[msg("Auction has already been claimed")]
    AuctionAlreadyClaimed,

    #[msg("Invalid treasury account")]
    InvalidTreasury,

    #[msg("Invalid creator account")]
    InvalidCreator,

    // Reputation Errors

    #[msg("Contributor does not match signer of the transaction")]
    InvalidContributor,
    
    #[msg("Integer overflow")]
    Overflow,

    #[msg("Integer underflow")]
    Underflow,


    // OSS Errors

    #[msg("Invalid OSS Program")]
    InvalidOssProgram,

    // Minter Errors

    #[msg("Minter is not active")]
    MinterNotActive,

    #[msg("Minter is empty")]
    MinterEmpty,

    #[msg("Minter has not started")]
    MinterNotStarted,

    #[msg("Cannot start minter in the past")]
    MinterStartTimeInPast,

    #[msg("Minter cannot have more items than the current epoch")]
    MinterTooManyItems
}