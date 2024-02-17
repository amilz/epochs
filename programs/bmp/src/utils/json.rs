use anchor_lang::solana_program::pubkey::Pubkey;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct Attribute {
    pub trait_type: String,
    pub value: String,
}

#[derive(Serialize, Deserialize)]
pub struct File {
    pub uri: String,
    #[serde(rename = "type")]
    pub file_type: String,
}

#[derive(Serialize, Deserialize)]
pub struct Properties {
    pub files: Vec<File>,
    pub category: String,
}

#[derive(Serialize, Deserialize)]
pub struct JsonMetadata {
    pub name: String,
    pub symbol: String,
    pub description: String,
    pub image: String,
    pub attributes: Vec<Attribute>,
    pub properties: Properties,
}
type SelectTraitsResults = (usize, usize, usize, usize, (u8, u8, u8));

#[inline(never)]
pub fn generate_json_metadata(epoch: u64, creator: Pubkey, trait_indices: SelectTraitsResults) -> Result<Vec<u8>, serde_json::Error> {
    let json_metadata = JsonMetadata {
        name: format!("Epoch #{}", epoch),
        symbol: "EPOCH".to_string(),
        description: "One Epoch, every epoch, forever.".to_string(),
        image: format!("https://shdw-drive.genesysgo.net/somekey/{}.png", epoch).to_string(),
        attributes: vec![
            Attribute {
                trait_type: "epoch".to_string(),
                value: epoch.to_string(),
            },
            Attribute {
                trait_type: "creator".to_string(),
                value: creator.to_string(),
            },
            // for each element in trait_indices, add an attribute
            Attribute {
                trait_type: "hat".to_string(),
                value: trait_indices.0.to_string(),
            },
            Attribute {
                trait_type: "clothes".to_string(),
                value: trait_indices.1.to_string(),
            },
            Attribute {
                trait_type: "glasses".to_string(),
                value: trait_indices.2.to_string(),
            },
            Attribute {
                trait_type: "body".to_string(),
                value: trait_indices.3.to_string(),
            },
            Attribute {
                trait_type: "background".to_string(),
                value: format!("{},{},{}", trait_indices.4 .0, trait_indices.4 .1, trait_indices.4 .2),
            },
        ],
        properties: Properties {
            files: vec![
                File {
                    uri: format!("https://shdw-drive.genesysgo.net/somekey/{}.png", epoch).to_string(),
                    file_type: "image/jpg".to_string(),
                },
            ],
            category: "image".to_string(),
        },
    };

    let json_str = serde_json::to_string(&json_metadata)?;
    let buffer = json_str.as_bytes();
    Ok(buffer.to_vec())
}