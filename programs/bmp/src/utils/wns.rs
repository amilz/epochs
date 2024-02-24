use anchor_lang::{ prelude::*, solana_program::{instruction::Instruction, program::invoke_signed}};

use crate::AUTHORITY_SEED;

//-------------------- MINT NFT --------------------

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct CreateMintAccountArgs {
    pub name: String,
    pub symbol: String,
    pub uri: String,
}

pub fn wns_mint_nft<'info>(
    payer: &AccountInfo<'info>,
    authority: &AccountInfo<'info>,
    receiver: &AccountInfo<'info>,
    mint: &AccountInfo<'info>,
    mint_token_account: &AccountInfo<'info>,
    extra_metas_account: &AccountInfo<'info>,
    manager: &AccountInfo<'info>,
    system_program: &AccountInfo<'info>,
    rent: &AccountInfo<'info>,
    associated_token_program: &AccountInfo<'info>,
    token_program: &AccountInfo<'info>,
    wns_program: &AccountInfo<'info>,
    authority_bump: u8,
    instruction_data: CreateMintAccountArgs,
) -> Result<()> {
    let instruction_discriminator = sighash("global", "create_mint_account");
    let authority_seeds = &[AUTHORITY_SEED.as_bytes(), &[authority_bump]];
    let authority_signer_seeds: &[&[&[u8]]] = &[&authority_seeds[..]];

    let account_metas = vec![
        AccountMeta::new(*payer.key, true),
        AccountMeta::new(*authority.key, true),
        AccountMeta::new_readonly(*receiver.key, false),
        AccountMeta::new(*mint.key, true),
        AccountMeta::new(*mint_token_account.key, false),
        AccountMeta::new(*extra_metas_account.key, false),
        AccountMeta::new_readonly(*manager.key, false),
        AccountMeta::new_readonly(*system_program.key, false),
        AccountMeta::new_readonly(*rent.to_account_info().key, false),
        AccountMeta::new_readonly(*associated_token_program.key, false),
        AccountMeta::new_readonly(*token_program.key, false),
        AccountMeta::new_readonly(*wns_program.key, false),
    ];

    let instr_data = (instruction_discriminator, instruction_data).try_to_vec().unwrap();

    invoke_signed(
        &Instruction {
            program_id: *wns_program.key,
            accounts: account_metas,
            data: instr_data,
        },
        &[
            payer.clone(),
            authority.clone(),
            receiver.clone(),
            mint.clone(),
            mint_token_account.clone(),
            extra_metas_account.clone(),
            manager.clone(),
            system_program.clone(),
            rent.clone(),
            associated_token_program.clone(),
            token_program.clone(),
            wns_program.clone(),
        ],
        authority_signer_seeds,
    )?;

    Ok(())
}

fn sighash(namespace: &str, name: &str) -> [u8; 8] {
    let preimage = format!("{}:{}", namespace, name);
    let hash = anchor_lang::solana_program::hash::hash(preimage.as_bytes());
    let mut sighash = [0u8; 8];
    sighash.copy_from_slice(&hash.to_bytes()[..8]);
    sighash
}


//-------------------- CREATE GROUP ACCOUNT --------------------

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct CreateGroupAccountArgs {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub max_size: u32,
}

pub fn wns_create_group<'info>(
    payer: &AccountInfo<'info>,
    authority: &AccountInfo<'info>,
    receiver: &AccountInfo<'info>,
    group: &AccountInfo<'info>,
    mint: &AccountInfo<'info>,
    mint_token_account: &AccountInfo<'info>,
    manager: &AccountInfo<'info>,
    system_program: &AccountInfo<'info>,
    rent: &AccountInfo<'info>,
    associated_token_program: &AccountInfo<'info>,
    token_program: &AccountInfo<'info>,
    wns_program: &AccountInfo<'info>,
    authority_bump: u8,
    args: CreateGroupAccountArgs,
) -> Result<()> {
    let instruction_discriminator = sighash("global", "create_group_account");

    // Assuming AUTHORITY_SEED and authority_bump are defined elsewhere in your program.
    let authority_seeds = &[AUTHORITY_SEED.as_bytes(), &[authority_bump]];
    let authority_signer_seeds: &[&[&[u8]]] = &[&authority_seeds[..]];

    let account_metas = vec![
        AccountMeta::new(*payer.key, true),
        AccountMeta::new_readonly(*authority.key, true),
        AccountMeta::new_readonly(*receiver.key, false),
        AccountMeta::new(*group.key, false),
        AccountMeta::new(*mint.key, true),
        AccountMeta::new(*mint_token_account.key, false),
        AccountMeta::new_readonly(*manager.key, false),
        AccountMeta::new_readonly(*system_program.key, false),
        AccountMeta::new_readonly(*rent.to_account_info().key, false),
        AccountMeta::new_readonly(*associated_token_program.key, false),
        AccountMeta::new_readonly(*token_program.key, false),
        AccountMeta::new_readonly(*wns_program.key, false),
    ];

    let instr_data = (instruction_discriminator, args).try_to_vec().unwrap();

    invoke_signed(
        &Instruction {
            program_id: *wns_program.key, // Adjust if the program_id should be different
            accounts: account_metas,
            data: instr_data,
        },
        &[
            payer.clone(),
            authority.clone(),
            receiver.clone(),
            group.clone(),
            mint.clone(),
            mint_token_account.clone(),
            manager.clone(),
            system_program.clone(),
            rent.clone(),
            associated_token_program.clone(),
            token_program.clone(),
            wns_program.clone(),
        ],
        authority_signer_seeds,
    )?;

    Ok(())
}

