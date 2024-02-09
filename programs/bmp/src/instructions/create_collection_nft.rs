use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Token, TokenAccount, Mint, MintTo, mint_to},
    metadata::Metadata,
};
use mpl_token_metadata::{
    accounts::{Metadata as MetadataAccount, MasterEdition},
    instructions::{
        CreateMetadataAccountV3Builder,
        CreateMasterEditionV3Builder,
        SignMetadataBuilder
    },
    types::{DataV2, Creator, CollectionDetails},
};
use anchor_lang::solana_program::program::{invoke, invoke_signed};

use crate::COLLECTION_SEED;


#[derive(Accounts)]
pub struct CreateCollectionNft<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        seeds = [COLLECTION_SEED.as_bytes()],
        bump,
        payer = authority,
        mint::decimals = 0,
        mint::authority = collection_mint,
        mint::freeze_authority = collection_mint
    )]
    pub collection_mint: Account<'info, Mint>,

    /// UNCHECKED: Is checkd by the program
    #[account(
        mut,
        address = MetadataAccount::find_pda(&collection_mint.key()).0,
    )]
    pub collection_metadata_account: UncheckedAccount<'info>,

    /// UNCHECKED: Is checkd by the program
    #[account(
        mut,
        address = MasterEdition::find_pda(&collection_mint.key()).0,
    )]
    pub collection_master_edition: UncheckedAccount<'info>,

    #[account(
        init,
        payer = authority,
        associated_token::mint = collection_mint,
        associated_token::authority = collection_mint
    )]
    pub collection_token_account: Account<'info, TokenAccount>,
    pub token_metadata_program: Program<'info, Metadata>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}




pub fn handler(ctx: Context<CreateCollectionNft>) -> Result<()> {
    const NAME: &str = "The Epochs";
    const SYMBOL: &str = "EPOCH";
    const URI: &str = "https://arweave.net/PkmMMr2GNK3eraWcat-pl7BwGGUQN5QLEyzDtIjbYWI";

    // Collection Mint PDA for signing
    let bump: &[u8;1] = &[ctx.bumps.collection_mint];
    let seeds: &[&[u8]] = &[COLLECTION_SEED.as_bytes(), bump];
    let signer_seeds: &[&[&[u8]]] = &[&seeds[..]];

    // mint collection nft
    mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.collection_mint.to_account_info(),
                to: ctx.accounts.collection_token_account.to_account_info(),
                authority: ctx.accounts.collection_mint.to_account_info(),
            },
            signer_seeds,
        ),
        1,
    )?;

    let collection_data: DataV2 = DataV2 {
        name: NAME.to_string(),
        symbol: SYMBOL.to_string(),
        uri: URI.to_string(),
        seller_fee_basis_points: 0,
        creators: Some(vec![Creator {
            address: ctx.accounts.authority.key(),
            verified: false,
            share: 100,
        }]),
        collection: None,
        uses: None,
    };

    let create_metadata_ix = CreateMetadataAccountV3Builder::new()
        .metadata(ctx.accounts.collection_metadata_account.to_account_info().key())
        .mint(ctx.accounts.collection_mint.to_account_info().key())
        .mint_authority(ctx.accounts.collection_mint.to_account_info().key())
        .payer(ctx.accounts.authority.to_account_info().key())
        .update_authority(ctx.accounts.collection_mint.to_account_info().key(), true)
        .system_program(ctx.accounts.system_program.to_account_info().key())
        .rent(Some(ctx.accounts.rent.to_account_info().key()))
        .is_mutable(false)
        .collection_details(CollectionDetails::V1 { size: 0 })
        .data(collection_data)
        .instruction(); 

    invoke_signed(
        &create_metadata_ix,
        &[
            ctx.accounts.collection_metadata_account.to_account_info(),
            ctx.accounts.collection_mint.to_account_info(),
            ctx.accounts.authority.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
        ],
        signer_seeds,
    )?; 

    let create_master_edition_ix = CreateMasterEditionV3Builder::new()
        .metadata(ctx.accounts.collection_metadata_account.to_account_info().key())
        .mint(ctx.accounts.collection_mint.to_account_info().key())
        .edition(ctx.accounts.collection_master_edition.to_account_info().key())
        .mint_authority(ctx.accounts.collection_mint.to_account_info().key())
        .update_authority(ctx.accounts.collection_mint.to_account_info().key())
        .payer(ctx.accounts.authority.to_account_info().key())
        .token_program(ctx.accounts.token_program.to_account_info().key())
        .system_program(ctx.accounts.system_program.to_account_info().key())
        .rent(Some(ctx.accounts.rent.to_account_info().key()))
        .max_supply(0)
        .instruction();
        
    invoke_signed(
        &create_master_edition_ix,
        &[
            ctx.accounts.collection_metadata_account.to_account_info(),
            ctx.accounts.collection_mint.to_account_info(),
            ctx.accounts.collection_master_edition.to_account_info(),
            ctx.accounts.collection_mint.to_account_info(),
            ctx.accounts.collection_mint.to_account_info(),
            ctx.accounts.authority.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
        ],
        signer_seeds,
    )?;

    let sign_metadata_ix = SignMetadataBuilder::new()
        .metadata(ctx.accounts.collection_metadata_account.to_account_info().key())
        .creator(ctx.accounts.authority.to_account_info().key())
        .instruction();

    invoke(
        &sign_metadata_ix,
        &[
            ctx.accounts.collection_metadata_account.to_account_info(),
            ctx.accounts.authority.to_account_info(),
            ctx.accounts.token_metadata_program.to_account_info(),
        ],
    )?;

    Ok(())
}