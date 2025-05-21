
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './Icons';

interface FileUploadProps {
  onFileSelect: (file: File | null, content: string | null, mimeType: string | null, error: string | null) => void;
  disabled: boolean;
}

const TEXT_MIME_TYPE_PREFIX = "text/";
const KNOWN_TEXT_MIME_TYPES = [
  "application/json", "application/xml", "application/javascript", "application/rtf",
  "application/x-python", "application/x-sh", "application/x-csh", "application/x-php",
  "application/x-java-source", "application/x-sql", "application/x-httpd-php",
  "application/csv", // Note: text/csv is covered by prefix
  "application/typescript", 
];

const DOCX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const PDF_MIME_TYPE = "application/pdf";

// Broad accept string for common types;
const ACCEPTED_FILE_TYPES = [
  // Text based
  ".txt", "text/plain",
  ".md", ".markdown", "text/markdown",
  ".html", ".htm", "text/html",
  ".json", "application/json",
  ".xml", "text/xml", "application/xml",
  ".csv", "text/csv", "application/csv",
  ".js", "text/javascript", "application/javascript",
  ".css", "text/css",
  ".py", "text/x-python", "application/x-python",
  ".java", "text/x-java-source",
  ".php", "application/x-httpd-php", "text/x-php",
  ".rb", "text/x-ruby", "application/x-ruby",
  ".sh", "application/x-sh",
  ".rtf", "application/rtf",
  ".ts", "application/typescript",

  // PDF
  ".pdf", PDF_MIME_TYPE,

  // DOCX
  ".docx", DOCX_MIME_TYPE,

  // Image based
  "image/*", 

  // Audio based
  "audio/*", 
  
  // Video based
  "video/*", 
].join(',');


export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled }) => {
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);

  const processFile = useCallback((file: File) => {
    let currentMimeType = file.type || ""; // Ensure mimeType is a string
    const fileName = file.name.toLowerCase();
    setSelectedFileName(file.name);

    const isPotentiallyTextFile = currentMimeType.startsWith(TEXT_MIME_TYPE_PREFIX) || 
                       KNOWN_TEXT_MIME_TYPES.includes(currentMimeType) ||
                       ((!currentMimeType || currentMimeType === "application/octet-stream") && 
                        /\.(txt|md|markdown|json|xml|csv|html|htm|js|css|py|java|rb|sh|php|ts)$/i.test(fileName));
    
    const isDocxFile = currentMimeType === DOCX_MIME_TYPE || 
                       ((!currentMimeType || currentMimeType === "application/octet-stream") && fileName.endsWith(".docx"));
    
    if (isDocxFile) {
        currentMimeType = DOCX_MIME_TYPE; // Standardize if recognized by extension
    }


    const reader = new FileReader();

    reader.onerror = () => {
      onFileSelect(null, null, null, `Error reading file: ${file.name}. Please try again.`);
      setSelectedFileName(null);
    };

    if (isDocxFile) {
      // For DOCX, simulate text extraction and send as 'text/plain'.
      // In a real app, integrate a library like mammoth.js here.
      // This placeholder approach avoids sending the DOCX_MIME_TYPE to Gemini, fixing the error.
      reader.onload = () => {
        const placeholderText = `[Text content from DOCX file: ${file.name}] (Note: This is a placeholder. Full DOCX content analysis requires a specific client-side parsing library.)`;
        onFileSelect(file, placeholderText, 'text/plain', null);
      };
      // We read as DataURL simply to trigger the async onload, the actual content isn't used for this placeholder.
      reader.readAsDataURL(file); 
    } else if (isPotentiallyTextFile) { 
      reader.onload = (e) => {
        const text = e.target?.result as string;
        onFileSelect(file, text, currentMimeType || 'text/plain', null);
      };
      reader.readAsText(file);
    } else if (
        currentMimeType.startsWith("image/") || 
        currentMimeType.startsWith("audio/") || 
        currentMimeType.startsWith("video/") || 
        currentMimeType === PDF_MIME_TYPE
      ) {
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const base64Data = dataUrl.substring(dataUrl.indexOf(',') + 1);
        onFileSelect(file, base64Data, currentMimeType, null);
      };
      reader.readAsDataURL(file);
    } else {
        onFileSelect(null, null, null, `Unsupported file type: "${currentMimeType || 'unknown'}" for file "${file.name}". Please upload a supported Text, PDF, DOCX, Image, Audio, or Video file.`);
        setSelectedFileName(null);
        return;
    }
  }, [onFileSelect]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    } else {
      onFileSelect(null, null, null, null); // Clear selection
      setSelectedFileName(null);
    }
    event.target.value = ''; // Reset input
  }, [processFile, onFileSelect]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
    if (disabled) return;

    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [disabled, processFile]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    setDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
  }, []);


  return (
    <div className="flex flex-col items-center space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`w-full p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors duration-200 ease-in-out
                    ${disabled ? 'bg-slate-700 border-slate-600 cursor-not-allowed' : 
                     dragOver ? 'border-purple-500 bg-slate-700' : 
                     'border-slate-600 hover:border-purple-400 bg-slate-700/50 hover:bg-slate-700'}`}
      >
        <input
          type="file"
          id="fileUpload"
          accept={ACCEPTED_FILE_TYPES}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
          aria-label="File upload input"
        />
        <label htmlFor="fileUpload" className={`flex flex-col items-center justify-center space-y-2 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
          <UploadIcon className={`w-10 h-10 mb-2 ${dragOver ? 'text-purple-400' : 'text-slate-400'}`} />
          <p className="text-sm text-slate-300">
            <span className="font-semibold text-purple-300">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-slate-500">Supported: Text, PDF, DOCX, Image, Audio, Video</p>
        </label>
      </div>
      {selectedFileName && (
        <p className="text-sm text-green-400">
          Selected: <span className="font-medium">{selectedFileName}</span>
        </p>
      )}
    </div>
  );
};
