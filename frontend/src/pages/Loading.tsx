import React from 'react';

const Loading: React.FC = () => {

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900" />
      <div className="text-lg font-bold">Loading...</div>
      <div className="text-sm text-gray-500">Please wait while we load the page...</div>
    </div>
  );
};

export default Loading;