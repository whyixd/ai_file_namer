
import React from 'react';
import { AlertTriangleIcon } from './Icons'; // Assuming Icons.tsx exists

interface ErrorMessageProps {
  message: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div
      className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative flex items-start"
      role="alert"
    >
      <AlertTriangleIcon className="w-5 h-5 mr-3 mt-0.5 text-red-400 flex-shrink-0" />
      <div>
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{message}</span>
      </div>
    </div>
  );
};
