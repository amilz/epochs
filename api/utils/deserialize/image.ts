import Jimp from "jimp";

const convertBmpToPng = async (bmpBuffer: Buffer, filePath: string) => {
    try {
        const image = await Jimp.read(bmpBuffer);
        image.resize( 640, 640, Jimp.RESIZE_NEAREST_NEIGHBOR ); 
        await image.writeAsync(filePath);
    } catch (error) {
        console.error('Error converting BMP to PNG:', error);
        throw error;
    }
};

export { convertBmpToPng };