
// This component is no longer used in App.tsx as of the latest changes.
// Instructions are now loaded from naming_ref.md.
// It can be safely deleted if not needed for other purposes.

import React from 'react';

interface InstructionInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

export const InstructionInput: React.FC<InstructionInputProps> = ({ value, onChange, disabled }) => {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      rows={4}
      placeholder="e.g., Make it short and catchy, include the main topic, use underscores instead of spaces..."
      className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-slate-100 placeholder-slate-400 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
      aria-label="Naming instructions for the document"
    />
  );
};
