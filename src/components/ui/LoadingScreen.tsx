'use client';

export const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#161618' }}>
      <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};