use crate::InscriptionError;
use anchor_lang::prelude::*;

pub fn get_and_validate_epoch(input_epoch: u64) -> Result<u64> {
    let current_epoch = Clock::get()?.epoch;
    require!(input_epoch == current_epoch, InscriptionError::InvalidEpoch);
    Ok(current_epoch)
}
