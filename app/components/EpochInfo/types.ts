export interface ActiveEpochProps {
    epoch?: number;
}

export interface EpochInfo {
    epoch?: number;
}

export interface TraitComponents {
    name: string;
    value: string;
}

export interface AssetProps {
    src: string;
}

export interface EpochDisplayProps {
    epochInfo: EpochInfo;
    progress: number;
    traits: TraitComponents[];
    asset: AssetProps;
}

