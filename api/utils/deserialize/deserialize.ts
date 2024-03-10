import { convertBmpToBase64, writetBmpToPng } from './image';
import { PublicKey } from '@solana/web3.js';
import fs from 'fs';


/**
 * Deserializes an Asset from a buffer.
 * Mimics the methodologies outlined here: 
 * https://github.com/nifty-oss/asset/blob/main/programs/asset/types/src/state/asset.rs
 * https://github.com/nifty-oss/asset/blob/main/programs/asset/types/src/extensions/mod.rs
 * 
 * 
 * The Blob Extension in our program includes 2 elements, a serialized bmp and a serialized json.
 * The bmp is a 3126 byte array (starting at position 0) and the json is a variable length array (starting at position 3126).
 */

enum ExtensionType {
    None,
    Attributes,
    Blob,
    Creators,
    Links,
    Metadata,
    Grouping,
    Royalties
}

interface BlobComponents {
    bmpData: Buffer;
    base64Png?: string;
    //jsonData: Buffer;
}

interface ExtensionData {
    type: ExtensionType;
    length: number;
    boundary: number;
    startOffset: number;
    raw?: Buffer;
    blobComponents?: BlobComponents;
    attributesComponents?: AttributesComponents;
    creators?: Creators;
    links?: Links;
    metadata?: Metadata;
    grouping?: Grouping;
    royalties?: Royalties;
}

interface Metadata {
    symbol: string;
    description: string;
    uri: string;
}

interface TraitComponents {
    name: string;
    value: string;
}

interface AttributesComponents {
    traits: TraitComponents[];
}

interface Creator {
    address: string;
    verified: boolean;
    share: number;
}

interface Creators {
    creators: Creator[];
}

interface Link {
    name: string;
    uri: string;
}

interface Links {
    values: Link[];
}

interface Grouping {
    size: number;
    max_size: number;
}

interface Royalties {
    basisPoints: number;
    // skipping constraints for now
}


class Extension {
    static HEADER_LEN = 16; // Size of the Extension header

    static load(buffer: Buffer, offset: number): ExtensionData {
        const extensionTypeValue = buffer.readUInt32LE(offset); // Read the first u32 as the extension type
        const length = buffer.readUInt32LE(offset + 4);         // Read the second u32 as the length
        const boundary = buffer.readUInt32LE(offset + 8);       // Read the third u32 as the boundary
        // There's an empty u32 at offset + 12, which we can skip
        const startOffset = offset + this.HEADER_LEN;

        return {
            type: this.fromU32(extensionTypeValue),
            length,
            boundary,
            startOffset
        };
    }

    static fromU32(value: number): ExtensionType {
        switch (value) {
            case 0: return ExtensionType.None;
            case 1: return ExtensionType.Attributes;
            case 2: return ExtensionType.Blob;
            case 3: return ExtensionType.Creators;
            case 4: return ExtensionType.Links;
            case 5: return ExtensionType.Metadata;
            case 6: return ExtensionType.Grouping;
            case 7: return ExtensionType.Royalties;
            default: throw new Error(`Invalid extension value: ${value}`);
        }
    }

}

interface AssetParams {
    discriminator: number;
    state: number;
    standard: number;
    mutable: boolean;
    holder: string;
    group: string;
    authority: string;
    delegate: string | null;
    name: string;
}


class Asset {
    discriminator: number;
    state: number;
    standard: number;
    mutable: boolean;
    holder: string;
    group: string;
    authority: string;
    delegate: string | null;
    name: string;
    extensions: ExtensionData[];

    constructor(params: AssetParams) {
        Object.assign(this, params);
        this.extensions = [];
    }

