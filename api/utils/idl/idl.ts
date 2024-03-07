export type Bmp = {
  "version": "0.1.0",
  "name": "bmp",
  "constants": [
    {
      "name": "GREEN_SCREEN",
      "type": {
        "defined": "Pixel"
      },
      "value": "(255 , 000 , 246)"
    }
  ],
  "instructions": [
    {
      "name": "createGroup",
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
      "name": "inscribeEpoch",
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
      "name": "createEpoch",
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
      "name": "auctionInit",
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
      "name": "auctionBid",
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
      "name": "auctionClaim",
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
      "name": "timeMachineInit",
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
      "name": "timeMachineAttempt",
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
      "name": "timeMachineInscribe",
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
      "name": "timeMachineClaim",
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
    },
    {
      "name": "timeMachineReceipt",
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
      "name": "timeMachine",
      "docs": [
        "An asset minter for retroactive epochs.",
        "The machine will enable the generation of a fixed number of items",
        "to represent previously occuring epochs."
      ],
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
    }
  ],
  "types": [
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
      "name": "GREEN_SCREEN",
      "type": {
        "defined": "Pixel"
      },
      "value": "(255 , 000 , 246)"
    }
  ],
  "instructions": [
    {
      "name": "createGroup",
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
      "name": "inscribeEpoch",
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
      "name": "createEpoch",
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
      "name": "auctionInit",
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
      "name": "auctionBid",
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
      "name": "auctionClaim",
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
      "name": "timeMachineInit",
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
      "name": "timeMachineAttempt",
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
      "name": "timeMachineInscribe",
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
      "name": "timeMachineClaim",
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
    },
    {
      "name": "timeMachineReceipt",
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
      "name": "timeMachine",
      "docs": [
        "An asset minter for retroactive epochs.",
        "The machine will enable the generation of a fixed number of items",
        "to represent previously occuring epochs."
      ],
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
    }
  ],
  "types": [
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
