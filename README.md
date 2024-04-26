# The Epochs wip
experimental solana on-chain nft generation
_inspired by [Nouns](https://nouns.wtf/) and Solana's [Proof of History](https://solana.com/news/proof-of-history)_

There are 2 primary groups of instructions here: 
1. An "Epoch" Asset generated and auctioned every epoch in perpetuity. This includes asset generation, auction, and claim.
2. A retroactive minting system called "Time Machine" that will create a "candy machine"-like mint experience for users to mint epoch's that have already passed (~600 epochs)

## Overview
### Instructions 
- [`create_group`](/programs/epochs/src/instructions/create_group.rs) creates a collection nft using CPI to OSS program (Note: we enforce royalties/creators here, not at the NFT level)
- [`create_asset`](/programs/epochs/src/instructions/create_asset.rs) does a few things:
     - generates art based on assets in [`constants/traits`](/programs/epochs/src/constants/traits/) and bmp encoder in [`utils/traits`](/programs/epochs/src/utils/traits.rs) 
     - then inscribes bmp and json of the metadata to a blob
     - creates an asset (mints an NFT) using Nifty OSS standard
     - initiates an auction for the NFT
     - adds reputation points to user

- [`bid`](/programs/epochs/src/instructions/auction_bid.rs) creates a user bit for an active auction. It will refund the previous bid if there is one and give them Reputation points
- [`claim`](/programs/epochs/src/instructions/auction_claim.rs) allows anybody to settle a closed auction. this will transfer the nft to the winner and give reputation points. 
- [`time_machine`](/programs/epochs/src/instructions/time_machine/) a few instructions that govern a process for a user to mint an NFT using a time machine. This is a way to mint epoch nfts representing the Solana Epochs that have already passed.


### State/PDAs
- `auction` - an auction for each epoch
- `reputation` - effectively a points system for engaging in the program 
- `time_machine` - effectively a "candy machine" like system for minting NFTs (called time machine b/c it it to represent historic epochs)
- `time_machine_receipt` - a PDA the winners of a time machine get to claim their NFT (we do this to allow custom PDAs using Seed/Bump to match the other NFTs)

### TypeScript API
- [`client.ts`](api/client.ts) - a TypeScript API for interacting with the program. This includes all the instructions and state types.

## Local Development

- Clone the repo
- `yarn` to install dependencies
- `anchor build` to build the program
- you will need to update your program id in `lib.rs`, `Anchor.toml`, and `api/constants/pubkeys.ts`
- you will need to create an `AUTH` wallet in `tests/wallet` and update the program & api constants
- `anchor test` to run the tests (note the final test will take a couple of minutes, it's simulating 500 mints and i had to chunk the requests to avoid local ws issues)
- in `epoch.test.ts` you can uncomment `deserializedAsset.saveImgAndJson();` to save the image and json to your root directory to see the generated art


## Initiating Program

- Create Collection `anchor run create_collection`
- Seed the program escrow/authority `BiNb74Q3L2jjyceHTYQFFGXtY69fc2MKCScBbDmorGWR`