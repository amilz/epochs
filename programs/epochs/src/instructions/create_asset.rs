use crate::{
    utils::{
        create_asset, get_and_validate_epoch, write_rawimg_and_traits,
    }, Auction, EpochError, Points, Reputation, AUCTION_SEED, AUTHORITY_SEED, COLLECTION_SEED, NFT_MINT_SEED, REPUTATION_SEED
};
use anchor_lang::{prelude::*, system_program::{transfer, Transfer}};

#[derive(Accounts)]
#[instruction(input_epoch: u64)]
pub struct CreateAsset<'info> {
    /// CHECK: New NFT Mint (will be init by OSS Program via CPI - address is derived based on epoch #)
    #[account(
        mut,
        seeds = [NFT_MINT_SEED.as_bytes(), &input_epoch.to_le_bytes()],
        bump,
    )]
    pub asset: UncheckedAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: Group Asset
    #[account(
        mut,
        seeds = [COLLECTION_SEED.as_bytes()],
        bump,
    )]
    pub group: UncheckedAccount<'info>,

    /// CHECK: Program Authority: The account that will be used to sign transactions
    #[account(
        mut,
        seeds = [AUTHORITY_SEED.as_bytes()],
        bump,
    )]
    pub authority: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,

    /// CHECK: use address constraint
    #[account(
        address = nifty_asset::ID @ EpochError::InvalidOssProgram
    )]
    pub oss_program: UncheckedAccount<'info>,

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
    pub reputation: Account<'info, Reputation>,

}

impl<'info> CreateAsset<'info> {
    pub fn handler(
        &mut self,
        authority_bump: u8,
        asset_bump: u8,
        reputation_bump: u8,
        auction_bump: u8,
        current_epoch: u64,
    ) -> Result<()> {
        let epoch = get_and_validate_epoch(current_epoch)?;

        let account_infos = vec![
            self.asset.to_account_info(),
            self.payer.to_account_info(),
            self.group.to_account_info(),
            self.authority.to_account_info(),
            self.oss_program.to_account_info(),
            self.system_program.to_account_info(),
        ];

        let asset_seeds = &[
            NFT_MINT_SEED.as_bytes(),
            &epoch.to_le_bytes(),
            &[asset_bump],
        ];
        let asset_signer_seeds: &[&[&[u8]]; 1] = &[&asset_seeds[..]];
        let authority_seeds = &[AUTHORITY_SEED.as_bytes(), &[authority_bump]];
        let combined_signer_seeds = &[&asset_seeds[..], &authority_seeds[..]];

        write_rawimg_and_traits(
            self.asset.to_account_info(),
            self.payer.to_account_info(),
            self.system_program.to_account_info(),
            self.oss_program.to_account_info(),
            &account_infos,
            asset_signer_seeds,
            epoch
        )?;
        create_asset(
            self.asset.key(),
            self.payer.key(),
            self.authority.key(),
            self.authority.key(),
            self.group.key(),
            &account_infos,
            combined_signer_seeds,
            epoch
        )?;

        let payer = self.payer.key();
        let asset = self.asset.to_account_info();
        let auction: &mut Account<'_, Auction> = &mut self.auction;
        let reputation: &mut Account<'_, Reputation> = &mut self.reputation;
        
        auction.create(
            current_epoch,
            asset.key(),
            payer,
            auction_bump,
        );

        reputation.init_if_needed(payer, reputation_bump);
        reputation.increment_with_validation(Points::INITIATE, payer.key())?;

        //TODO Replace anchor init with my own in lieu of refund.
        //maybe track the amount in the auction to prevent some weird abuse where somebody sends lamports to the asset or auction pda
        self.refund_rent(authority_bump)?;

        Ok(())
    }
    fn refund_rent(&self, authority_bump: u8) -> Result<()> {

        let asset_lamports = self.asset.lamports();
        let auction_lamports = self.auction.to_account_info().lamports();
        // Use saturating add to prevent any weird scenario where somebody is sending lamports to these accounts
        let refund_amount: u64 = asset_lamports.saturating_add(auction_lamports).min(300000);

        let bump = &[authority_bump];
        let seeds: &[&[u8]] = &[AUTHORITY_SEED.as_ref(), bump];
        let signer_seeds = &[&seeds[..]];

        transfer(
            CpiContext::new(
                self.system_program.to_account_info(),
                Transfer {
                    from: self.authority.to_account_info(),
                    to: self.payer.to_account_info(),
                },
            ).with_signer(signer_seeds),
            refund_amount,
        )?;

        Ok(())
    }
        
}
