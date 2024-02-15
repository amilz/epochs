use anchor_lang::prelude::*;

use crate::bmp;
use crate::utils::*;
use crate::constants::*;

#[derive(Accounts)]
pub struct MintNftInCollection<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init, 
        space = 5000,
        payer = user
    )]
    pub pda: Account<'info, Bmp>,




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

    let epoch = create_epoch(
        &HEAD_GROUP[hat_index], 
        &SHIRT_GROUP[clothes_index], 
        &LENS_GROUP[glasses_index],
        Box::new(BODY_GROUP[body_index])
    ); 
    msg!("pixels swapped");
    let bmp_buffer = create_color_bmp_buffer(&epoch);
    bmp_account.on = true;
    msg!("bmp on");

    bmp_account.buffer.pixels = bmp_buffer;
    msg!("bmp buffer assigned");
    Ok(())

}

//#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default, Eq, PartialEq, Debug)]
#[account]
pub struct Bmp {
    pub on: bool,
    pub buffer: Epoch
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default, Eq, PartialEq, Debug)]
pub struct Epoch {
    pub pixels: Vec<u8>
}