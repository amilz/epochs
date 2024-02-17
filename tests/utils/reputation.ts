import { PublicKey } from "@solana/web3.js";


export enum ReputationPoints {
    INITIATE = 5,
    SETTLE = 3,
    BID = 1,
    WIN = 10
}

export class ReputationTracker {
    private reputation: number;
    private user: PublicKey

    constructor(user: PublicKey) {
        this.reputation = 0;
        this.user = user;
    }

    public getReputation() {
        return this.reputation;
    }

    public addReputation(type: ReputationPoints) {
        this.reputation += type;
    }

    public getUser() {
        return this.user;
    }

}