//import Jimp from "jimp";
// for nextjs 
import Jimp from "jimp/es";

const writetBmpToPng = async (bmpBuffer: Buffer, filePath: string) => {
    try {
        const image = await Jimp.read(bmpBuffer);
        image.resize( 640, 640, Jimp.RESIZE_NEAREST_NEIGHBOR ); 
        await image.writeAsync(filePath);
    } catch (error) {
        console.error('Error converting BMP to PNG:', error);
        throw error;
    }
};

const convertBmpToBase64 = async (bmpBuffer: Buffer) => {
    try {
        const image = await Jimp.read(bmpBuffer);
        image.resize( 640, 640, Jimp.RESIZE_NEAREST_NEIGHBOR ); 
        const png = await image.getBase64Async(Jimp.MIME_PNG);
        return png;
    } catch (error) {
        console.error('Error converting BMP to Base64 PNG:', error);
        throw error;
    }
};

export { writetBmpToPng, convertBmpToBase64 };