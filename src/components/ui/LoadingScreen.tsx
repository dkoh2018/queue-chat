'use client';

import Image from 'next/image';

export const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#161618' }}>
      <Image 
        src="/loading_running.gif" 
        alt="Loading..." 
        width={256}
        height={256}
        className="w-64 h-64"
        style={{ filter: 'brightness(1.1)' }}
        unoptimized
      />
    </div>
  );
};