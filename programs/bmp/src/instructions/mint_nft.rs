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
        SetAndVerifySizedCollectionItemBuilder
    },
    types::DataV2,
};
use anchor_lang::solana_program::program::invoke_signed;
use mpl_inscription::{
    ID as INSCRIPTION_ID,
    instructions::{InitializeFromMintBuilder, WriteDataBuilder},
    accounts::MintInscription,
};

use crate::utils::*;
use crate::constants::*;

#[derive(Accounts)]
pub struct MintNftInCollection<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [COLLECTION_SEED.as_bytes()],
        bump,
    )]
    pub collection_mint: Account<'info, Mint>,

    /// CHECK: in program
    #[account(
        mut,
        address=MetadataAccount::find_pda(&collection_mint.key()).0
    )]
    pub collection_metadata_account: UncheckedAccount<'info>,

    /// CHECK: in program
    #[account(
        mut,
        address=MasterEdition::find_pda(&collection_mint.key()).0
    )]
    pub collection_master_edition: UncheckedAccount<'info>,

    #[account(
        init,
        payer = user,
        mint::decimals = 0,
        mint::authority = collection_mint,
        mint::freeze_authority = collection_mint
    )]
    pub nft_mint: Account<'info, Mint>,

    /// CHECK: in program
    #[account(
        mut,
        address=MetadataAccount::find_pda(&nft_mint.key()).0
    )]
    pub metadata_account: UncheckedAccount<'info>,

    /// CHECK: in program
    #[account(
        mut,
        address=MasterEdition::find_pda(&nft_mint.key()).0
    )]
    pub master_edition: UncheckedAccount<'info>,

    #[account(
        init,
        payer = user,
        associated_token::mint = nft_mint,
        associated_token::authority = user
    )]
    pub token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_metadata_program: Program<'info, Metadata>,
    pub rent: Sysvar<'info, Rent>,

    // *** INSCRIPTION ***

    /// CHECK: Address constraint
    #[account(address = INSCRIPTION_ID)]
    pub inscription_program: UncheckedAccount<'info>,
    /// CHECK: in program
    #[account(
        mut,
        address = MintInscription::find_pda(&nft_mint.key()).0,
    )]
    mint_inscription_account: UncheckedAccount<'info>,
    /// CHECK: in program
    #[account(
        mut,
        //address = InscriptionMetadata::find_pda(&nft_mint.key()).0,
    )]
    inscription_metadata_account: UncheckedAccount<'info>,
    /// CHECK: in program
    #[account(
        mut,
        //TODO possibly include the shard number as instruction data
        //address = InscriptionShard::find_pda(15).0,
    )]
    inscription_shard_account: UncheckedAccount<'info>,
}

