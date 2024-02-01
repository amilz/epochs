use anchor_lang::prelude::*;
use anchor_lang::solana_program::log::sol_log_compute_units;

pub mod utils;
pub mod constants;
pub use utils::traits::*;
pub use constants::*;

declare_id!("7s3va6xk3MHzL3rpqdxoVZKiNWdWcMEHgGi9FeFv1g8R");

#[program]
pub mod bmp {

    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        sol_log_compute_units();

        let pda = &mut ctx.accounts.pda;
        let current_epoch = Clock::get()?.epoch;
        let (hat_index, clothes_index, glasses_index , body_index, background) = select_traits((
            current_epoch, 
            ctx.accounts.signer.key(),
            HATS.len() as u32,
            CLOTHES.len() as u32,
            GLASSES.len() as u32,
            BODIES.len() as u32
        ));
        let shadow = apply_shadow(background, 20);
        let color_og = (169, 202, 232); 
        let mut epoch = create_epoch(
            &HATS[hat_index], 
            &CLOTHES[clothes_index], 
            &GLASSES[glasses_index],
            BODIES[body_index]
        );
        replace_pixels(&mut epoch, color_og, background);
        replace_pixels(&mut epoch, (136, 150, 164), shadow);
        msg!("pixels swapped");
        let bmp_buffer = create_color_bmp_buffer(epoch,background);
        pda.buffer = bmp_buffer;
        Ok(())
    }
}

#[account]
pub struct Bmp {
    pub buffer: Vec<u8>
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init, 
        space = 10000,
        payer = signer
    )]
    pub pda: Account<'info, Bmp>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}











