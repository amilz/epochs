use anchor_lang::{prelude::*, solana_program::{instruction::Instruction, program::invoke_signed}, system_program::{transfer, Transfer}};

use nifty_asset::{
    instructions::TransferBuilder,
    ID as NiftyAssetID,
};

use std::str::FromStr;

use crate::utils::verify_epoch_has_passed;
use crate::{constants::*, EpochError};
use crate::state::*;

#[derive(Accounts)]
#[instruction(claim_epoch: u64)]
pub struct AuctionClaim<'info> {
    #[account(mut, signer)]
    winner: SystemAccount<'info>,

    #[account(
        mut,
        seeds = [AUCTION_SEED.as_bytes(), &claim_epoch.to_le_bytes()],
        bump = auction.bump,
        constraint = auction.high_bidder == winner.key() @ EpochError::InvalidWinner,
    )]
    auction: Account<'info, Auction>,

    #[account(
        mut,
        seeds = [AUCTION_ESCROW_SEED.as_ref()],
        bump
    )]
    pub auction_escrow: SystemAccount<'info>,

    #[account(
        mut,
        seeds = [REPUTATION_SEED.as_bytes(), winner.key().as_ref()],
        bump = reputation.bump, 
    )]
    reputation: Account<'info, Reputation>,

    system_program: Program<'info, System>,

    #[account(
        mut,
        address = Pubkey::from_str(DAO_TREASURY_WALLET).unwrap() @ EpochError::InvalidTreasury
    )]
    dao_treasury: SystemAccount<'info>,

    #[account(
        mut,
        address = Pubkey::from_str(CREATOR_WALLET_1).unwrap() @EpochError::InvalidCreator
    )]
    creator1_wallet: SystemAccount<'info>,

    #[account(
        mut,
        address = Pubkey::from_str(CREATOR_WALLET_2).unwrap() @EpochError::InvalidCreator
    )]
    creator2_wallet: SystemAccount<'info>,


    /// CHECK: use bump seeds and validate on auction
    #[account(
        mut,
        seeds = [NFT_MINT_SEED.as_bytes(), &claim_epoch.to_le_bytes()],
        bump,
    )]
    pub asset: UncheckedAccount<'info>,

    /// CHECK: use bump seeds and validate on auction
    #[account(
        mut,
        seeds = [AUTHORITY_SEED.as_bytes()],
        bump,
    )]
    pub authority: AccountInfo<'info>,

    /// CHECK: use address constraint
    #[account(
        address = NiftyAssetID @ EpochError::InvalidOssProgram
    )]
    pub oss_program: UncheckedAccount<'info>,

    /// CHECK: Group Asset
    #[account(
        mut,
        seeds = [COLLECTION_SEED.as_bytes()],
        bump,
    )]
    pub group: UncheckedAccount<'info>,
}

impl AuctionClaim<'_> {
    pub fn handler(&mut self, claim_epoch: u64, auction_escrow_bump:u8, authority_bump: u8) -> Result<()> {
        self.validate_claim(claim_epoch)?;
        self.pay_rent()?;
        self.distribute_funds(auction_escrow_bump)?;
        self.distribute_nft(authority_bump)?;
        self.update_auction_and_reputation()?;
        Ok(())
    }

    fn validate_claim (&self, claim_epoch: u64) -> Result<()> {
        require!(claim_epoch == self.auction.epoch, EpochError::EpochMismatch);
        verify_epoch_has_passed(self.auction.epoch)?;
        require!(self.auction.high_bidder == self.winner.key(), EpochError::InvalidWinner);
        require!(self.auction.state == AuctionState::UnClaimed, EpochError::AuctionAlreadyClaimed);
        Ok(())
    }

    fn pay_rent(&self) -> Result<()> {
        let asset_lamports = self.asset.lamports();
        let auction_lamports = self.auction.to_account_info().lamports();
        // Use saturating add to prevent any weird scenario where somebody is sending lamports to these accounts
        let refund_amount: u64 = asset_lamports.saturating_add(auction_lamports).min(40000000);

        transfer(
            CpiContext::new(
                self.system_program.to_account_info(),
                Transfer {
                    from: self.winner.to_account_info(),
                    to: self.authority.to_account_info(),
                },
            ),
            refund_amount,
        )?;

        Ok(())
    }

    fn distribute_funds(&self, escrow_bump: u8) -> Result<()> {
        let escrow_balance: u64 = self.auction.high_bid_lamports;
        let dao_treasury_lamports = escrow_balance.checked_mul(80).ok_or_else(|| EpochError::Overflow)? / 100;
        let creator1_lamports = escrow_balance.checked_mul(5).ok_or_else(|| EpochError::Overflow)? / 100;
        let creator2_lamports = escrow_balance.checked_sub(dao_treasury_lamports)
            .ok_or_else(|| EpochError::Underflow)?
            .checked_sub(creator1_lamports)
            .ok_or_else(|| EpochError::Underflow)?;

        let bump = &[escrow_bump];
        let seeds: &[&[u8]] = &[AUCTION_ESCROW_SEED.as_ref(), bump];
        let signer_seeds = &[&seeds[..]];

        transfer(
            CpiContext::new(
                self.system_program.to_account_info(),
                Transfer {
                    from: self.auction_escrow.to_account_info(),
                    to: self.dao_treasury.to_account_info(),
                },
            ).with_signer(signer_seeds),
            dao_treasury_lamports,
        )?;

        transfer(
            CpiContext::new(
                self.system_program.to_account_info(),
                Transfer {
                    from: self.auction_escrow.to_account_info(),
                    to: self.creator1_wallet.to_account_info(),
                },
            ).with_signer(signer_seeds),
            creator1_lamports,
        )?;

        transfer(
            CpiContext::new(
                self.system_program.to_account_info(),
                Transfer {
                    from: self.auction_escrow.to_account_info(),
                    to: self.creator2_wallet.to_account_info(),
                },
            ).with_signer(signer_seeds),
            creator2_lamports,
        )?;

        Ok(())
    }


    fn distribute_nft(&self, authority_bump: u8) -> Result<()> {
        let bump = &[authority_bump];
        let seeds: &[&[u8]] = &[AUTHORITY_SEED.as_ref(), bump];
        let signer_seeds = &[&seeds[..]];

        let account_infos = vec![
            self.asset.to_account_info(),
            self.authority.to_account_info(),
            self.winner.to_account_info(),
            self.group.to_account_info(),
            self.oss_program.to_account_info(),
        ];

        let transfer_ix: Instruction = TransferBuilder::new()
            .asset(self.asset.key())
            .signer(self.authority.key())
            .recipient(self.winner.key())
            .group(Some(self.group.key()))
            .instruction();

        invoke_signed(&transfer_ix, &account_infos, signer_seeds)?;

        Ok(())
    }


    fn update_auction_and_reputation(&mut self) -> Result<()> {
        let auction = & mut self.auction;
        let reputation = & mut self.reputation;
        auction.claim()?;
        reputation.increment_with_validation(Points::WIN, self.winner.key())?;
        Ok(())
    }
}