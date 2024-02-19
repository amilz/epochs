import { readdirSync, readFileSync } from 'fs';
import * as path from 'path';

interface Attribute {
    trait_type: string;
    value: string;
}

interface NFT {
    attributes: Attribute[];
}

enum traitType {
    hat = 'hat',
    clothes = 'clothes',
    glasses = 'glasses',
    body = 'body',
    background = 'background',
}

const jsonDir = './img-outputs/json/';
const searchTrait: traitType = traitType.glasses;

const files = readdirSync(jsonDir);
const traitValues: Record<string, number> = {};

files.forEach(file => {
    if (path.extname(file) === '.json') {
        const filePath = path.join(jsonDir, file);
        const content = readFileSync(filePath, 'utf-8');
        const nft: NFT = JSON.parse(content);

        nft.attributes.forEach(attribute => {
            if (attribute.trait_type === searchTrait) {
                if (!traitValues[attribute.value]) {
                    traitValues[attribute.value] = 1;
                } else {
                    traitValues[attribute.value]++;
                }
            }
        });
    }
});

console.log(`Frequency distribution of ${traitType} values:`);
console.log(traitValues);
