use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct Attribute {
    trait_type: String,
    value: String,
}

#[derive(Serialize, Deserialize)]
pub struct File {
    uri: String,
    #[serde(rename = "type")]
    file_type: String,
}

#[derive(Serialize, Deserialize)]
pub struct Properties {
    files: Vec<File>,
    category: String,
}

#[derive(Serialize, Deserialize)]
pub struct WenPoem {
    name: String,
    symbol: String,
    description: String,
    image: String,
    attributes: Vec<Attribute>,
    properties: Properties,
}
