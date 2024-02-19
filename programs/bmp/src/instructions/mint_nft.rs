use anchor_lang:: prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token_2022::Token2022};

use crate::utils::validate::get_and_validate_epoch;
use crate::constants::*;
use crate::state::*;

#[derive(Accounts)]
#[instruction(input_epoch: u64)]
pub struct MintNft<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init, 
        seeds = [EPOCH_INSCRIPTION_SEED.as_bytes(), &input_epoch.to_le_bytes()],
        bump, 
        payer = payer,
        space = EpochInscription::get_size(),
    )]
    pub epoch_inscription: Account<'info, EpochInscription>,

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
    reputation: Account<'info, Reputation>,


    //---- Start of  Token 2022 Stuff 

    // This assumes a random keypair used for minting. 
    // Might make sense to make a PDA to use for future signing
    #[account(mut)]
    pub mint: Signer<'info>,

    /// CHECK: Account is initialized by the instruction after mint is initialized
    #[account(mut)]
    pub auction_ata: AccountInfo<'info>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token2022>,

    

    // ---- End of Token 2022 Stuff

    pub system_program: Program<'info, System>,
}

pub fn handle_mint_nft(ctx: Context<MintNft>, input_epoch: u64) -> Result<()> {
    let current_epoch = get_and_validate_epoch(input_epoch)?;
    let epoch_inscription: &mut Account<'_, EpochInscription> = &mut ctx.accounts.epoch_inscription;
    let mint: &AccountInfo<'_> = &ctx.accounts.mint;
    let payer: Pubkey = ctx.accounts.payer.key();
    let auction: &mut Account<'_, Auction> = &mut ctx.accounts.auction;
    let reputation: &mut Account<'_, Reputation> = &mut ctx.accounts.reputation;
 
    reputation.init_if_needed(payer, ctx.bumps.reputation);
    reputation.increment_with_validation(Points::INITIATE, payer.key())?;
    
    // This will create the inscriptions and return the traits generated
    let traits = epoch_inscription.generate_and_set_asset(
        current_epoch, 
        payer, 
        ctx.bumps.epoch_inscription
    );
    
    // This will create the auction
    auction.create(
        current_epoch,
        mint.key(),
        payer,
        ctx.bumps.auction,
    );

    ctx.accounts.create_and_mint_nft(ctx.bumps.auction, input_epoch, traits)?;

    Ok(())

}

