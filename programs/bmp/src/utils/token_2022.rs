use anchor_lang::{
    prelude::*,
    solana_program::{
        system_instruction::create_account, 
        program::{invoke, invoke_signed}
    }
};

use anchor_spl::{
    associated_token::{self, create as create_ata},
    token_2022::{
        MintTo, 
        mint_to,
        spl_token_2022::{
            extension::metadata_pointer::instruction::initialize as init_metadata_pointer,
            instruction::initialize_mint2,
            state::Mint
        }
    },
    token_interface::{
        set_authority, spl_token_2022::{extension::ExtensionType, instruction::AuthorityType}, SetAuthority, Token2022
    },
};

use spl_token_metadata_interface::{state::TokenMetadata, instruction::initialize as init_metadata};

use crate::{MintNft, AUCTION_SEED};

impl<'info> MintNft<'info> {
    pub fn create_and_mint_nft(&self, auction_bump: u8, current_epoch: u64) -> Result<()> {

        let token_metadata = TokenMetadata {
            name: String::from("EPOCH"),
            symbol: String::from("EPOCH"),
            uri: String::from("https://shdw-drive.genesysgo.net/GwJapVHVvfM4Mw4sWszkzywncUWuxxPd6s9VuFfXRgie/wen_meta.json"),
            mint: self.mint.key(),
            ..Default::default()
        };


        // Calculate data required for creating mint with metadata extension and metadata account extension
        let extension_len = ExtensionType::try_calculate_account_len::<Mint>(&[ExtensionType::MetadataPointer])?;
        let instance_size = token_metadata.tlv_size_of().unwrap();

        // Initialize the Account for the mint
        let create_account_ix = create_account(
            &self.payer.key(),
            &self.mint.key(),
            Rent::get()?.minimum_balance(extension_len + instance_size),
            extension_len as u64,
            &Token2022::id(),
        );

        invoke(
            &create_account_ix,
            &[
                self.payer.to_account_info(),
                self.mint.to_account_info(),
            ],
        )?;

        // Initialize Metadata Pointer Extension
        let init_metadata_pointer_ix = init_metadata_pointer(
            &Token2022::id(),
            &self.mint.key(),
            None,
            Some(self.mint.key()),
        )?;

        invoke(
            &init_metadata_pointer_ix,
            &[
                self.payer.to_account_info(),
                self.mint.to_account_info(),
            ],
        )?;

        // Initialize the Mint account
        let init_mint_ix = initialize_mint2(
            &Token2022::id(),
            &self.mint.key(),
            &self.auction.key(),
            None,
            0,
        )?;

        invoke(
            &init_mint_ix,
            &[
                self.payer.to_account_info(),
                self.mint.to_account_info(),
            ],
        )?;

        // Initialize Metadata for the Mint
        let bump = &[auction_bump];
        let seeds = &[AUCTION_SEED.as_bytes(), &current_epoch.to_le_bytes(), bump];
        let auction_signer_seeds =  &[&seeds[..]];

        let init_metadata_ix = init_metadata(
            &Token2022::id(),
            &self.mint.key(),
            &self.auction.key(),
            &self.mint.key(),
            &self.auction.key(),
            token_metadata.name,
            token_metadata.symbol,
            token_metadata.uri,
        );

        invoke_signed(
            &init_metadata_ix,
            &[
                self.payer.to_account_info(),
                self.mint.to_account_info(),
                self.auction.to_account_info(),
            ],
            auction_signer_seeds,
        )?;

        // Create ATA for the user
        msg!("Creating ATA");
        create_ata(CpiContext::new(
            self.associated_token_program.to_account_info(),
            associated_token::Create {
                payer: self.payer.to_account_info(),
                associated_token: self.auction_ata.to_account_info(),
                mint: self.mint.to_account_info(),
                authority: self.auction.to_account_info(),
                system_program: self.system_program.to_account_info(),
                token_program: self.token_program.to_account_info(),
            },
        ))?;

        // Mint to the user's wallet
        msg!("Minting to user's wallet");
        mint_to(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                MintTo {
                    mint: self.mint.to_account_info(),
                    to: self.auction_ata.to_account_info(),
                    authority: self.auction.to_account_info(),
                },
                auction_signer_seeds,
            ),
            1,
        )?;

        // Set Mint Authority to None
        let authority_cpi_accounts = SetAuthority {
            current_authority: self.auction.to_account_info(),
            account_or_mint: self.mint.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            authority_cpi_accounts,
            auction_signer_seeds,
        );
        set_authority(cpi_ctx, AuthorityType::MintTokens, None)?;

        Ok(())
    }
}