    static deserialize(buffer) {
        let offset = 0;

        // Deserialize asset-specific fields
        const discriminator = buffer.readUInt8(offset++);
        const state = buffer.readUInt8(offset++);
        const standard = buffer.readUInt8(offset++);
        const mutable = buffer.readUInt8(offset++) !== 0;

        const holder = new PublicKey(buffer.subarray(offset, offset += 32)).toBase58();
        const group = new PublicKey(buffer.subarray(offset, offset += 32)).toBase58();
        const authority = new PublicKey(buffer.subarray(offset, offset += 32)).toBase58();

        let delegate = null;
        const delegateOption = buffer.readUInt8(offset++);
        if (delegateOption === 1) {
            delegate = new PublicKey(buffer.subarray(offset, offset += 32)).toBase58();
        } else {
            offset += 32;  // Skip if delegate doesn't exist
        }

        const nameBytes = buffer.subarray(offset, offset += 35);
        const nullTerminatorIndex = nameBytes.indexOf(0);
        const name = nullTerminatorIndex !== -1 ? nameBytes.subarray(0, nullTerminatorIndex).toString('utf-8') : nameBytes.toString('utf-8');

        // Initialize the Asset instance
        const asset = new Asset({ discriminator, state, standard, mutable, holder, group, authority, delegate, name });

        // Process extensions
        asset.extensions = asset.processExtensions(buffer, offset);

        return asset;
    }
    private fromBytesToTrait(bytes: Buffer): TraitComponents {
        const nameLength = bytes[0]; // Assuming U8PrefixStr is a length-prefixed string where the first byte is the length
        const name = bytes.subarray(1, 1 + nameLength).toString('utf-8');

        const valueOffset = 1 + nameLength;
        const valueLength = bytes[valueOffset];
        const value = bytes.subarray(valueOffset + 1, valueOffset + 1 + valueLength).toString('utf-8');

        return { name, value };
    };
    private publicKeyFromBytes(bytes) {
        return new PublicKey(bytes);
    }

    private byteToBool(byte) {
        return byte !== 0;
    }

    private deserializeLink(bytes: Buffer): { link: Link, length: number } {
        let cursor = 0;

        // Read the length of the name
        const nameLength = bytes.readUInt8(cursor++);
        // Read the name based on its length
        const name = bytes.toString('utf8', cursor, cursor + nameLength);
        cursor += nameLength; // Move the cursor past the name

        // Read the length of the URI
        const uriLength = bytes.readUInt8(cursor++);
        // Read the URI based on its length
        const uri = bytes.toString('utf8', cursor, cursor + uriLength);
        cursor += uriLength; // Move the cursor past the URI

        // The total length is the cursor position after reading name and uri
        const totalLength = cursor;

        // Return the deserialized Link and its total length
        return {
            link: { name, uri },
            length: totalLength
        };
    }
    private deserializeMetadata(bytes: Buffer): Metadata {
        let cursor = 0;

        // Deserialize the symbol
        const symbolLength = bytes.readUInt8(cursor++);
        const symbol = bytes.toString('utf8', cursor, cursor + symbolLength);
        cursor += symbolLength;

        // Deserialize the description
        const descriptionLength = bytes.readUInt8(cursor++);
        const description = bytes.toString('utf8', cursor, cursor + descriptionLength);
        cursor += descriptionLength;

        // Deserialize the URI
        const uriLength = bytes.readUInt8(cursor++);
        const uri = bytes.toString('utf8', cursor, cursor + uriLength);
        // cursor += uriLength; // This line is optional, as it's the last field

        return { symbol, description, uri };
    }

    private deserializeGrouping(bytes: Buffer): Grouping {
        if (bytes.length < 16) { // Ensure there's enough data for two u64 values
            throw new Error('Grouping data is too short.');
        }

        // Read the first 8 bytes as the size, converting from BigInt to Number
        const size = Number(bytes.readBigUInt64LE(0));

        // Read the next 8 bytes as max_size, converting from BigInt to Number
        const max_size = Number(bytes.readBigUInt64LE(8));

        return { size, max_size };
    }
    private deserializeRoyalties(bytes: Buffer): Royalties {
        if (bytes.length < 8) { // Ensure there's enough data for basisPoints
            throw new Error('Royalties data is too short.');
        }

        // Read the first 8 bytes as basisPoints, and convert to a number
        // Note: This conversion could lead to precision loss for very large values
        const basisPoints = Number(bytes.readBigUInt64LE(0));

        return { basisPoints };
    }


