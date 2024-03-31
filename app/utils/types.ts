import { Asset, AssetParams, ExtensionData } from "@epochs/api/utils/deserialize/deserialize";

export interface DeserializedAsset {
    epoch: number;
    png: string;
    extensions: ExtensionData[];
    assetWithoutExtensions: AssetParams
}