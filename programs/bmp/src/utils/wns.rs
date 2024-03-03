use anchor_lang::{
    prelude::*,
    solana_program::{instruction::Instruction, program::invoke_signed},
};

use crate::{AUTHORITY_SEED, COLLECTION_SEED, CREATOR_WALLET_1, DAO_TREASURY_WALLET, NFT_MINT_SEED};

fn sighash(namespace: &str, name: &str) -> [u8; 8] {
    let preimage = format!("{}:{}", namespace, name);
    let hash = anchor_lang::solana_program::hash::hash(preimage.as_bytes());
    let mut sighash = [0u8; 8];
    sighash.copy_from_slice(&hash.to_bytes()[..8]);
    sighash
}

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
    mint_bump: u8,
    current_epoch: u64,
    instruction_data: CreateMintAccountArgs,
) -> Result<()> {
    let instruction_discriminator = sighash("global", "create_mint_account");
    let authority_seeds = &[AUTHORITY_SEED.as_bytes(), &[authority_bump]];
    let mint_seeds = &[NFT_MINT_SEED.as_bytes(),  &current_epoch.to_le_bytes(), &[mint_bump]];
    let combined_signer_seeds = &[&mint_seeds[..], &authority_seeds[..]];

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

    let instr_data = (instruction_discriminator, instruction_data)
        .try_to_vec()
        .unwrap();

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
        combined_signer_seeds,
    )?;

    Ok(())
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
    mint_bump: u8,
    args: CreateGroupAccountArgs,
) -> Result<()> {
    let instruction_discriminator = sighash("global", "create_group_account");

    let authority_seeds = &[AUTHORITY_SEED.as_bytes(), &[authority_bump]];
    let mint_seeds = &[COLLECTION_SEED.as_bytes(), &[mint_bump]];
    let combined_signer_seeds = &[&mint_seeds[..], &authority_seeds[..]];

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
        combined_signer_seeds,
    )?;

    Ok(())
}

// ------------------- ADD MEMBER TO GROUP --------------------


pub fn wns_add_member<'info>(
    payer: &AccountInfo<'info>,
    authority: &AccountInfo<'info>,
    group: &AccountInfo<'info>,
    member: &AccountInfo<'info>,
    mint: &AccountInfo<'info>,
    system_program: &AccountInfo<'info>,
    token_program: &AccountInfo<'info>,
    wns_program: &AccountInfo<'info>,
    authority_bump: u8,
) -> Result<()> {
    let instruction_discriminator = sighash("global", "add_group_to_mint");

    let authority_seeds = &[AUTHORITY_SEED.as_bytes(), &[authority_bump]];
    let authority_signer_seeds = &[&authority_seeds[..]];

    let account_metas = vec![
        AccountMeta::new(*payer.key, true),
        AccountMeta::new(*authority.key, true), 
        AccountMeta::new(*group.key, false),
        AccountMeta::new(*member.key, false),
        AccountMeta::new(*mint.key, false),
        AccountMeta::new_readonly(*system_program.key, false),
        AccountMeta::new_readonly(*token_program.key, false),
        AccountMeta::new_readonly(*wns_program.key, false),
    ];

    let instr_data = (instruction_discriminator).try_to_vec().unwrap();

    invoke_signed(
        &Instruction {
            program_id: *wns_program.key, // Adjust if the program_id should be different
            accounts: account_metas,
            data: instr_data,
        },
        &[
            payer.clone(),
            authority.clone(),
            group.clone(),
            member.clone(),
            mint.clone(),
            system_program.clone(),
            token_program.clone(),
            wns_program.clone(),
        ],
        authority_signer_seeds,
    )?;

    Ok(())
}

// ------------------- ADD TRANSFER HOOK --------------------

/* 

pub struct AddRoyalties<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        mint::token_program = token_program,
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,
    /// CHECK: This account's data is a buffer of TLV data
    #[account(
        seeds = [META_LIST_ACCOUNT_SEED, mint.key().as_ref()],
        bump,
    )]
    pub extra_metas_account: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token2022>,
}


*/

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct CreatorWithShare {
    pub address: String,
    pub share: u8,
}

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct AddRoyaltiesArgs {
    pub royalty_basis_points: u16,
    pub creators: Vec<CreatorWithShare>,
}

pub fn wns_add_royalties <'info>(
    payer: &AccountInfo<'info>,
    authority: &AccountInfo<'info>,
    mint: &AccountInfo<'info>,
    extra_metas_account: &AccountInfo<'info>,
    system_program: &AccountInfo<'info>,
    rent: &AccountInfo<'info>,
    associated_token_program: &AccountInfo<'info>,
    token_program: &AccountInfo<'info>,
    wns_program: &AccountInfo<'info>,
    authority_bump: u8,
) -> Result<()> {
    let instruction_discriminator = sighash("global", "add_royalties_to_mint");

    let authority_seeds = &[AUTHORITY_SEED.as_bytes(), &[authority_bump]];
    let authority_signer_seeds = &[&authority_seeds[..]];

    let creator_share: CreatorWithShare = CreatorWithShare {
        address: CREATOR_WALLET_1.to_string(),
        share: 20,
    };
    let dao_share: CreatorWithShare = CreatorWithShare {
        address: DAO_TREASURY_WALLET.to_string(),
        share: 80,
    };
    let royalties_args = AddRoyaltiesArgs {
        royalty_basis_points: 100,
        creators: vec![creator_share, dao_share],
    };

    let account_metas = vec![
        AccountMeta::new(*payer.key, true),
        AccountMeta::new(*authority.key, true), 
        AccountMeta::new(*mint.key, false),
        AccountMeta::new(*extra_metas_account.key, false), 
        AccountMeta::new_readonly(*system_program.key, false),
        AccountMeta::new_readonly(*rent.to_account_info().key, false),
        AccountMeta::new_readonly(*associated_token_program.key, false),
        AccountMeta::new_readonly(*token_program.key, false),
        AccountMeta::new_readonly(*wns_program.key, false),
    ];

    let instr_data = (instruction_discriminator, royalties_args).try_to_vec().unwrap();

    invoke_signed(
        &Instruction {
            program_id: *wns_program.key, // Adjust if the program_id should be different
            accounts: account_metas,
            data: instr_data,
        },
        &[
            payer.clone(),
            authority.clone(),
            mint.clone(),
            extra_metas_account.clone(),
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