    private processExtensions(buffer, initialOffset) {
        let offset = initialOffset;
        const extensions: ExtensionData[] = [];

        while (offset < buffer.length) {
            // Load the extension at the current offset
            let extensionData: ExtensionData;
            try {
                extensionData = Extension.load(buffer, offset);

            } catch (error) {
                console.error(`Failed to load extension at offset ${offset}:`, error.message);
                return; // Exit the function if loading the extension fails
            }

            extensionData.raw = buffer.slice(extensionData.startOffset, extensionData.startOffset + extensionData.length);

            switch (extensionData.type) {
                case ExtensionType.Blob:
                    //const BMP_SIZE = 3126; // Fixed size for BMP data
                    //const bmpData = extensionData.raw.subarray(0, BMP_SIZE);

                    const contentTypeLength = extensionData.raw[0];
                    const contentType = new TextDecoder().decode(extensionData.raw.subarray(1, 1 + contentTypeLength));

                    if (contentType === "img/bmp") {
                        const bmpDataStartIndex = 1 + contentTypeLength;
                        const bmpData = extensionData.raw.subarray(bmpDataStartIndex);
                        extensionData.blobComponents = { bmpData };

                    } else {
                        console.error("Unexpected content type:", contentType);
                    }

                    break;

                case ExtensionType.Attributes:
                    const attributesComponents: AttributesComponents = { traits: [] };
                    let cursor = 0;
                    while (cursor < extensionData.raw.length) {
                        const trait = this.fromBytesToTrait(extensionData.raw.subarray(cursor));
                        cursor += 1 + trait.name.length + 1 + trait.value.length; // Adjust cursor to the next trait
                        attributesComponents.traits.push(trait);
                    }
                    extensionData.attributesComponents = attributesComponents;
                    break;
                case ExtensionType.Creators:
                    const creators = [];

                    let creatorOffset = extensionData.startOffset;
                    while (creatorOffset < extensionData.startOffset + extensionData.length) {
                        const CREATOR_LENGTH = 34;

                        const address = (this.publicKeyFromBytes(buffer.slice(creatorOffset, creatorOffset + 32))).toBase58();
                        const verified = this.byteToBool(buffer[creatorOffset + 32]);
                        const share = buffer[creatorOffset + 33];

                        creators.push({ address, verified, share });

                        creatorOffset += CREATOR_LENGTH; // Move to the next creator
                    }

                    // Store the creators array in the extensionData
                    extensionData.creators = { creators };
                    break;

                case ExtensionType.Links:
                    const links: Link[] = [];
                    let linksCursor = 0;

                    while (linksCursor < extensionData.raw.length) {
                        const { link, length } = this.deserializeLink(extensionData.raw.subarray(linksCursor));
                        linksCursor += length;
                        links.push(link);
                    }

                    extensionData.links = { values: links };
                    break;
                case ExtensionType.Metadata:
                    const metadata = this.deserializeMetadata(extensionData.raw);
                    extensionData.metadata = metadata;
                    break;
                case ExtensionType.Grouping:
                    const grouping = this.deserializeGrouping(extensionData.raw);
                    extensionData.grouping = grouping;
                    break;
                case ExtensionType.Royalties:
                    const royalties = this.deserializeRoyalties(extensionData.raw);
                    extensionData.royalties = royalties; 
                    break;
            }

            // Store extension data
            extensions.push(extensionData);
            // Use the boundary to move to the start of the next extension
            offset = extensionData.boundary;

            // Ensure the offset is within the buffer's bounds before the next iteration
            if (offset > buffer.length) {
                console.error(`Offset (${offset}) exceeds buffer length (${buffer.length}) after processing extension`);
                return; // Exit the function if the new offset is out of bounds
            }
        }
        return extensions;

    }

    async fetchBase64Png() {
        const blob = this.extensions.find(ext => ext.type === ExtensionType.Blob);
        if (blob && blob.blobComponents) {
            const png = await convertBmpToBase64(blob.blobComponents.bmpData);
            return png;
        }
    }

    async saveImg(filePaths = {
        png: `./test.png`,
    }) {
        const blob = this.extensions.find(ext => ext.type === ExtensionType.Blob);
        if (blob && blob.blobComponents) {
            if (blob.blobComponents.bmpData) {
                await writetBmpToPng(blob.blobComponents.bmpData, filePaths.png);
            }
        }
    }
}


export {
    Asset
};