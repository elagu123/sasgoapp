import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus.ts';

const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-1 rounded-full dark:bg-yellow-900 dark:text-yellow-300">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636a9 9 0 010 12.728m-12.728 0a9 9 0 010-12.728m12.728 0L5.636 18.364"></path></svg>
      <span>Offline</span>
    </div>
  );
};

export default OfflineIndicator;