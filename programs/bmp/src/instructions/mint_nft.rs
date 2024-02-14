use anchor_lang::prelude::*;

use crate::utils::*;
use crate::constants::*;

#[derive(Accounts)]
pub struct MintNftInCollection<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init, 
        space = 8000,
        payer = user
    )]
    pub pda: Box<Account<'info, Bmp>>,




    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,

}

pub fn handler(ctx: Context<MintNftInCollection>) -> Result<()> {
    let current_epoch = Clock::get()?.epoch;
    let (hat_index, clothes_index, glasses_index , body_index, background) = select_traits((
        current_epoch, 
        ctx.accounts.user.key(),
        HEAD_GROUP.len() as u32,
        SHIRT_GROUP.len() as u32,
        LENS_GROUP.len() as u32,
        BODY_GROUP.len() as u32
    ));

    //let shadow = apply_shadow(background, 20);
    //let color_og = (255, 000, 246); 
    let mut epoch = create_epoch(
        &HEAD_GROUP[hat_index], 
        &SHIRT_GROUP[clothes_index], 
        &LENS_GROUP[glasses_index],
        BODY_GROUP[body_index]
    );
    //replace_pixels(&mut epoch, color_og, background);
    //replace_pixels(&mut epoch, (115, 115, 115), shadow);
    msg!("pixels swapped");
    let bmp_buffer = create_color_bmp_buffer(epoch,background);

    let bmp_account = &mut ctx.accounts.pda;
    bmp_account.buffer = bmp_buffer;

    Ok(())

}

//#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default, Eq, PartialEq, Debug)]
#[account]
pub struct Bmp {
    pub buffer: Vec<u8>
}
