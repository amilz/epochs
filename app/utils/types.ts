import { Asset, AssetParams, ExtensionData } from "@epochs/api/utils/deserialize/deserialize";

export interface DeserializedAsset extends DeserializedAssetNoEpoch {
    epoch: number;
}

export enum EpochStatus {
    DOES_NOT_EXIST = "DOES_NOT_EXIST",
    NOT_YET_STARTED = "NOT_YET_STARTED",
    ACTIVE = "ACTIVE",
    UNCLAIMED = "UNCLAIMED",
    COMPLETE = "COMPLETE"
}

export interface DeserializedAssetNoEpoch {
    png: string;
    extensions: ExtensionData[];
    assetWithoutExtensions: AssetParams
}