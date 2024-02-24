use anchor_lang::{
    prelude::*,
    solana_program::{
        program::{invoke, invoke_signed},
        system_instruction::create_account,
    },
};

use anchor_spl::token_2022::spl_token_2022::{
    extension::metadata_pointer::instruction::initialize as init_metadata_pointer,
    instruction::{initialize_mint2, initialize_mint_close_authority},
};

use spl_token_2022::{
    extension::{
        group_member_pointer::instruction::initialize as init_group_member_pointer,
        transfer_hook::instruction::initialize as init_transfer_hook, ExtensionType,
    },
    state::Mint,
};
use spl_token_metadata_interface::{
    instruction::{initialize as init_metadata, update_field as update_metadata_field},
    state::{Field, TokenMetadata},
};

use crate::{utils::{format_pubkey, CreateMintAccountArgs}, InitEpoch, ALL_ROYALTIES, AUTHORITY_SEED, ROYALTY_BASIS_POINTS_FIELD};

use super::wns_mint_nft;

impl<'info> InitEpoch<'info> {
    fn update_metadata_field_and_invoke(
        &self,
        field_key: &str,
        field_value: &str,
        authority_signer_seeds: &[&[&[u8]]],
    ) -> Result<()> {
        let update_field_ix = update_metadata_field(
            &self.token_program.key(),
            &self.mint.key(),
            &self.authority.key(),
            Field::Key(field_key.to_string()),
            field_value.to_string(),
        );

        invoke_signed(
            &update_field_ix,
            &[
                self.mint.to_account_info(),
                self.authority.to_account_info(),
            ],
            authority_signer_seeds,
        )?;

        Ok(())
    }
    pub fn create_and_mint_nft(
        &self,
        authority_bump: u8,
        current_epoch: u64,
        traits: (usize, usize, usize, usize, (u8, u8, u8)),
    ) -> Result<()> {
        msg!("New Traits: {:?}", traits);

        let token_metadata = TokenMetadata {
            name: format!("Epoch #{}", current_epoch),
            symbol: String::from("EPOCH"),
            uri: format!(
                "https://shdw-drive.genesysgo.net/somekey/{}.png",
                current_epoch
            )
            .to_string(),
            mint: self.mint.key(),
            ..Default::default()
        };

        // Calculate data required for creating mint with extensions
        let extension_len = ExtensionType::try_calculate_account_len::<Mint>(&[
            ExtensionType::MetadataPointer,
            ExtensionType::GroupMemberPointer,
            ExtensionType::MintCloseAuthority,
            ExtensionType::TransferHook,
        ])?;
        let instance_size = token_metadata.tlv_size_of().unwrap();

        // Initialize the Account for the mint
        let create_account_ix = create_account(
            &self.payer.key(),
            &self.mint.key(),
            Rent::get()?.minimum_balance(extension_len + instance_size + 300),
            extension_len as u64,
            &self.token_program.key(),
        );

        invoke(
            &create_account_ix,
            &[self.payer.to_account_info(), self.mint.to_account_info()],
        )?;

        // Initialize Metadata Pointer Extension
        let init_metadata_pointer_ix = init_metadata_pointer(
            &self.token_program.key(),
            &self.mint.key(),
            None,
            Some(self.mint.key()),
        )?;

        invoke(
            &init_metadata_pointer_ix,
            &[self.payer.to_account_info(), self.mint.to_account_info()],
        )?;

        // Initialize Mint Close Authority Extension
        let init_close_auth_ix = initialize_mint_close_authority(
            &self.token_program.key(),
            &self.mint.key(),
            Some(&self.authority.key()),
        )?;

        invoke(
            &init_close_auth_ix,
            &[self.payer.to_account_info(), self.mint.to_account_info()],
        )?;

        // Initialize Group Member Pointer Extension
        let init_group_member_pointer_ix = init_group_member_pointer(
            &self.token_program.key(),
            &self.mint.key(),
            None,
            Some(self.mint.key()),
        )?;

        invoke(
            &init_group_member_pointer_ix,
            &[self.payer.to_account_info(), self.mint.to_account_info()],
        )?;

        // Initialize Transfer Hook Extension
        let init_transfer_hook_ix = init_transfer_hook(
            &self.token_program.key(),
            &self.mint.key(),
            Some(self.authority.key()),
            None,
        )?;

        invoke(
            &init_transfer_hook_ix,
            &[self.payer.to_account_info(), self.mint.to_account_info()],
        )?;

        // Initialize the Mint account
        let init_mint_ix = initialize_mint2(
            &self.token_program.key(),
            &self.mint.key(),
            &self.authority.key(),
            None,
            0,
        )?;

        invoke(
            &init_mint_ix,
            &[self.payer.to_account_info(), self.mint.to_account_info()],
        )?;

        // get authority signer_seeds
        let authority_bump = &[authority_bump];
        let authority_seeds = &[AUTHORITY_SEED.as_bytes(), authority_bump];
        let authority_signer_seeds = &[&authority_seeds[..]];

        let init_metadata_ix = init_metadata(
            &self.token_program.key(),
            &self.mint.key(),
            &self.authority.key(),
            &self.mint.key(),
            &self.authority.key(),
            token_metadata.name,
            token_metadata.symbol,
            token_metadata.uri,
        );

        invoke_signed(
            &init_metadata_ix,
            &[
                self.payer.to_account_info(),
                self.mint.to_account_info(),
                self.authority.to_account_info(),
            ],
            authority_signer_seeds,
        )?;

        // Add traits
        let background_value = format!("R{},G{},B{}", traits.4 .0, traits.4 .1, traits.4 .2);

        self.update_metadata_field_and_invoke(
            "epoch",
            &current_epoch.to_string(),
            authority_signer_seeds,
        )?;
        self.update_metadata_field_and_invoke(
            "creator",
            &format_pubkey(&self.payer.key()),
            authority_signer_seeds,
        )?;
        self.update_metadata_field_and_invoke(
            "hat",
            &traits.0.to_string(),
            authority_signer_seeds,
        )?;
        self.update_metadata_field_and_invoke(
            "clothes",
            &traits.1.to_string(),
            authority_signer_seeds,
        )?;
        self.update_metadata_field_and_invoke(
            "glasses",
            &traits.2.to_string(),
            authority_signer_seeds,
        )?;
        self.update_metadata_field_and_invoke(
            "body",
            &traits.3.to_string(),
            authority_signer_seeds,
        )?;
        self.update_metadata_field_and_invoke(
            "background",
            &background_value,
            authority_signer_seeds,
        )?;
        // TODO...look into this. would be cool to have but i think this blows the HEAP (logged ~30kb at this point/ max is 32kb)
        // self.update_metadata_field_and_invoke("staked", "false", authority_signer_seeds)?;
        self.update_metadata_field_and_invoke(
            "inscription",
            &self.epoch_inscription.key().to_string(),
            authority_signer_seeds,
        )?;
        self.update_metadata_field_and_invoke(
            ROYALTY_BASIS_POINTS_FIELD,
            &(500 as u16).to_string(),
            authority_signer_seeds,
        )?;
        ALL_ROYALTIES.iter().for_each(|royalty| {
            self.update_metadata_field_and_invoke(
                &royalty.creator.key().to_string(),
                &royalty.amount.to_string(),
                authority_signer_seeds,
            )
            .unwrap();
        });

        // TODO:  (maybe do these on claim if compute challenges?)
        //    - Implement the transfer hook
        //    - Init group member pointer

        Ok(())
    }

    pub fn mint_wns_nft(
        &self,
        authority_bump: u8,
        current_epoch: u64,
    ) -> Result<()> {

        let token_metadata = CreateMintAccountArgs {
            name: format!("Epoch #{}", current_epoch),
            symbol: String::from("EPOCH"),
            uri: format!(
                "https://shdw-drive.genesysgo.net/somekey/{}.png",
                current_epoch
            ).to_string(),
        };
        msg!("CPI TO WNS");
        wns_mint_nft(
            &self.payer,
            &self.authority,
            &self.auction.to_account_info(),
            &self.mint,
            &self.auction_ata,
            &self.extra_metas_account,
            &self.manager,
            &self.system_program,
            &self.rent.to_account_info(),
            &self.associated_token_program,
            &self.token_program,
            &self.wns_program,
            authority_bump,
            token_metadata,
        )

    }


}

// TODO Add NFT to group
// TODO Add tests
// TODO Minimize acct size
