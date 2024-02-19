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

use spl_token_metadata_interface::{
    state::{Field, TokenMetadata}, instruction::{
        initialize as init_metadata, 
        update_field as update_metadata_field
    }
};

use crate::{utils::format_pubkey, MintNft, AUCTION_SEED};

impl<'info> MintNft<'info> {
    fn update_metadata_field_and_invoke(
        &self,
        field_key: &str,
        field_value: &str,
        auction_signer_seeds: &[&[&[u8]]],
    ) -> Result<()> {
        let update_field_ix = update_metadata_field(
            &Token2022::id(),
            &self.mint.key(),
            &self.auction.key(),
            Field::Key(field_key.to_string()),
            field_value.to_string(),
        );

        invoke_signed(
            &update_field_ix,
            &[
                self.mint.to_account_info(),
                self.auction.to_account_info(),
            ],
            auction_signer_seeds,
        )?;

        Ok(())
    }
    pub fn create_and_mint_nft(
        &self, 
        auction_bump: u8, 
        current_epoch: u64,
        traits: (usize, usize, usize, usize, (u8,u8, u8))
    ) -> Result<()> {
        msg!("New Traits: {:?}", traits);

        let token_metadata = TokenMetadata {
            name: format!("Epoch #{}", current_epoch),
            symbol: String::from("EPOCH"),
            uri: format!("https://shdw-drive.genesysgo.net/somekey/{}.png", current_epoch).to_string(),
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
            Rent::get()?.minimum_balance(extension_len + instance_size + 1000),
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
        
        // Add traits
        let background_value = format!("R{},G{},B{}", traits.4 .0, traits.4 .1, traits.4 .2);

        self.update_metadata_field_and_invoke("epoch", &current_epoch.to_string(), auction_signer_seeds)?;
        self.update_metadata_field_and_invoke("creator", &format_pubkey(&self.payer.key()), auction_signer_seeds)?;
        self.update_metadata_field_and_invoke("hat", &traits.0.to_string(), auction_signer_seeds)?;
        self.update_metadata_field_and_invoke( "clothes", &traits.1.to_string(), auction_signer_seeds)?;
        self.update_metadata_field_and_invoke("glasses", &traits.2.to_string(), auction_signer_seeds)?;
        self.update_metadata_field_and_invoke("body", &traits.3.to_string(), auction_signer_seeds)?;
        self.update_metadata_field_and_invoke("background", &background_value, auction_signer_seeds)?;

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
