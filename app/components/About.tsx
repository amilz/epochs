import React from 'react';

const About: React.FC = () => {
    return (
        <div className="text-white px-4 py-8 mb-40 lg:px-20">
            <h1 className='text-3xl lg:text-5xl font-bold mb-4 text-center'>One Epoch, every epoch, forever!</h1>
            <p className='italic mb-6 text-center max-w-4xl mx-auto'>
                A unique Eclipse NFT community inspired by <a href="https://nouns.wtf/" target="_blank" rel="noopener noreferrer" className="underline text-blue-300 hover:text-blue-500">The Nouns DAO</a>.
            </p>
            <p className='mb-4 text-lg text-center max-w-4xl mx-auto'>
                The name, “Epoch”, is inspired by the term of the same name which represents the passage of time on-chain (432,000 slots). One Epoch NFT will be created and auctioned each epoch on Eclipse Mainnet.
            </p>
            <h2 className="text-2xl mb-2 font-semibold text-left">Features:</h2>
            <ul className="list-disc pl-5 ml-5 text-lg mb-6 max-w-3xl mx-auto">
                <li>Art is generated 100% on-chain each epoch</li>
                <li>Trustless auction process</li>
                <li>Built-in reputation program</li>
                <li>100% open source</li>
                <li>90% of proceeds to DAO treasury</li>
                <li>Treasury supports funding Eclipse ecosystem development</li>
            </ul>
        </div>
    );
};

export default About;
