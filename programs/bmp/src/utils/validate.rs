use crate::EpochError;
use anchor_lang::prelude::*;

/// To be used with instructions only allowed within the current epoch
/// (e.g., MintNft, AuctionBid)
pub fn get_and_validate_epoch(input_epoch: u64) -> Result<u64> {
    let current_epoch = Clock::get()?.epoch;
    
    // Check if the input epoch is in the future
    require!(input_epoch <= current_epoch, EpochError::FutureEpochNotAllowed);

    // Check if the input epoch is in the past
    require!(input_epoch >= current_epoch, EpochError::PastEpochNotAllowed);

    // Should not ever need to fire this error (previous errors for more specificity in error msg)
    require!(input_epoch == current_epoch, EpochError::EpochMismatch);
    
    Ok(current_epoch)
}

pub fn verify_epoch_has_passed(input_epoch: u64) -> Result<()> {
    let current_epoch = Clock::get()?.epoch;
    require!(input_epoch <= current_epoch, EpochError::FutureEpochNotAllowed);

    Ok(())
}