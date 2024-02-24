use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token_2022::Token2022};

use crate::utils::validate::get_and_validate_epoch;
use crate::constants::*;
use crate::state::*;

use crate::utils::wns_mint_nft;
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


    #[account(
        mut,
        seeds = [NFT_MINT_SEED.as_bytes(), &input_epoch.to_le_bytes()],
        bump,
    )]
    /// CHECK: This should be a newly created mint account, owned by the group or another relevant account.
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

    /// NEW FOR WNS

    /// CHECK: must be ata auction/mint/token22/off-curve
    #[account(mut)]
    pub auction_ata: UncheckedAccount<'info>,

    /// CHECK: Need to metaseed, mint, WNS pda
    #[account(mut)]
    pub extra_metas_account: UncheckedAccount<'info>,

    /// CHECK: must be WNS manager
    pub manager: UncheckedAccount<'info>,

    /// CHECK: must be collection/group
    #[account(mut)]
    pub group: UncheckedAccount<'info>,

    /// CHECK: must be member
    #[account(mut)]
    pub member: UncheckedAccount<'info>,

    pub rent: Sysvar<'info, Rent>,
    
    /// CHECK: must be WNS
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
