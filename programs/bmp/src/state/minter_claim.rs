use anchor_lang::prelude::*;

#[account]
pub struct MinterClaim {
    pub claimer: Pubkey,
    pub epoch: u64,
    pub bump: u8,
}

impl MinterClaim {
    pub fn get_size() -> usize {
        8  +    // discriminator
        32 +    // claimer
        8  +    // epoch
        1       // bump
    }

    pub fn set(&mut self, claimer: Pubkey, epoch: u64, bump: u8) -> Result<()> {
        self.claimer = claimer;
        self.epoch = epoch;
        self.bump = bump;
        Ok(())
    }
}