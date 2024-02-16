use anchor_lang::prelude::*;

use crate::utils::*;
use crate::constants::*;
use crate::state::*;
use crate::error::*;

#[derive(Accounts)]
#[instruction(input_epoch: u64)]
pub struct MintNftInCollection<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init, 
        seeds = [EPOCH_INSCRIPTION_SEED.as_bytes(), &input_epoch.to_le_bytes()],
        bump, 
        payer = user,
        space = EpochInscription::get_size(),
    )]
    pub epoch_inscription: Account<'info, EpochInscription>,

    #[account(
        init,
        seeds = [AUCTION_SEED.as_bytes(), &input_epoch.to_le_bytes()],
        bump, 
        payer = user,
        space = Auction::get_size()
    )]
    pub auction: Account<'info, Auction>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<MintNftInCollection>, input_epoch: u64) -> Result<()> {
    let epoch_inscription: &mut Account<'_, EpochInscription> = &mut ctx.accounts.epoch_inscription;
    let auction = &mut ctx.accounts.auction;
    
    let current_epoch = Clock::get()?.epoch;
    require!(input_epoch == current_epoch, InscriptionError::InvalidEpoch);
    
    let (hat_index, clothes_index, glasses_index , body_index, background) = select_traits((
        current_epoch, 
        ctx.accounts.user.key(),
        HEAD_GROUP.len() as u32,
        SHIRT_GROUP.len() as u32,
        LENS_GROUP.len() as u32,
        BODY_GROUP.len() as u32
    ));

    let mut epoch = create_epoch(
        &HEAD_GROUP[hat_index], 
        &SHIRT_GROUP[clothes_index], 
        &LENS_GROUP[glasses_index],
        Box::new(BODY_GROUP[body_index])
    ); 
    replace_pixels(&mut epoch, GREEN_SCREEN, background);
    let bmp_buffer = create_color_bmp_buffer(&epoch);
    epoch_inscription.buffer.raw_data = bmp_buffer;
    epoch_inscription.epoch_id = current_epoch;
    epoch_inscription.bump = ctx.bumps.epoch_inscription;

    auction.create(
        current_epoch,
        // TODO UPDATE WITH MINT OR RENAME
        ctx.accounts.epoch_inscription.key(),
        ctx.bumps.auction,
        ctx.accounts.user.key(),
    );
    Ok(())

}