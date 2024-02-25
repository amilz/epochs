# epochs wip
 experimental solana on-chain nft generation

## Overview
### Instructions 
- [`create_collection_nft`](/programs/bmp/src/instructions/create_collection_nft.rs) creates a collection nft using CPI to WNS program
- [`init_epoch`](/programs/bmp/src/instructions/init_epoch.rs) does a few things:
     - generates art based on assets in [`constants/traits`](/programs/bmp/src/constants/traits/) and bmp encoder in [`utils/traits`](/programs/bmp/src/utils/traits.rs) 
     - then inscribes bmp and json of the metadata
     - Mints a WNS-complaint NFT using token 2022 extensions via a CPI to WNS program
     - initiates an auction for the NFT
     - adds reputation points to user
     - _(Note: this in struction is at the very edge of solana's heap and stack limits...likely cannot add much more)_

- [`bid`](/programs/bmp/src/instructions/bid.rs) creates a user bit for an active auction. It will refund the previous bid if there is one and give them Reputation points
- [`claim`](/programs/bmp/src/instructions/claim.rs) allows anybody to settle a closed auction. this will transfer the nft to the winner and give reputation points. We also implement royalties for the NFT here (as opposed to in the `init` to avoid having to do navigate the transfer hook ourselves)


### State/PDAs
- `epoch_inscription` - pda storing a bitmap and json buffer of nft
- `auction` - an auction for each epoch
- `reputation` - effectively a points system for engaging in the program 