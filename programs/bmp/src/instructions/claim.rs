/// The `AuctionClaim` instruction allows the auction winner to claim their prize (NFT) and 
/// distributes the auction's escrowed funds to the DAO treasury and the NFT creator. 
/// This instruction also updates the winner's reputation and marks the auction as claimed.
///
/// # Instruction Context
///
/// - `winner`: The account of the auction winner. Must be a signer and the high bidder of the auction.
/// - `auction`: The auction account that will be marked as claimed. It is seeded on the user-input epoch.
/// - `auction_escrow`: The escrow account holding the auction's funds, which will be distributed to the DAO treasury and the creator.
/// - `reputation`: The account storing the reputation for the winner, updated as a result of winning the auction.
/// - `dao_treasury`: The DAO treasury account receiving a portion of the auction's funds.
/// - `creator_wallet`: The NFT creator's wallet receiving a portion of the auction's funds.
/// - `mint`: The mint of the NFT being auctioned (this is seeded on the epoch)
/// - `source_ata`: The token account holding the NFT to be transferred to the winner.
/// - `destination_ata`: The winner's token account where the NFT will be transferred.
/// - `authority`: The program's authority used to sign transactions.
/// - `extra_metas_account`: Account holding extra metadata, used when adding royalty information.
/// - `wns_program`: The WNS program account, used for adding royalty information.
/// - `system_program`, `associated_token_program`, `token_program`, `rent`: System and SPL Token program accounts used for token transfers and account rent.
///
/// # Instruction Arguments
///
/// - `claim_epoch`: The epoch during which the claim is made. Used to verify the auction's timing constraints.
///
/// # Errors
///
/// This instruction may return the following errors:
///
/// - `EpochError::EpochMismatch`: If the `claim_epoch` does not match the auction's epoch.
/// - `EpochError::InvalidWinner`: If the `winner` account is not the high bidder in the auction.
/// - `EpochError::AuctionAlreadyClaimed`: If the auction state is not `UnClaimed`, indicating the prize has already been claimed.
/// - `EpochError::InvalidTreasury`: If the `dao_treasury` account does not match the expected DAO treasury pubkey.
/// - `EpochError::InvalidCreator`: If the `creator_wallet` account does not match the expected creator pubkey.
/// - `EpochError::Overflow` or `EpochError::Underflow`: In calculations related to fund distributions.
///


use anchor_lang::{prelude::*, system_program::{transfer, Transfer}};

use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::Token2022,
    token_interface::{
        Mint, 
        TokenAccount,
        TransferChecked, transfer_checked,
    },
};

use std::str::FromStr;

use crate::utils::{verify_epoch_has_passed, wns_add_royalties};
use crate::{constants::*, EpochError};
use crate::state::*;

#[derive(Accounts)]
#[instruction(claim_epoch: u64)]
pub struct AuctionClaim<'info> {

    /// Only winner can bid on an auction.
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
        address = Pubkey::from_str(DAO_TREASURY_WALLET).unwrap() @ EpochError::InvalidTreasury
    )]
    dao_treasury: SystemAccount<'info>,

    #[account(
        mut,
        address = Pubkey::from_str(CREATOR_WALLET).unwrap() @EpochError::InvalidCreator
    )]
    creator_wallet: SystemAccount<'info>,

    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,

    /// CHECK: Program Authority: The account that will be used to sign transactions
    #[account(
        mut,
        seeds = [AUTHORITY_SEED.as_bytes()],
        bump,
    )]
    pub authority: AccountInfo<'info>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = auction,
        associated_token::token_program = token_program
    )]
    pub source_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init,
        payer = winner,
        associated_token::mint = mint,
        associated_token::authority = winner,
        associated_token::token_program = token_program
    )]
    pub destination_ata: InterfaceAccount<'info, TokenAccount>,
    
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token2022>,

    /// CHECK: Extra Metas (PDA Validated in WNS Program)
    #[account(mut)]
    pub extra_metas_account: UncheckedAccount<'info>,
    
    pub rent: Sysvar<'info, Rent>,
    
    /// CHECK: must be WNS
    #[account(
        address = Pubkey::from_str(WNS_PROGRAM).unwrap()
    )]
    pub wns_program: UncheckedAccount<'info>,

}

impl AuctionClaim<'_> {
    pub fn handler(&mut self, claim_epoch: u64, auction_escrow_bump:u8, authority_bump: u8) -> Result<()> {
        self.verify_epoch(claim_epoch)?;
        self.verify_winner()?;
        self.verify_auction_state()?;
        self.distribute_funds(auction_escrow_bump)?;
        self.distribute_nft()?;
        self.add_royalty_hook(authority_bump)?;
        self.update_auction_and_reputation()?;
        Ok(())
    }

    /// Verifies that the claim epoch matches the auction's epoch and that the epoch has passed.
    pub fn verify_epoch(&self, claim_epoch: u64) -> Result<()> {
        require!(claim_epoch == self.auction.epoch, EpochError::EpochMismatch);
        verify_epoch_has_passed(self.auction.epoch)?;
        Ok(())
    }

    /// Verifies that the winner is the high bidder in the auction.
    pub fn verify_winner(&self) -> Result<()> {
        require!(self.auction.high_bidder == self.winner.key(), EpochError::InvalidWinner);
        Ok(())
    }

    /// Verifies that the auction is in the `UnClaimed` state.
    pub fn verify_auction_state(&self) -> Result<()> {
        require!(self.auction.state == AuctionState::UnClaimed, EpochError::AuctionAlreadyClaimed);
        Ok(())
    }

    /// Distributes the auction's escrowed funds to the DAO treasury and the NFT creator.
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


    /// Transfers the NFT from the auction's escrow account to the winner's token account.
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

    /// CPI to WNS to add royalty information to the NFT's metadata.
    pub fn add_royalty_hook(&self, authority_bump: u8) -> Result<()> {

        wns_add_royalties(
            &self.winner,
            &self.authority,
            &self.mint.to_account_info(),
            &self.extra_metas_account,
            &self.system_program,
            &self.rent.to_account_info(),
            &self.associated_token_program,
            &self.token_program,
            &self.wns_program,
            authority_bump
        )?;

        Ok(())
    }

    /// Updates the auction state and the reputation of the winner.
    pub fn update_auction_and_reputation(&mut self) -> Result<()> {
        let auction = & mut self.auction;
        let reputation = & mut self.reputation;
        auction.claim()?;
        reputation.increment_with_validation(Points::WIN, self.winner.key())?;
        Ok(())
    }
}