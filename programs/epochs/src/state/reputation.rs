use anchor_lang::prelude::*;

use crate::EpochError;

#[account]
pub struct Reputation {
    pub contributor: Pubkey,
    pub reputation: u64,
    pub initialized: bool,
    pub bump: u8,
}

impl Reputation {
    pub fn get_size() -> usize {
        8 +     // discriminator
        32 +    // contributor
        8 +     // reputation
        1 +     // initialized
        1       // bump
    }

    // Updated increment_with_validation method to use Result for error handling
    pub fn increment_with_validation(&mut self, amount: u64, contributor: Pubkey) -> Result<()> {
        require!(self.validate(contributor), EpochError::InvalidContributor);
        self.reputation = self
            .reputation
            .checked_add(amount)
            .ok_or_else(|| EpochError::Overflow)?;
        Ok(())
    }

    fn is_initialized(&self) -> bool {
        self.initialized
    }

    pub fn init_if_needed(&mut self, contributor: Pubkey, bump: u8) {
        if !self.is_initialized() {
            self.contributor = contributor;
            self.reputation = 0;
            self.initialized = true;
            self.bump = bump;
        }
    }

    fn validate(&self, contributor: Pubkey) -> bool {
        self.contributor == contributor
    }
}
