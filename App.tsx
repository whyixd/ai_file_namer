
import React, { useState, useCallback, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { SuggestedNameList } from './components/SuggestedNameList';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { suggestDocumentNames } from './services/geminiService';
import { LogoIcon, InfoIcon } from './components/Icons';

const App: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string | null>(null);
  const [documentContent, setDocumentContent] = useState<string | null>(null); // Can be text or base64
  const [uploadedFileMimeType, setUploadedFileMimeType] = useState<string | null>(null);
  const [namingRefContent, setNamingRefContent] = useState<string | null>(null);
  const [namingRefError, setNamingRefError] = useState<string | null>(null);
  const [suggestedNames, setSuggestedNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showNamingRef, setShowNamingRef] = useState<boolean>(false);


  useEffect(() => {
    const fetchNamingRef = async () => {
      setIsLoading(true); // Indicate loading for naming ref
      try {
        const response = await fetch('naming_ref.md');
        if (!response.ok) {
          throw new Error(`Failed to load naming_ref.md: ${response.status} ${response.statusText}`);
        }
        const text = await response.text();
        setNamingRefContent(text);
        setNamingRefError(null);
      } catch (err) {
        if (err instanceof Error) {
          setNamingRefError(`Error loading naming guidelines (naming_ref.md): ${err.message}. Suggestions may not follow specific rules.`);
        } else {
          setNamingRefError("An unknown error occurred while fetching naming guidelines (naming_ref.md).");
        }
        console.error("Failed to fetch naming_ref.md:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNamingRef();
  }, []);

  const handleFileSelect = useCallback((file: File | null, content: string | null, mimeType: string | null, errorMsg: string | null) => {
    setUploadedFile(file);
    setOriginalFileName(file ? file.name : null);
    setDocumentContent(content);
    setUploadedFileMimeType(mimeType);
    setError(errorMsg); 
    setSuggestedNames([]); 
  }, []);

  const handleSubmit = async () => {
    if (!documentContent || !uploadedFileMimeType || !originalFileName) {
      setError("Please upload a supported file first (Text, PDF, DOCX, Image, Audio, or Video).");
      return;
    }
    if (!namingRefContent && !namingRefError) {
      setError("Naming guidelines (naming_ref.md) are not loaded or still loading. Please ensure the file is accessible and try again.");
      return;
    }
     if (namingRefError && !namingRefContent) {
      setError(`Cannot proceed: ${namingRefError}`);
      return;
    }

    if (!process.env.API_KEY) {
        setError("API key is not configured. Please ensure the API_KEY environment variable is set.");
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    setError(null); 
    setSuggestedNames([]);

    try {
      const instructionsToUse = namingRefContent || "Suggest 5 concise and relevant file names. Ensure they are suitable for typical file systems.";
      const names = await suggestDocumentNames(originalFileName, documentContent, uploadedFileMimeType, instructionsToUse);
      setSuggestedNames(names);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred while suggesting names.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-slate-100 flex flex-col items-center p-4 sm:p-6 selection:bg-purple-500 selection:text-white">
      <header className="w-full max-w-3xl mb-8 text-center">
        <div className="flex items-center justify-center space-x-3 mb-2">
          <LogoIcon className="h-12 w-12 text-purple-400" />
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
            WHYIXD 文件命名器
          </h1>
        </div>
        <p className="text-slate-400 text-lg">
          上傳文件 (Text, PDF, DOCX, Image, Audio, Video) 獲得 AI 基於文件管理指南所建議的檔案名稱.
        </p>
      </header>

      <main className="w-full max-w-3xl space-y-8">
        <section className="bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-purple-300">1. 上傳檔案</h2>
             <button 
                onClick={() => setShowNamingRef(!showNamingRef)}
                className="flex items-center text-sm text-purple-300 hover:text-purple-200 transition-colors"
                title={showNamingRef ? "隱藏指南" : "顯示指南"}
                aria-expanded={showNamingRef}
                disabled={!namingRefContent && !namingRefError} // Disable if guidelines not loaded or error
             >
                <InfoIcon className="w-5 h-5 mr-1" />
                {showNamingRef ? "隱藏" : "顯示"}指南
             </button>
          </div>
          <FileUpload onFileSelect={handleFileSelect} disabled={isLoading} />
        </section>
        
        {showNamingRef && namingRefContent && (
          <section className="bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-700 prose prose-invert max-w-none prose-sm sm:prose-base">
             <h3 className="text-xl font-semibold mb-3 text-purple-300">命名指南 (基於 naming_ref.md)</h3>
             <pre className="whitespace-pre-wrap bg-slate-700/50 p-4 rounded-md overflow-x-auto max-h-96">
                <code>{namingRefContent}</code>
             </pre>
          </section>
        )}
        
        {namingRefError && (
            <div className="mt-0 mb-4">
                 <ErrorMessage message={namingRefError} />
            </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={isLoading || !documentContent || !uploadedFileMimeType || (!namingRefContent && !!namingRefError) || (!namingRefContent && !namingRefError && !isLoading) }
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transform transition-all duration-150 ease-in-out hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-400 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            aria-label="Suggest names for the uploaded file"
          >
            {isLoading && !error ? <LoadingSpinner small={true} /> : '產生建議名稱'}
          </button>
        </div>
        
        {error && (
          <div className="mt-6">
            <ErrorMessage message={error} />
          </div>
        )}

        {isLoading && !error && ( 
          <div className="mt-6 flex justify-center">
            <LoadingSpinner />
          </div>
        )}
        
        {suggestedNames.length > 0 && !isLoading && !error && (
          <section className="bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-700 mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">Suggested Names</h2>
            <SuggestedNameList names={suggestedNames} />
          </section>
        )}
      </main>
      
      <footer className="w-full max-w-3xl mt-12 text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} AI File Namer. Powered by Gemini.</p>
        <p>Using predefined naming guidelines from <code>naming_ref.md</code>.</p>
      </footer>
    </div>
  );
};

export default App;
