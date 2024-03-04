use anchor_lang::prelude::*;

use crate::EpochError;

#[account]
pub struct Minter {
    pub items_available: u64,
    pub items_redeemed: u64,
    pub start_time: i64,
    pub active: bool,
    pub bump: u8,
}

impl Minter {
    pub fn get_size() -> usize {
        8 +     // discriminator
        8 +     // items_available
        8 +     // items_redeemed
        8 +     // start_time
        1 +     // active
        1       // bump
    }

    pub fn initialize(&mut self, minter_bump: u8, items_available: u64, start_time: i64) -> Result<()> {
        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp;
        let current_epoch = clock.epoch;
        require!(start_time > current_time, EpochError::MinterStartTimeInPast);
        require!(items_available > 0, EpochError::MinterEmpty);
        require!(items_available < current_epoch, EpochError::MinterTooManyItems);
        self.items_available = items_available;
        self.items_redeemed = 0;
        self.start_time = start_time;
        self.active = true;
        self.bump = minter_bump;
        Ok(())
    }

    fn is_active(&self) -> Result<()> {
        let current_time = Clock::get()?.unix_timestamp;
        require!(self.active, EpochError::MinterNotActive);
        require!(self.items_available > self.items_redeemed, EpochError::MinterEmpty);
        require!(current_time > self.start_time, EpochError::MinterNotStarted);
        Ok(())
    }

    pub fn redeem_item(&mut self) -> Result<()> {
        self.is_active()?;
        self.items_redeemed += 1;
        Ok(())
    }

    pub fn deactivate_minter(&mut self) -> Result<()> {
        self.active = false;
        Ok(())
    }

}
