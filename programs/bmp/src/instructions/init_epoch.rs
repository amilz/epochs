use std::str::FromStr;

/// The `InitEpoch` instruction initializes a new epoch  NFT: This includes selecting traits, generating epoch inscriptions, 
/// setting up an auction for the epoch, updating the payer's reputation, minting a new NFT for the epoch, 
/// and adding the new NFT to the collection. 
///
/// # Instruction Context
///
/// - `payer`: The account initiating the new epoch. Must be a signer.
/// - `epoch_inscription`: A new account to store the inscription for the epoch, initialized here.
/// - `auction`: A new account to store the auction details for the epoch, initialized here.
/// - `reputation`: The reputation account for the payer, initialized if needed.
/// - `mint`: The mint account for the new NFT associated with the epoch.
/// - `authority`: The authority account, used for signing transactions related to the new epoch.
/// - `auction_ata`: The Associated Token Account for holding the auction's NFT.
/// - `extra_metas_account`: An account for storing extra metadata related to the epoch or NFT.
/// - `manager`: The manager account for the system, involved in administrative operations.
/// - `group`: The group account associated with the new epoch, typically related to the NFT or auction.
/// - `member`: The member account being added to the group in the new epoch.
/// - `system_program`, `rent`, `associated_token_program`, `token_program`: Standard Solana and SPL programs required for account and token operations.
/// - `wns_program`: The program account responsible for managing the overall system, including epochs, auctions, and NFTs.
///
/// # Arguments
///
/// - `input_epoch`: The identifier for the new epoch, typically a sequential number or timestamp.
///
/// # Functionality
///
/// This instruction performs several key operations to initiate a new epoch:
/// - Validates the input epoch to ensure it's the correct and expected epoch for the transition.
/// - Initializes the `epoch_inscription` and `auction` accounts with relevant details for the new epoch.
/// - Updates the `reputation` account of the payer to reflect their participation in initiating the epoch.
/// - Mints a new NFT representing the epoch and assigns it to the `auction_ata` for the upcoming auction.
/// - Adds a new member to the specified group, marking their participation in the new epoch.
///



use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token_2022::Token2022};

use crate::utils::validate::get_and_validate_epoch;
use crate::constants::*;
use crate::state::*;

use crate::utils::wns_mint_nft;
use crate::EpochError;
use crate::{
    utils::{
        wns_add_member, 
        CreateMintAccountArgs
    }, 
    AUTHORITY_SEED
};

#[derive(Accounts)]
#[instruction(input_epoch: u64)]
pub struct InitEpoch<'info> {

    /// Anybody can kick off a new epoch. 
    /// No constraits--just need to be a signer
    #[account(mut, signer)]
    pub payer: SystemAccount<'info>,


    /// PDA that will store the instricption for the epoch
    /// Seeded on user-input epoch (verified in program to be current epoch)
    /// See state/epoch_inscription.rs for more details
    #[account(
        init, 
        seeds = [EPOCH_INSCRIPTION_SEED.as_bytes(), &input_epoch.to_le_bytes()],
        bump, 
        payer = payer,
        space = EpochInscription::get_size(),
    )]
    pub epoch_inscription: Account<'info, EpochInscription>,

    /// PDA that will store the auction for the epoch
    /// Seeded on user-input epoch (verified in program to be current epoch)
    /// See state/auction.rs for more details
    #[account(
        init,
        seeds = [AUCTION_SEED.as_bytes(), &input_epoch.to_le_bytes()],
        bump, 
        payer = payer,
        space = Auction::get_size()
    )]
    pub auction: Account<'info, Auction>,

    /// PDA that will store the reputation for the user
    /// Seeded on user's pubkey
    /// Need to use `init_if_needed` bc we are not sure if the user has a reputation account
    /// See state/reputation.rs for more details
    #[account(
        init_if_needed,
        seeds = [REPUTATION_SEED.as_bytes(), payer.key().as_ref()],
        bump, 
        payer = payer,
        space = Reputation::get_size(),
    )]
    reputation: Account<'info, Reputation>,

    /// CHECK: New NFT Mint (will be init by WNS Program via CPI - address is derived based on epoch #)
    #[account(
        mut,
        seeds = [NFT_MINT_SEED.as_bytes(), &input_epoch.to_le_bytes()],
        bump,
    )]
    pub mint: UncheckedAccount<'info>,

    /// This will be the authority of the Token2022 NFT
    /// CHECK: Just a signer. Safe b/c of seeds/bump
    #[account(
        mut,
        seeds = [AUTHORITY_SEED.as_bytes()],
        bump,
    )]
    pub authority: AccountInfo<'info>,


    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,

    /// CHECK: must be ata auction/mint/token22/off-curve
    #[account(mut)]
    pub auction_ata: UncheckedAccount<'info>,

    /// CHECK: Extra Metas (PDA Validated in WNS Program)
    #[account(mut)]
    pub extra_metas_account: UncheckedAccount<'info>,

    /// CHECK: must be WNS manager (PDA Validated in WNS Program)
    pub manager: UncheckedAccount<'info>,

    /// CHECK: must be collection/group (PDA Validated in WNS Program)
    #[account(mut)]
    pub group: UncheckedAccount<'info>,

    /// CHECK: must be member (PDA Validated in WNS Program)
    #[account(mut)]
    pub member: UncheckedAccount<'info>,

    pub rent: Sysvar<'info, Rent>,
    
    /// CHECK: must be WNS
    #[account(
        address = Pubkey::from_str(WNS_PROGRAM).unwrap() @ EpochError::InvalidWnsProgram
    )]
    pub wns_program: UncheckedAccount<'info>,
}

