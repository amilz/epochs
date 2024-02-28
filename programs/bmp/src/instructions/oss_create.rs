use crate::EpochError;
use anchor_lang::{prelude::*, solana_program::program::invoke};
use nifty_asset::{
    instructions::{Create, CreateInstructionArgs},
    types::Standard,
    ID as NiftyAssetID,
};

#[derive(Accounts)]
pub struct OssCreate<'info> {
    #[account(mut)]
    pub asset: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,

    /// CHECK: use address constraint
    #[account(
        address = NiftyAssetID @ EpochError::InvalidWnsProgram
    )]
    pub oss_program: UncheckedAccount<'info>,
}

impl<'info> OssCreate<'info> {
    pub fn handler(&self) -> Result<()> {
        let args = CreateInstructionArgs {
            name: "Nifty Asset".to_string(),
            standard: Standard::NonFungible,
            mutable: false,
        };

        let create_ctx = Create {
            asset: self.asset.key(),
            authority: self.payer.key(), // Assuming payer is the authority
            holder: self.payer.key(),    // Assuming payer is the holder
            group: None,                 // Set this according to your logic
            payer: Some(self.payer.key()),
            system_program: Some(self.system_program.key()),
        };
        let ix = create_ctx.instruction(args);

        let account_infos = vec![
            self.asset.to_account_info(),
            self.payer.to_account_info(),
            self.oss_program.to_account_info(),
            self.system_program.to_account_info(),
        ];

        invoke(&ix, &account_infos)?;

        Ok(())
    }
}
