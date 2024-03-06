export type Bmp = {
  "version": "0.1.0",
  "name": "bmp",
  "constants": [
    {
      "name": "AUTHORITY",
      "type": "string",
      "value": "\"AUTHbpGeSBi6tHHxnStySJhrwQfm5tLZQRcL2pCiVweL\""
    },
    {
      "name": "CREATOR_WALLET_1",
      "type": "string",
      "value": "\"zoMw7rFTJ24Y89ADmffcvyBqxew8F9AcMuz1gBd61Fa\""
    },
    {
      "name": "CREATOR_WALLET_2",
      "type": "string",
      "value": "\"zoMw7rFTJ24Y89ADmffcvyBqxew8F9AcMuz1gBd61Fa\""
    },
    {
      "name": "DAO_TREASURY_WALLET",
      "type": "string",
      "value": "\"zuVfy5iuJNZKf5Z3piw5Ho4EpMxkg19i82oixjk1axe\""
    },
    {
      "name": "ROYALTY_BASIS_POINTS_FIELD",
      "type": "string",
      "value": "\"royalty_basis_points\""
    },
    {
      "name": "COLLECTION_SEED",
      "type": "string",
      "value": "\"Collection\""
    },
    {
      "name": "AUCTION_SEED",
      "type": "string",
      "value": "\"Auction\""
    },
    {
      "name": "EPOCH_INSCRIPTION_SEED",
      "type": "string",
      "value": "\"EpochInscription\""
    },
    {
      "name": "REPUTATION_SEED",
      "type": "string",
      "value": "\"Reputation\""
    },
    {
      "name": "AUTHORITY_SEED",
      "type": "string",
      "value": "\"Authority\""
    },
    {
      "name": "AUCTION_ESCROW_SEED",
      "type": "string",
      "value": "\"AuctionEscrow\""
    },
    {
      "name": "NFT_MINT_SEED",
      "type": "string",
      "value": "\"NftMint\""
    },
    {
      "name": "MINTER_SEED",
      "type": "string",
      "value": "\"Minter\""
    },
    {
      "name": "MINTER_CLAIM_SEED",
      "type": "string",
      "value": "\"MinterClaim\""
    },
    {
      "name": "GREEN_SCREEN",
      "type": {
        "defined": "Pixel"
      },
      "value": "(255 , 000 , 246)"
    },
    {
      "name": "WNS_PROGRAM",
      "type": "string",
      "value": "\"wns1gDLt8fgLcGhWi5MqAqgXpwEP1JftKE9eZnXS1HM\""
    }
  ],
  "instructions": [
    {
      "name": "createCollectionNft",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "receiver",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "group",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "manager",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "wnsProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "initEpoch",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Anybody can kick off a new epoch.",
            "No constraits--just need to be a signer"
          ]
        },
        {
          "name": "epochInscription",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "PDA that will store the instricption for the epoch",
            "Seeded on user-input epoch (verified in program to be current epoch)",
            "See state/epoch_inscription.rs for more details"
          ]
        },
        {
          "name": "auction",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "PDA that will store the auction for the epoch",
            "Seeded on user-input epoch (verified in program to be current epoch)",
            "See state/auction.rs for more details"
          ]
        },
        {
          "name": "reputation",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "PDA that will store the reputation for the user",
            "Seeded on user's pubkey",
            "Need to use `init_if_needed` bc we are not sure if the user has a reputation account",
            "See state/reputation.rs for more details"
          ]
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "This will be the authority of the Token2022 NFT"
          ]
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "auctionAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "extraMetasAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "manager",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "group",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "member",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "wnsProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "inputEpoch",
          "type": "u64"
        }
      ]
    },
    {
      "name": "bid",
      "accounts": [
        {
          "name": "bidder",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Anybody can bid on an auction.",
            "No constraits--just need to be a signer"
          ]
        },
        {
          "name": "auction",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "We will update the auction PDA based on the bid",
            "Seeded on user-input epoch (verified in program to be current epoch)",
            "See state/auction.rs for more details"
          ]
        },
        {
          "name": "auctionEscrow",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The auction escrow account will hold the funds for the auction"
          ]
        },
        {
          "name": "highBidder",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The previous high bidder will have their funds returned to them"
          ]
        },
        {
          "name": "reputation",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "PDA that will store the reputation for the user",
            "Seeded on user's pubkey",
            "Need to use `init_if_needed` bc we are not sure if the user has a reputation account",
            "See state/reputation.rs for more details"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "inputEpoch",
          "type": "u64"
        },
        {
          "name": "bidAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claim",
      "accounts": [
        {
          "name": "winner",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Only winner can bid on an auction.",
            "No constraits--just need to be a signer"
          ]
        },
        {
          "name": "auction",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "We will update the auction PDA based on the bid",
            "Seeded on user-input epoch (verified in program to be current epoch)",
            "See state/auction.rs for more details"
          ]
        },
        {
          "name": "auctionEscrow",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The auction escrow account will disburse funds"
          ]
        },
        {
          "name": "reputation",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "PDA that will store the reputation for the user",
            "Seeded on user's pubkey",
            "Since this person has already done a bid, we know they have a reputation account",
            "therefore we can skip `init`",
            "See state/reputation.rs for more details"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "daoTreasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creatorWallet",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sourceAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destinationAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "extraMetasAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "wnsProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "inputEpoch",
          "type": "u64"
        }
      ]
    },
    {
      "name": "transferExample",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "receiver",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sourceAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destinationAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "ossCreateBlob",
      "accounts": [
        {
          "name": "asset",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "group",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ossProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "inputEpoch",
          "type": "u64"
        }
      ]
    },
    {
      "name": "ossCreateRest",
      "accounts": [
        {
          "name": "asset",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "group",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ossProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "inputEpoch",
          "type": "u64"
        }
      ]
    },
    {
      "name": "ossCreateGroup",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "asset",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ossProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "ossInitAuction",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "auction",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reputation",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "asset",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "inputEpoch",
          "type": "u64"
        }
      ]
    },
    {
      "name": "ossClaim",
      "accounts": [
        {
          "name": "winner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "auction",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "auctionEscrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reputation",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "daoTreasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creatorWallet",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "asset",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ossProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "inputEpoch",
          "type": "u64"
        }
      ]
    },
    {
      "name": "ossInitMinter",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "minter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "itemsAvailable",
          "type": "u64"
        },
        {
          "name": "startTime",
          "type": "i64"
        }
      ]
    },
    {
      "name": "ossMinterClaim",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "minter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "minterClaim",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "ossRedeemBlob",
      "accounts": [
        {
          "name": "asset",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "group",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "minterClaim",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ossProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "ossRedeemRest",
      "accounts": [
        {
          "name": "asset",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "group",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "minterClaim",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ossProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "auction",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "epoch",
            "type": "u64"
          },
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "state",
            "type": {
              "defined": "AuctionState"
            }
          },
          {
            "name": "highBidder",
            "type": "publicKey"
          },
          {
            "name": "highBidLamports",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "epochInscription",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "epochId",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "buffers",
            "type": {
              "defined": "EpochBuffers"
            }
          }
        ]
      }
    },
    {
      "name": "minterClaim",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "claimer",
            "type": "publicKey"
          },
          {
            "name": "epoch",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "minter",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "itemsAvailable",
            "type": "u64"
          },
          {
            "name": "itemsRedeemed",
            "type": "u64"
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "active",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "reputation",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "contributor",
            "type": "publicKey"
          },
          {
            "name": "reputation",
            "type": "u64"
          },
          {
            "name": "initialized",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "EpochBuffers",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "imageRaw",
            "type": "bytes"
          },
          {
            "name": "jsonRaw",
            "type": "bytes"
          }
        ]
      }
    },
    {
      "name": "CreateMintAccountArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "uri",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "CreateGroupAccountArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "uri",
            "type": "string"
          },
          {
            "name": "maxSize",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "CreatorWithShare",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "type": "string"
          },
          {
            "name": "share",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "AddRoyaltiesArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "royaltyBasisPoints",
            "type": "u16"
          },
          {
            "name": "creators",
            "type": {
              "vec": {
                "defined": "CreatorWithShare"
              }
            }
          }
        ]
      }
    },
    {
      "name": "AuctionState",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "UnClaimed"
          },
          {
            "name": "Claimed"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "FutureEpochNotAllowed",
      "msg": "The input epoch is in the future, which is not allowed"
    },
    {
      "code": 6001,
      "name": "PastEpochNotAllowed",
      "msg": "The input epoch is in the past, which is not allowed"
    },
    {
      "code": 6002,
      "name": "EpochMismatch",
      "msg": "The input epoch does not match the current epoch"
    },
    {
      "code": 6003,
      "name": "BidTooLow",
      "msg": "Bid does not meet minimum bid threshold"
    },
    {
      "code": 6004,
      "name": "InvalidPreviousBidder",
      "msg": "Previous bidder passed does not match the current high bidder"
    },
    {
      "code": 6005,
      "name": "InvalidWinner",
      "msg": "Signer did not win the auction"
    },
    {
      "code": 6006,
      "name": "AuctionAlreadyClaimed",
      "msg": "Auction has already been claimed"
    },
    {
      "code": 6007,
      "name": "InvalidTreasury",
      "msg": "Invalid treasury account"
    },
    {
      "code": 6008,
      "name": "InvalidCreator",
      "msg": "Invalid creator account"
    },
    {
      "code": 6009,
      "name": "InvalidContributor",
      "msg": "Contributor does not match signer of the transaction"
    },
    {
      "code": 6010,
      "name": "Overflow",
      "msg": "Integer overflow"
    },
    {
      "code": 6011,
      "name": "Underflow",
      "msg": "Integer underflow"
    },
    {
      "code": 6012,
      "name": "InvalidWnsProgram",
      "msg": "Invalid WNS Program"
    },
    {
      "code": 6013,
      "name": "MinterNotActive",
      "msg": "Minter is not active"
    },
    {
      "code": 6014,
      "name": "MinterEmpty",
      "msg": "Minter is empty"
    },
    {
      "code": 6015,
      "name": "MinterNotStarted",
      "msg": "Minter has not started"
    },
    {
      "code": 6016,
      "name": "MinterStartTimeInPast",
      "msg": "Cannot start minter in the past"
    },
    {
      "code": 6017,
      "name": "MinterTooManyItems",
      "msg": "Minter cannot have more items than the current epoch"
    }
  ]
};

