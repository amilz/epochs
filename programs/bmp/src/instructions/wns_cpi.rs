use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::Instruction;
use anchor_lang::solana_program::program::{invoke, invoke_signed};
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_2022::Token2022;

use crate::{EpochError, AUTHORITY_SEED};

#[derive(Accounts)]
pub struct WnsCpi<'info> {
    // new signer
    #[account(mut)]
    pub payer: Signer<'info>,

    // MY PDA
    #[account(
        mut,
        seeds = [AUTHORITY_SEED.as_bytes()],
        bump,
    )]
    /// CHECK: can be any account
    pub authority: UncheckedAccount<'info>,

    #[account()]
    /// CHECK: can be any account
    pub receiver: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: can be any account
    pub mint: Signer<'info>,

    #[account(mut)]
    /// CHECK: must be ata reciever/mint
    pub mint_token_account: UncheckedAccount<'info>,
    /// CHECK: This account's data is a buffer of TLV data

    /// CHECK: Need to metaseed, mint, WNS pda

    /*         init_if_needed,
           space = get_meta_list_size(None),
           seeds = [META_LIST_ACCOUNT_SEED, mint.key().as_ref()],
           bump,
           payer = payer,
    */
    #[account(mut)]
    pub extra_metas_account: UncheckedAccount<'info>,

    #[account(
/*         seeds = [MANAGER_SEED],
        bump */
    )]
    /// CHECK: must be manager
    pub manager: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token2022>,
    /// CHECK: must be WNS
    pub wns_program: UncheckedAccount<'info>,
}

impl<'info> WnsCpi<'info> {
    pub fn handler(&self, authority_bump: u8) -> Result<()> {

        let instruction_discriminator = sighash("global", "create_mint_account");
        let authority_bump = &[authority_bump];
        let authority_seeds = &[AUTHORITY_SEED.as_bytes(), authority_bump];
        let authority_signer_seeds = &[&authority_seeds[..]];

        let instruction_data = CreateMintAccountArgs {
            name: "The Epochs".to_string(),
            symbol: "EPOCH".to_string(),
            uri: "https://something".to_string(),
        };
        let mut instr_in_bytes: Vec<u8> = Vec::new();
        instruction_data.serialize(&mut instr_in_bytes)?;


        let account_metas = vec![
            AccountMeta::new(*self.payer.key, true),
            AccountMeta::new(*self.authority.key, true),
            AccountMeta::new_readonly(*self.receiver.key, false),
            AccountMeta::new(*self.mint.key, true),
            AccountMeta::new(*self.mint_token_account.key, false),
            AccountMeta::new(*self.extra_metas_account.key, false),
            AccountMeta::new_readonly(*self.manager.key, false),
            AccountMeta::new_readonly(*self.system_program.key, false),
            AccountMeta::new_readonly(*self.rent.to_account_info().key, false),
            AccountMeta::new_readonly(*self.associated_token_program.key, false),
            AccountMeta::new_readonly(*self.token_program.key, false),
            AccountMeta::new_readonly(*self.wns_program.key, false),
        ];
    

        invoke_signed(
            &Instruction {
                program_id: self.wns_program.key(),
                accounts: account_metas,
                data: (instruction_discriminator, instruction_data).try_to_vec().unwrap(),
            },
            &[
                self.payer.to_account_info(),
                self.authority.to_account_info(),
                self.receiver.to_account_info(),
                self.mint.to_account_info(),
                self.mint_token_account.to_account_info(),
                self.extra_metas_account.to_account_info(),
                self.manager.to_account_info(),
                self.system_program.to_account_info(),
                self.rent.to_account_info(),
                self.associated_token_program.to_account_info(),
                self.token_program.to_account_info(),
                self.wns_program.to_account_info(),
            ],
            authority_signer_seeds,
        )?;


        Ok(())
    }
}

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct CreateMintAccountArgs {
    pub name: String,
    pub symbol: String,
    pub uri: String,
}

pub fn anchor_sighash(name: &str) -> [u8; 8] {
    let namespace = "global";
    let preimage = format!("{}:{}", namespace, name);
    let mut sighash = [0u8; 8];
    sighash.copy_from_slice(
        &anchor_lang::solana_program::hash::hash(preimage.as_bytes()).to_bytes()[..8],
    );
    sighash
}

pub fn sighash(namespace: &str, name: &str) -> [u8; 8] {
    let preimage = format!("{}:{}", namespace, name);

    let mut sighash = [0u8; 8];
    sighash.copy_from_slice(
        &anchor_lang::solana_program::hash::hash(preimage.as_bytes()).to_bytes()
            [..8],
    );
    sighash
}
