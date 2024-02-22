# epochs wip
 experimental solana on-chain nft generation

## Overview
### Instructions 
- [`init_epoch`](/programs/bmp/src/instructions/init_epoch.rs) does a few things:
     - generates art based on assets in [`constants/traits`](/programs/bmp/src/constants/traits/) and bmp encoder in [`utils/traits`](/programs/bmp/src/utils/traits.rs) 
     - then inscribes bmp and json of the metadata
     - initializes a NFT using token 2022 extensions (not minted yet)
     - initiates an auction for the NFT
     - adds reputation points to user
     - (this in struction is at the very edge of solana's heap and stack limits...likely cannot add much more)

- [`bid`](/programs/bmp/src/instructions/bid.rs) creates a user bit for an active auction. It will refund the previous bid if there is one and give them Reputation points
- [`claim`](/programs/bmp/src/instructions/claim.rs) allows anybody to settle a closed auction. this will mint the nft to the winner and give reputation points

TODO
- `create_collection_nft` - currently using metaplex standard. need to replace w/ WNS hooks

### State/PDAs
- `epoch_inscription` - pda storing a bitmap and json buffer of nft
- `auction` - an auction for each epoch
- `reputation` - effectively a points system for engaging in the program 