impl<'info> InitEpoch<'info> {
    pub fn handler (&mut self, 
        input_epoch: u64, 
        epoch_inscription_bump: u8,
        auction_bump: u8,
        reputation_bump: u8,
        authority_bump: u8,
        mint_bump: u8,
    ) -> Result<()> {
        let current_epoch = get_and_validate_epoch(input_epoch)?;
        let epoch_inscription: &mut Account<'_, EpochInscription> = &mut self.epoch_inscription;
        let mint: &AccountInfo<'_> = &self.mint;
        let payer: Pubkey = self.payer.key();
        let auction: &mut Account<'_, Auction> = &mut self.auction;
        let reputation: &mut Account<'_, Reputation> = &mut self.reputation;

            
        // Create the inscriptions and return the traits generated
        let _traits = epoch_inscription.generate_and_set_asset(
            current_epoch, 
            payer, 
            epoch_inscription_bump
        );
        
        // Create the auction
        auction.create(
            current_epoch,
            mint.key(),
            payer,
            auction_bump,
        );

        // Add reputation to the payer
        reputation.init_if_needed(payer, reputation_bump);
        reputation.increment_with_validation(Points::INITIATE, payer.key())?;

        // Mint the WNS NFT and send it to the auction ATA
        self.mint_wns_nft(authority_bump, mint_bump, current_epoch)?;
        msg!("Succesful CPI to WNS");

        Ok(())
    }

    pub fn mint_wns_nft(
        &self,
        authority_bump: u8,
        mint_bump: u8,
        current_epoch: u64,
    ) -> Result<()> {

        let token_metadata = CreateMintAccountArgs {
            name: format!("Epoch #{}", current_epoch),
            symbol: String::from("EPOCH"),
            uri: format!(
                "https://shdw-drive.genesysgo.net/somekey/{}.png",
                current_epoch
            ).to_string(),
        };
        msg!("CPI TO WNS - MINT NFT");
        wns_mint_nft(
            &self.payer,
            &self.authority,
            &self.auction.to_account_info(),
            &self.mint,
            &self.auction_ata,
            &self.extra_metas_account,
            &self.manager,
            &self.system_program,
            &self.rent.to_account_info(),
            &self.associated_token_program,
            &self.token_program,
            &self.wns_program,
            authority_bump,
            mint_bump,
            current_epoch,
            token_metadata,
        )?;

        msg!("CPI TO WNS - ADD MEMBER");
        wns_add_member(
            &self.payer,
            &self.authority,
            &self.group,
            &self.member,
            &self.mint,
            &self.system_program,
            &self.token_program,
            &self.wns_program,
            authority_bump
        )?;

        Ok(())

    }
}
