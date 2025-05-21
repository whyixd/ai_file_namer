
import React from 'react';

interface LoadingSpinnerProps {
  small?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ small = false }) => {
  const sizeClasses = small ? 'w-6 h-6 border-2' : 'w-12 h-12 border-4';
  return (
    <div className="flex justify-center items-center">
      <div
        className={`${sizeClasses} border-purple-500 border-t-transparent rounded-full animate-spin`}
        role="status"
        aria-live="polite"
      >
        <span className="sr-only">載入中...</span>
      </div>
       {!small && <p className="ml-3 text-slate-300">分析檔案...</p>}
       {small && <span className="ml-2 text-sm">產生建議...</span>}
    </div>
  );
};
