
import React from 'react';
import { ClipboardCopyIcon } from './Icons'; // Assuming Icons.tsx exists

interface SuggestedNameListProps {
  names: string[];
}

export const SuggestedNameList: React.FC<SuggestedNameListProps> = ({ names }) => {
  const [copiedName, setCopiedName] = React.useState<string | null>(null);

  const handleCopy = (name: string) => {
    navigator.clipboard.writeText(name)
      .then(() => {
        setCopiedName(name);
        setTimeout(() => setCopiedName(null), 2000); // Reset after 2 seconds
      })
      .catch(err => console.error('Failed to copy: ', err));
  };

  if (names.length === 0) {
    return <p className="text-slate-400">No suggestions yet. Upload a document and provide instructions.</p>;
  }

  return (
    <ul className="space-y-3">
      {names.map((name, index) => (
        <li
          key={index}
          className="flex items-center justify-between bg-slate-700 p-3 rounded-md shadow hover:bg-slate-600/70 transition-colors duration-150"
        >
          <span className="text-slate-100 break-all">{name}</span>
          <button
            onClick={() => handleCopy(name)}
            title="Copy name"
            className="ml-3 p-1.5 rounded text-slate-400 hover:text-purple-400 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
          >
            <ClipboardCopyIcon className="w-5 h-5" />
            {copiedName === name && <span className="text-xs text-green-400 ml-1 absolute -right-16 top-1/2 -translate-y-1/2 bg-slate-800 px-1 py-0.5 rounded">Copied!</span>}
          </button>
        </li>
      ))}
    </ul>
  );
};
