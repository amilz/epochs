use anchor_lang::prelude::*;

use crate::utils::validate::get_and_validate_epoch;
use crate::constants::*;
use crate::state::*;

#[derive(Accounts)]
#[instruction(input_epoch: u64)]
pub struct OssInitAuction<'info> {
    #[account(mut, signer)]
    pub payer: SystemAccount<'info>,

    #[account(
        init,
        seeds = [AUCTION_SEED.as_bytes(), &input_epoch.to_le_bytes()],
        bump, 
        payer = payer,
        space = Auction::get_size()
    )]
    pub auction: Account<'info, Auction>,

    #[account(
        init_if_needed,
        seeds = [REPUTATION_SEED.as_bytes(), payer.key().as_ref()],
        bump, 
        payer = payer,
        space = Reputation::get_size(),
    )]
    pub reputation: Account<'info, Reputation>,

    /// CHECK: TODO ADD VALIDATION
    pub asset: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> OssInitAuction<'info> {
    pub fn handler (&mut self, 
        input_epoch: u64, 
        auction_bump: u8,
        reputation_bump: u8,
    ) -> Result<()> {
        let current_epoch = get_and_validate_epoch(input_epoch)?;
        let payer = self.payer.key();
        let asset = self.asset.to_account_info();
        let auction: &mut Account<'_, Auction> = &mut self.auction;
        let reputation: &mut Account<'_, Reputation> = &mut self.reputation;

        // TODO CHECK THAT ASSET IS INITIALIZED
        // VALIDATE EPOCH

        auction.create(
            current_epoch,
            asset.key(),
            payer,
            auction_bump,
        );

        reputation.init_if_needed(payer, reputation_bump);
        reputation.increment_with_validation(Points::INITIATE, payer.key())?;

        Ok(())
    }
}
