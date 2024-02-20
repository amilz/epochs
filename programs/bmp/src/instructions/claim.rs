use anchor_lang:: prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TransferChecked, transfer_checked};
use anchor_spl::{associated_token::AssociatedToken, token_2022::Token2022};
use anchor_lang::system_program::{transfer, Transfer};
use std::str::FromStr;

use crate::utils::verify_epoch_has_passed;
use crate::{constants::*, EpochError};
use crate::state::*;

#[derive(Accounts)]
#[instruction(claim_epoch: u64)]
pub struct AuctionClaim<'info> {

    /// Anybody can bid on an auction.
    /// No constraits--just need to be a signer
    #[account(mut, signer)]
    winner: SystemAccount<'info>,

    /// We will update the auction PDA based on the bid
    /// Seeded on user-input epoch (verified in program to be current epoch)
    /// See state/auction.rs for more details
    #[account(
        mut,
        seeds = [AUCTION_SEED.as_bytes(), &claim_epoch.to_le_bytes()],
        bump = auction.bump,
        constraint = auction.high_bidder == winner.key() @ EpochError::InvalidWinner,
    )]
    auction: Account<'info, Auction>,

    /// The auction escrow account will disburse funds
    #[account(
        mut,
        seeds = [AUCTION_ESCROW_SEED.as_ref()],
        bump
    )]
    pub auction_escrow: SystemAccount<'info>,


    /// PDA that will store the reputation for the user
    /// Seeded on user's pubkey
    /// Since this person has already done a bid, we know they have a reputation account 
    /// therefore we can skip `init`
    /// See state/reputation.rs for more details
    #[account(
        mut,
        seeds = [REPUTATION_SEED.as_bytes(), winner.key().as_ref()],
        bump = reputation.bump, 
    )]
    reputation: Account<'info, Reputation>,

    system_program: Program<'info, System>,



    #[account(
        mut,
        address = Pubkey::from_str(DAO_TREASURY_WALLET).unwrap() 
    )]
    dao_treasury: SystemAccount<'info>,

    #[account(
        mut,
        address = Pubkey::from_str(CREATOR_WALLET).unwrap() 
    )]
    creator_wallet: SystemAccount<'info>,

    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,


    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = auction,
        associated_token::token_program = token_program
    )]
    pub source_ata: InterfaceAccount<'info, TokenAccount>,

    
    #[account(
        init_if_needed,
        payer = winner,
        associated_token::mint = mint,
        associated_token::authority = winner,
        associated_token::token_program = token_program
    )]
    pub destination_ata: InterfaceAccount<'info, TokenAccount>,
    

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token2022>,

}

pub fn handle_claim(ctx: Context<AuctionClaim>, claim_epoch: u64) -> Result<()> {

    ctx.accounts.verify_epoch(claim_epoch)?;
    ctx.accounts.verify_winner()?;
    ctx.accounts.verify_auction_state()?;
    ctx.accounts.distribute_funds(ctx.bumps.auction_escrow)?;
    ctx.accounts.distribute_nft()?;
    ctx.accounts.update_auction_and_reputation()?;

    Ok(())
}

impl AuctionClaim<'_> {
    pub fn verify_epoch(&self, claim_epoch: u64) -> Result<()> {
        require!(claim_epoch == self.auction.epoch, EpochError::EpochMismatch);
        verify_epoch_has_passed(self.auction.epoch)?;
        Ok(())
    }

    pub fn verify_winner(&self) -> Result<()> {
        require!(self.auction.high_bidder == self.winner.key(), EpochError::InvalidWinner);
        Ok(())
    }

    pub fn verify_auction_state(&self) -> Result<()> {
        require!(self.auction.state == AuctionState::UnClaimed, EpochError::AuctionAlreadyClaimed);
        Ok(())
    }
    pub fn distribute_funds(&self, escrow_bump: u8) -> Result<()> {
        let escrow_balance: u64 = self.auction.high_bid_lamports;
        let dao_treasury_lamports = escrow_balance.checked_mul(80).ok_or_else(|| EpochError::Overflow)? / 100;
        let creator_lamports = escrow_balance.checked_sub(dao_treasury_lamports).ok_or_else(|| EpochError::Underflow)?;
        
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
                    to: self.creator_wallet.to_account_info(),
                },
            ).with_signer(signer_seeds),
            creator_lamports,
        )?;

        Ok(())
    }

    pub fn distribute_nft(&self) -> Result<()> {
        let bump = &[self.auction.bump];
        let seeds: &[&[u8]] = &[AUCTION_SEED.as_ref(), &self.auction.epoch.to_le_bytes(), bump];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = TransferChecked {
            from: self.source_ata.to_account_info().clone(),
            mint: self.mint.to_account_info().clone(),
            to: self.destination_ata.to_account_info().clone(),
            authority: self.auction.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        let cpi_context = CpiContext::new(cpi_program, cpi_accounts).with_signer(signer_seeds);
        transfer_checked(cpi_context, 1, 0)?;

        Ok(())
    }

    pub fn update_auction_and_reputation(&mut self) -> Result<()> {
        let auction = & mut self.auction;
        let reputation = & mut self.reputation;
        auction.claim()?;
        reputation.increment_with_validation(Points::WIN, self.winner.key())?;
        Ok(())
    }
}