pub fn handler(ctx: Context<MintNftInCollection>) -> Result<()> {
    let current_epoch = Clock::get()?.epoch;
    let (hat_index, clothes_index, glasses_index , body_index, background) = select_traits((
        current_epoch, 
        ctx.accounts.user.key(),
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
                mint: ctx.accounts.nft_mint.to_account_info(),
                to: ctx.accounts.token_account.to_account_info(),
                authority: ctx.accounts.collection_mint.to_account_info(),
            },
            signer_seeds,
        ),
        1,
    )?;

    let nft_data: DataV2 = DataV2 {
        name: NAME.to_string(),
        symbol: SYMBOL.to_string(),
        uri: URI.to_string(),
        seller_fee_basis_points: 0,
        // TODO: Add creators
        creators: None,
        collection: None,
        uses: None,
    };

    let create_metadata_ix = CreateMetadataAccountV3Builder::new()
        .metadata(ctx.accounts.metadata_account.to_account_info().key())
        .mint(ctx.accounts.nft_mint.to_account_info().key())
        .mint_authority(ctx.accounts.collection_mint.to_account_info().key())
        .payer(ctx.accounts.user.to_account_info().key())
        .update_authority(ctx.accounts.collection_mint.to_account_info().key(), true)
        .system_program(ctx.accounts.system_program.to_account_info().key())
        .rent(Some(ctx.accounts.rent.to_account_info().key()))
        .is_mutable(false)
        .data(nft_data)
        .instruction(); 

    invoke_signed(
        &create_metadata_ix,
        &[
            ctx.accounts.metadata_account.to_account_info(),
            ctx.accounts.nft_mint.to_account_info(),
            ctx.accounts.collection_mint.to_account_info(),
            ctx.accounts.user.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
        ],
        signer_seeds
    )?;

    let create_master_edition_ix = CreateMasterEditionV3Builder::new()
        .metadata(ctx.accounts.metadata_account.to_account_info().key())
        .mint(ctx.accounts.nft_mint.to_account_info().key())
        .edition(ctx.accounts.master_edition.to_account_info().key())
        .mint_authority(ctx.accounts.collection_mint.to_account_info().key())
        .update_authority(ctx.accounts.collection_mint.to_account_info().key())
        .payer(ctx.accounts.user.to_account_info().key())
        .token_program(ctx.accounts.token_program.to_account_info().key())
        .system_program(ctx.accounts.system_program.to_account_info().key())
        .rent(Some(ctx.accounts.rent.to_account_info().key()))
        .max_supply(0)
        .instruction();

    invoke_signed(
        &create_master_edition_ix,
        &[
            ctx.accounts.metadata_account.to_account_info(),
            ctx.accounts.nft_mint.to_account_info(),
            ctx.accounts.master_edition.to_account_info(),
            ctx.accounts.collection_mint.to_account_info(),
            ctx.accounts.user.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
        ],
        signer_seeds
    )?;
    
    let verify_collection_ix = SetAndVerifySizedCollectionItemBuilder::new()
        .metadata(ctx.accounts.metadata_account.to_account_info().key())
        .collection_authority(ctx.accounts.collection_mint.to_account_info().key())
        .payer(ctx.accounts.user.to_account_info().key())
        .update_authority(ctx.accounts.collection_mint.to_account_info().key())
        .collection_mint(ctx.accounts.collection_mint.to_account_info().key())
        .collection(ctx.accounts.collection_metadata_account.to_account_info().key())
        .collection_master_edition_account(ctx.accounts.collection_master_edition.to_account_info().key())
        .instruction();

    invoke_signed(
        &verify_collection_ix,
        &[
            ctx.accounts.metadata_account.to_account_info(),
            ctx.accounts.collection_mint.to_account_info(),
            ctx.accounts.user.to_account_info(),
            ctx.accounts.collection_metadata_account.to_account_info(),
            ctx.accounts.collection_master_edition.to_account_info(),
        ],
        signer_seeds
    )?;


    let inscribe_nft = InitializeFromMintBuilder::new()
        .mint_account(ctx.accounts.nft_mint.to_account_info().key())
        .system_program(ctx.accounts.system_program.to_account_info().key())
        .payer(ctx.accounts.user.to_account_info().key())
        .authority(Some(ctx.accounts.collection_mint.to_account_info().key()))
        .token_metadata_account(ctx.accounts.metadata_account.to_account_info().key())
        .mint_inscription_account(ctx.accounts.mint_inscription_account.to_account_info().key())
        .inscription_metadata_account(ctx.accounts.inscription_metadata_account.to_account_info().key())
        .inscription_shard_account(ctx.accounts.inscription_shard_account.to_account_info().key())
        .instruction();

    invoke_signed(
        &inscribe_nft,
        &[
            ctx.accounts.nft_mint.to_account_info(),
            ctx.accounts.user.to_account_info(),
            ctx.accounts.collection_mint.to_account_info(),
            ctx.accounts.metadata_account.to_account_info(),
            ctx.accounts.mint_inscription_account.to_account_info(),
            ctx.accounts.inscription_metadata_account.to_account_info(),
            ctx.accounts.inscription_shard_account.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
        signer_seeds
    )?;

    let write_data = WriteDataBuilder::new()
        .inscription_account(ctx.accounts.mint_inscription_account.to_account_info().key())
        .inscription_metadata_account(ctx.accounts.inscription_metadata_account.to_account_info().key())
        .payer(ctx.accounts.user.to_account_info().key())
        .authority(Some(ctx.accounts.collection_mint.to_account_info().key()))
        .value(bmp_buffer)
        .offset(0)
        .instruction();

    invoke_signed(
        &write_data,
        &[
            ctx.accounts.mint_inscription_account.to_account_info(),
            ctx.accounts.inscription_metadata_account.to_account_info(),
            ctx.accounts.user.to_account_info(),
            ctx.accounts.collection_mint.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
        signer_seeds
    )?;
    Ok(())

}

#[account]
pub struct Bmp {
    pub buffer: Vec<u8>
}