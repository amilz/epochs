"use client"
import { AssetImage } from "@/components/EpochInfo/AssetImage";
import { EpochNumber } from "@/components/EpochInfo/EpochNumber";

export const LoadingEpoch: React.FC = () => {

/*     const [progress, setProgress] = useState(0);
    useEffect(() => {
        const intervalId = setInterval(() => {
            setProgress((prevProgress) => {
                if (prevProgress >= 100) {
                    return 0;
                }
                return (prevProgress + 0.5)
            });
        }, 10);

        return () => clearInterval(intervalId);
    }, []);
 */


    const imgSrc = '/loading.gif';
    return (


        <div className="flex flex-col items-start my-12 mx-6">
            <EpochNumber />
            <>
                <div className="w-full min-w-80	flex items-center">
                    <p className="text-base text-gray-300 mr-2">{'progress to next epoch:'}</p>
                    <div className="flex-1 h-2 bg-zinc-700 ">
                        <div className="h-2 bg-white" style={{ width: `${0}%` }}></div>
                    </div>
                </div>
                <p className="text-sm text-gray-300">{'eclipse testnet'}</p>
            </>
            {/* Bottom half content */}
            <div className="flex flex-col lg:flex-row w-full text-sm text-white mt-8">
                {/* AssetImage will show up on top on mobile and on the left on desktop */}
                <div className="mb-4 lg:mb-0 flex-shrink-0">
                    <AssetImage src={imgSrc} />
                </div>
            </div>
        </div>
    );


};
