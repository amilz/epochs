use anchor_lang::prelude::*;

use crate::generate_asset;

#[account]
pub struct EpochInscription {
    pub epoch_id: u64,
    pub bump: u8,
    pub buffers: EpochBuffers,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default, Eq, PartialEq, Debug)]
pub struct EpochBuffers {
    pub image_raw: Vec<u8>,
    pub json_raw: Vec<u8>,
}

impl EpochInscription {
    pub fn get_size() -> usize {
        8 +     // discriminator
        8 +     // epoch_id
        1 +     // bump
        4 +     // Vec<T> minimum length
        3126 +  // buffer of 32x32 .bmp
        1000    // buffer of 1000 bytes (TODO: make dynamic)
    }
    #[inline(never)]
    pub fn generate_and_set_asset(&mut self, current_epoch: u64, user: Pubkey, bump: u8) {
        self.buffers.image_raw = generate_asset(current_epoch, user);
        self.buffers.json_raw = JSON_DATA.as_bytes().to_vec();
        self.epoch_id = current_epoch;
        self.bump = bump;
    }

}

const JSON_DATA: &str = r#"{
    "name": "Wen Poem",
    "symbol": "WEN",
    "description": "A poem for Wen Boys.",
    "image": "https://shdw-drive.genesysgo.net/GwJapVHVvfM4Mw4sWszkzywncUWuxxPd6s9VuFfXRgie/wen_poem.jpg",
    "attributes": [
      {
        "trait_type": "wen",
        "value": "now"
      }
    ],
    "properties": {
      "files": [
        {
          "uri": "https://shdw-drive.genesysgo.net/GwJapVHVvfM4Mw4sWszkzywncUWuxxPd6s9VuFfXRgie/wen_poem.jpg",
          "type": "image/jpg"
        }
      ],
      "category": "image"
    }
  }"#;
  