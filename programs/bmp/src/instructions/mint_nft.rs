use anchor_lang::prelude::*;

use anchor_spl::{
    associated_token::{self, AssociatedToken},
    token_2022::{MintTo, mint_to},
    token_interface::{spl_token_2022::extension::ExtensionType, Token2022},
};
use anchor_lang::solana_program::system_instruction;
use spl_token_metadata_interface::state::TokenMetadata;

use crate::utils::validate::get_and_validate_epoch;
use crate::constants::*;
use crate::state::*;

#[derive(Accounts)]
#[instruction(input_epoch: u64)]
pub struct MintNftInCollection<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init, 
        seeds = [EPOCH_INSCRIPTION_SEED.as_bytes(), &input_epoch.to_le_bytes()],
        bump, 
        payer = payer,
        space = EpochInscription::get_size(),
    )]
    pub epoch_inscription: Account<'info, EpochInscription>,

    #[account(
        init,
        seeds = [AUCTION_SEED.as_bytes(), &input_epoch.to_le_bytes()],
        bump, 
        payer = payer,
        space = Auction::get_size()
    )]
    pub auction: Account<'info, Auction>,

    #[account(
        init_if_needed,
        seeds = [REPUTATION_SEED.as_bytes(), payer.key().as_ref()],
        bump, 
        payer = payer,
        space = Reputation::get_size(),
    )]
    reputation: Account<'info, Reputation>,


    //---- Start of  Token 2022 Stuff 

    /// CHECK: Optional update authority, unchecked because it can either be SystemAccount or a PDA owned by another program
    //pub update_authority: Option<UncheckedAccount<'info>>,

    #[account(mut)]
    mint: Signer<'info>,

   /* #[account(mut
        // rather than the anchor macro below, 
        // we need to init in instruction
        // b/c mint is not yet initialized 
         init,
        payer = payer, 
        associated_token::mint = mint,
        associated_token::authority = auction,
        associated_token::token_program = token_program, 
    )]*/
    #[account(mut)]
    /// CHECK: dealing w/ some init issues
    auction_ata: UncheckedAccount<'info>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    token_program: Program<'info, Token2022>,

    

    // ---- End of Token 2022 Stuff

    pub system_program: Program<'info, System>,
}

pub fn handle_mint_nft(ctx: Context<MintNftInCollection>, input_epoch: u64) -> Result<()> {
    let payer = &ctx.accounts.payer;
    let token_program = &ctx.accounts.token_program;
    let mint = &ctx.accounts.mint;



    // ---- START OF TOKEN 2022 STUFF

    let token_metadata = TokenMetadata {
        name: String::from("EPOCH"),
        symbol: String::from("EPOCH"),
        uri: String::from("https://shdw-drive.genesysgo.net/GwJapVHVvfM4Mw4sWszkzywncUWuxxPd6s9VuFfXRgie/wen_meta.json"),
        mint: ctx.accounts.mint.key(),
        ..Default::default()
    };


    // Calculate data required for creating mint with
    // metadata extension and metadata account
    // extension_len is the length of the extension account data
    // instance_size is the length of the metadata
    let extension_len = ExtensionType::try_calculate_account_len::<
        anchor_spl::token_2022::spl_token_2022::state::Mint,
    >(&[ExtensionType::MetadataPointer])?;
    let instance_size = token_metadata.tlv_size_of().unwrap();


    // Initialize the Account for the mint
    let create_account_ix = system_instruction::create_account(
        payer.key,
        &mint.key(),
        Rent::get()?.minimum_balance(extension_len + instance_size ),
        extension_len as u64,
        token_program.key,
    );

    anchor_lang::solana_program::program::invoke(
        &create_account_ix,
        &[payer.to_account_info(), mint.to_account_info()],
    )?;

    //Create Metadata Pointer Extension -- point to self
    let init_metadata_pointer_ix =
    spl_token_2022::extension::metadata_pointer::instruction::initialize(
        &spl_token_2022::ID,
        &mint.key(),
        //TODO remove authority? or change to program...just for simple test
        Some(payer.key()),
        // we are using the native metadata implementation,
        // hence setting metadata address = mint address
        Some(mint.key()),
    )
    .unwrap();

    anchor_lang::solana_program::program::invoke(
        &init_metadata_pointer_ix,
        &[payer.to_account_info(), mint.to_account_info()],
    )?;


    // Initialize the new account as a Mint accou nt
    let init_mint_ix = spl_token_2022::instruction::initialize_mint2(
    &spl_token_2022::ID,
    &mint.key(),
    &payer.key(),
    None,
    0,
    )
    .unwrap();
    anchor_lang::solana_program::program::invoke(
        &init_mint_ix,
        &[payer.to_account_info(), mint.to_account_info()],
    )?;

    // Add metadata to the mint
    let init_metadata_ix = spl_token_metadata_interface::instruction::initialize(
        &spl_token_2022::ID,
        &mint.key(),
        &payer.key(),
        &mint.key(),
        &payer.key(),
        token_metadata.name,
        token_metadata.symbol,
        token_metadata.uri
    );

    anchor_lang::solana_program::program::invoke(
        &init_metadata_ix,
        &[payer.to_account_info(), mint.to_account_info()],
    )?;


                    
            

        // TODO apply program as authoirty
        // TODO write tests for this

     // create ATA for the user
     msg!("Writing to ATA");
     associated_token::create(CpiContext::new(
         ctx.accounts.associated_token_program.to_account_info(),
         {
             associated_token::Create {
                 payer: ctx.accounts.payer.to_account_info(),
                 associated_token: ctx.accounts.auction_ata.to_account_info(),
                 mint: ctx.accounts.mint.to_account_info(),
                 authority: ctx.accounts.auction.to_account_info(),
                 system_program: ctx.accounts.system_program.to_account_info(),
                 token_program: ctx.accounts.token_program.to_account_info(),
             }
         },
     ),)?;

 
      // mint to the payer's wallet
     msg!("Minting to user's wallet");
     mint_to(
        CpiContext::new(
            token_program.to_account_info(),
            MintTo {
                mint: mint.to_account_info(),
                to: ctx.accounts.auction_ata.to_account_info(),
                authority: payer.to_account_info(),
            },
        ),
        1,
    )?;

    // ---- END OF TOKEN 202

    let current_epoch = get_and_validate_epoch(input_epoch)?;
    let epoch_inscription: &mut Account<'_, EpochInscription> = &mut ctx.accounts.epoch_inscription;
    let payer: Pubkey = ctx.accounts.payer.key();
    let auction: &mut Account<'_, Auction> = &mut ctx.accounts.auction;
    let reputation: &mut Account<'_, Reputation> = &mut ctx.accounts.reputation;

    reputation.init_if_needed(payer, ctx.bumps.reputation);
    reputation.increment_with_validation(Points::INITIATE, payer.key())?;
    
    epoch_inscription.generate_and_set_asset(
        current_epoch, 
        payer, 
        ctx.bumps.epoch_inscription
    );

    auction.create(
        current_epoch,
        // TODO UPDATE WITH MINT OR RENAME
        epoch_inscription.key(),
        payer,
        ctx.bumps.auction,
    );



    Ok(())



}