export const IDL: Bmp = {
  "version": "0.1.0",
  "name": "bmp",
  "constants": [
    {
      "name": "AUTHORITY",
      "type": "string",
      "value": "\"AUTHbpGeSBi6tHHxnStySJhrwQfm5tLZQRcL2pCiVweL\""
    },
    {
      "name": "CREATOR_WALLET_1",
      "type": "string",
      "value": "\"zoMw7rFTJ24Y89ADmffcvyBqxew8F9AcMuz1gBd61Fa\""
    },
    {
      "name": "CREATOR_WALLET_2",
      "type": "string",
      "value": "\"zoMw7rFTJ24Y89ADmffcvyBqxew8F9AcMuz1gBd61Fa\""
    },
    {
      "name": "DAO_TREASURY_WALLET",
      "type": "string",
      "value": "\"zuVfy5iuJNZKf5Z3piw5Ho4EpMxkg19i82oixjk1axe\""
    },
    {
      "name": "ROYALTY_BASIS_POINTS_FIELD",
      "type": "string",
      "value": "\"royalty_basis_points\""
    },
    {
      "name": "COLLECTION_SEED",
      "type": "string",
      "value": "\"Collection\""
    },
    {
      "name": "AUCTION_SEED",
      "type": "string",
      "value": "\"Auction\""
    },
    {
      "name": "EPOCH_INSCRIPTION_SEED",
      "type": "string",
      "value": "\"EpochInscription\""
    },
    {
      "name": "REPUTATION_SEED",
      "type": "string",
      "value": "\"Reputation\""
    },
    {
      "name": "AUTHORITY_SEED",
      "type": "string",
      "value": "\"Authority\""
    },
    {
      "name": "AUCTION_ESCROW_SEED",
      "type": "string",
      "value": "\"AuctionEscrow\""
    },
    {
      "name": "NFT_MINT_SEED",
      "type": "string",
      "value": "\"NftMint\""
    },
    {
      "name": "MINTER_SEED",
      "type": "string",
      "value": "\"Minter\""
    },
    {
      "name": "MINTER_CLAIM_SEED",
      "type": "string",
      "value": "\"MinterClaim\""
    },
    {
      "name": "GREEN_SCREEN",
      "type": {
        "defined": "Pixel"
      },
      "value": "(255 , 000 , 246)"
    },
    {
      "name": "WNS_PROGRAM",
      "type": "string",
      "value": "\"wns1gDLt8fgLcGhWi5MqAqgXpwEP1JftKE9eZnXS1HM\""
    }
  ],
  "instructions": [
    {
      "name": "createCollectionNft",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "receiver",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "group",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "manager",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "wnsProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "initEpoch",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Anybody can kick off a new epoch.",
            "No constraits--just need to be a signer"
          ]
        },
        {
          "name": "epochInscription",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "PDA that will store the instricption for the epoch",
            "Seeded on user-input epoch (verified in program to be current epoch)",
            "See state/epoch_inscription.rs for more details"
          ]
        },
        {
          "name": "auction",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "PDA that will store the auction for the epoch",
            "Seeded on user-input epoch (verified in program to be current epoch)",
            "See state/auction.rs for more details"
          ]
        },
        {
          "name": "reputation",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "PDA that will store the reputation for the user",
            "Seeded on user's pubkey",
            "Need to use `init_if_needed` bc we are not sure if the user has a reputation account",
            "See state/reputation.rs for more details"
          ]
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "This will be the authority of the Token2022 NFT"
          ]
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "auctionAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "extraMetasAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "manager",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "group",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "member",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "wnsProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "inputEpoch",
          "type": "u64"
        }
      ]
    },
    {
      "name": "bid",
      "accounts": [
        {
          "name": "bidder",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Anybody can bid on an auction.",
            "No constraits--just need to be a signer"
          ]
        },
        {
          "name": "auction",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "We will update the auction PDA based on the bid",
            "Seeded on user-input epoch (verified in program to be current epoch)",
            "See state/auction.rs for more details"
          ]
        },
        {
          "name": "auctionEscrow",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The auction escrow account will hold the funds for the auction"
          ]
        },
        {
          "name": "highBidder",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The previous high bidder will have their funds returned to them"
          ]
        },
        {
          "name": "reputation",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "PDA that will store the reputation for the user",
            "Seeded on user's pubkey",
            "Need to use `init_if_needed` bc we are not sure if the user has a reputation account",
            "See state/reputation.rs for more details"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "inputEpoch",
          "type": "u64"
        },
        {
          "name": "bidAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claim",
      "accounts": [
        {
          "name": "winner",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Only winner can bid on an auction.",
            "No constraits--just need to be a signer"
          ]
        },
        {
          "name": "auction",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "We will update the auction PDA based on the bid",
            "Seeded on user-input epoch (verified in program to be current epoch)",
            "See state/auction.rs for more details"
          ]
        },
        {
          "name": "auctionEscrow",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The auction escrow account will disburse funds"
          ]
        },
        {
          "name": "reputation",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "PDA that will store the reputation for the user",
            "Seeded on user's pubkey",
            "Since this person has already done a bid, we know they have a reputation account",
            "therefore we can skip `init`",
            "See state/reputation.rs for more details"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "daoTreasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creatorWallet",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sourceAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destinationAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "extraMetasAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "wnsProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "inputEpoch",
          "type": "u64"
        }
      ]
    },
    {
      "name": "transferExample",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "receiver",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sourceAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destinationAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "ossCreateBlob",
      "accounts": [
        {
          "name": "asset",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "group",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ossProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "inputEpoch",
          "type": "u64"
        }
      ]
    },
    {
      "name": "ossCreateRest",
      "accounts": [
        {
          "name": "asset",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "group",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ossProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "inputEpoch",
          "type": "u64"
        }
      ]
    },
    {
      "name": "ossCreateGroup",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "asset",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ossProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "ossInitAuction",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "auction",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reputation",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "asset",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "inputEpoch",
          "type": "u64"
        }
      ]
    },
    {
      "name": "ossClaim",
      "accounts": [
        {
          "name": "winner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "auction",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "auctionEscrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reputation",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "daoTreasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creatorWallet",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "asset",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ossProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "inputEpoch",
          "type": "u64"
        }
      ]
    },
    {
      "name": "ossInitMinter",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "minter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "itemsAvailable",
          "type": "u64"
        },
        {
          "name": "startTime",
          "type": "i64"
        }
      ]
    },
    {
      "name": "ossMinterClaim",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "minter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "minterClaim",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "ossRedeemBlob",
      "accounts": [
        {
          "name": "asset",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "group",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "minterClaim",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ossProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "ossRedeemRest",
      "accounts": [
        {
          "name": "asset",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "group",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "minterClaim",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ossProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "auction",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "epoch",
            "type": "u64"
          },
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "state",
            "type": {
              "defined": "AuctionState"
            }
          },
          {
            "name": "highBidder",
            "type": "publicKey"
          },
          {
            "name": "highBidLamports",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "epochInscription",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "epochId",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "buffers",
            "type": {
              "defined": "EpochBuffers"
            }
          }
        ]
      }
    },
    {
      "name": "minterClaim",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "claimer",
            "type": "publicKey"
          },
          {
            "name": "epoch",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "minter",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "itemsAvailable",
            "type": "u64"
          },
          {
            "name": "itemsRedeemed",
            "type": "u64"
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "active",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "reputation",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "contributor",
            "type": "publicKey"
          },
          {
            "name": "reputation",
            "type": "u64"
          },
          {
            "name": "initialized",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "EpochBuffers",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "imageRaw",
            "type": "bytes"
          },
          {
            "name": "jsonRaw",
            "type": "bytes"
          }
        ]
      }
    },
    {
      "name": "CreateMintAccountArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "uri",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "CreateGroupAccountArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "uri",
            "type": "string"
          },
          {
            "name": "maxSize",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "CreatorWithShare",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "type": "string"
          },
          {
            "name": "share",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "AddRoyaltiesArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "royaltyBasisPoints",
            "type": "u16"
          },
          {
            "name": "creators",
            "type": {
              "vec": {
                "defined": "CreatorWithShare"
              }
            }
          }
        ]
      }
    },
    {
      "name": "AuctionState",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "UnClaimed"
          },
          {
            "name": "Claimed"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "FutureEpochNotAllowed",
      "msg": "The input epoch is in the future, which is not allowed"
    },
    {
      "code": 6001,
      "name": "PastEpochNotAllowed",
      "msg": "The input epoch is in the past, which is not allowed"
    },
    {
      "code": 6002,
      "name": "EpochMismatch",
      "msg": "The input epoch does not match the current epoch"
    },
    {
      "code": 6003,
      "name": "BidTooLow",
      "msg": "Bid does not meet minimum bid threshold"
    },
    {
      "code": 6004,
      "name": "InvalidPreviousBidder",
      "msg": "Previous bidder passed does not match the current high bidder"
    },
    {
      "code": 6005,
      "name": "InvalidWinner",
      "msg": "Signer did not win the auction"
    },
    {
      "code": 6006,
      "name": "AuctionAlreadyClaimed",
      "msg": "Auction has already been claimed"
    },
    {
      "code": 6007,
      "name": "InvalidTreasury",
      "msg": "Invalid treasury account"
    },
    {
      "code": 6008,
      "name": "InvalidCreator",
      "msg": "Invalid creator account"
    },
    {
      "code": 6009,
      "name": "InvalidContributor",
      "msg": "Contributor does not match signer of the transaction"
    },
    {
      "code": 6010,
      "name": "Overflow",
      "msg": "Integer overflow"
    },
    {
      "code": 6011,
      "name": "Underflow",
      "msg": "Integer underflow"
    },
    {
      "code": 6012,
      "name": "InvalidWnsProgram",
      "msg": "Invalid WNS Program"
    },
    {
      "code": 6013,
      "name": "MinterNotActive",
      "msg": "Minter is not active"
    },
    {
      "code": 6014,
      "name": "MinterEmpty",
      "msg": "Minter is empty"
    },
    {
      "code": 6015,
      "name": "MinterNotStarted",
      "msg": "Minter has not started"
    },
    {
      "code": 6016,
      "name": "MinterStartTimeInPast",
      "msg": "Cannot start minter in the past"
    },
    {
      "code": 6017,
      "name": "MinterTooManyItems",
      "msg": "Minter cannot have more items than the current epoch"
    }
  ]
};
