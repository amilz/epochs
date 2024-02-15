use anchor_lang::prelude::*;

use crate::bmp;
use crate::utils::*;
use crate::constants::*;
use crate::state::*;

#[derive(Accounts)]
pub struct MintNftInCollection<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init, 
        space = EpochInscription::get_size(),
        payer = user
    )]
    pub pda: Account<'info, EpochInscription>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<MintNftInCollection>) -> Result<()> {
    let current_epoch = Clock::get()?.epoch;
    let bmp_account = &mut ctx.accounts.pda;


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
    replace_pixels(&mut epoch, (255, 000, 246), background);
    let bmp_buffer = create_color_bmp_buffer(&epoch);
    bmp_account.buffer.raw_data = bmp_buffer;
    bmp_account.epoch_id = current_epoch;
    Ok(())

}

