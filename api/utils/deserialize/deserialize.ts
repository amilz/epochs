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
    //jsonData: Buffer;
}

interface ExtensionData {
    type: ExtensionType;
    length: number;
    boundary: number;
    startOffset: number;
    raw?: Buffer;
    blobComponents?: BlobComponents;
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

    private processExtensions(buffer, initialOffset) {
        let offset = initialOffset;
        const extensions: ExtensionData[] = [];

        while (offset < buffer.length) {
            // Load the extension at the current offset
            let extensionData: ExtensionData;
            try {
                extensionData = Extension.load(buffer, offset);
                // console \table extensionData without raw or blobComponents
                let { type, length, boundary, startOffset } = extensionData;
                console.table({ type, length, boundary, startOffset });
                
            } catch (error) {
                console.error(`Failed to load extension at offset ${offset}:`, error.message);
                return; // Exit the function if loading the extension fails
            }

            // console.log(`Extension Type: ${extensionData.type}`);
            // Process the extension based on its type
            // switch (extensionData.type) {
            //     case ExtensionType.Blob:
            //         // Process Blob extension
            //         break;
            //     // Handle other extension types as needed
            // }

            extensionData.raw = buffer.slice(extensionData.startOffset, extensionData.startOffset + extensionData.length);

            switch (extensionData.type) {
                case ExtensionType.Blob:
                    // Extract the BMP and JSON components

                    //const BMP_SIZE = 3126; // Fixed size for BMP data
                    //const bmpData = extensionData.raw.subarray(0, BMP_SIZE);

                    const contentTypeLength = extensionData.raw[0];

                    // Extract the content type string based on its length
                    const contentType = new TextDecoder().decode(extensionData.raw.subarray(1, 1 + contentTypeLength));

                    // Check if the content type is what you expect, e.g., "img/bmp"
                    if (contentType === "img/bmp") {
                        // The BMP data starts right after the content type and its length prefix
                        const bmpDataStartIndex = 1 + contentTypeLength;
                        const bmpData = extensionData.raw.subarray(bmpDataStartIndex);

                        // Store the BMP data in the blobComponents property
                        extensionData.blobComponents = { bmpData };

                        // Additional processing for BMP data can be done here
                    } else {
                        console.error("Unexpected content type:", contentType);
                        // Handle unexpected content type appropriately
                    }

                    // Store the parsed components in the blobComponents property
                    // extensionData.blobComponents = { bmpData };

                    // Additional processing for BMP and JSON data can be done here
                    break;
                // Handle other extension types as needed
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
        }
    }

    async saveImg(filePaths = {
        png: `./test.png`,
    }) {
        const blob = this.extensions.find(ext => ext.type === ExtensionType.Blob);
        // TODO - dynamic file paths
        // TODO - use API to return stuff i can upload or open in the web
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