export interface EpochInfo {
    epoch: number;
}

export interface ProgressProps {
    progress: string;
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