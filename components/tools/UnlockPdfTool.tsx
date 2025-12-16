
import React, { useState } from 'react';
import { AppFile, ProcessedFile } from '../../types';
import Dropzone from '../Dropzone';
import Button from '../Button';
import LoadingSpinner from '../LoadingSpinner';
import FilePreviewCard from '../FilePreviewCard';
import { securityService } from '../../services/securityService';

interface UnlockPdfToolProps {
  onUpload: (files: File[]) => void;
  uploadedFiles: AppFile[];
  onRemoveFile: (id: string) => void;
}

const UnlockPdfTool: React.FC<UnlockPdfToolProps> = ({ onUpload, uploadedFiles, onRemoveFile }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ id: string, file: ProcessedFile }[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleUnlock = async () => {
    if (uploadedFiles.length === 0) return;
    setLoading(true);
    setResults([]);
    setErrors({});
    setGeneralError(null);

    const newResults = [];
    const newErrors: Record<string, string> = {};

    for (const file of uploadedFiles) {
      try {
        const result = await securityService.unlockPdf(file, password);
        newResults.push({ id: file.id, file: result });
      } catch (e) {
        console.error(e);
        newErrors[file.id] = "Incorrect password or unlock failed.";
      }
    }

    setResults(newResults);
    setErrors(newErrors);
    setLoading(false);

    if (Object.keys(newErrors).length > 0 && newResults.length === 0) {
       setGeneralError("Failed to unlock file(s). Please check the password.");
    }
  };

  const handleDownloadAll = () => {
    results.forEach(({ file }) => {
        const link = document.createElement('a');
        link.href = file.dataUrl;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
  };

  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto min-h-[500px] flex flex-col">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center">
            <span className="bg-orange-100 text-orange-600 p-2 rounded-full mr-3">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/></svg>
            </span>
            Unlock PDF
        </h2>
        <p className="text-gray-500">Remove passwords and encryption from PDF documents instantly.</p>
      </div>

      {uploadedFiles.length === 0 ? (
         <div className="flex-grow flex flex-col justify-center">
            <Dropzone onFilesSelected={onUpload} acceptedFileTypes={['application/pdf']} multiple={true} label="Drag & drop password-protected PDFs here" />
         </div>
      ) : (
         <div className="flex-grow">
            <div className="max-w-lg mx-auto mb-8">
               <label className="block text-sm font-medium text-gray-700 mb-2">Enter PDF Password</label>
               <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setGeneralError(null); }}
                    className="w-full border border-gray-300 rounded-lg p-3 pr-10 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Password to open file..."
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
               </div>
               {generalError && <p className="text-red-500 text-sm mt-2">{generalError}</p>}
            </div>

            <div className="space-y-3 mb-8">
               {uploadedFiles.map(file => {
                  const res = results.find(r => r.id === file.id);
                  const err = errors[file.id];
                  
                  return (
                     <div key={file.id} className={`flex items-center justify-between p-4 bg-white border rounded-lg ${res ? 'border-green-300 bg-green-50' : err ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                        <div className="flex items-center space-x-3 overflow-hidden">
                           <div className="p-2 bg-gray-100 rounded text-red-500"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div>
                           <div>
                              <p className="font-medium text-gray-800 truncate max-w-xs">{file.name}</p>
                              <div className="text-xs text-gray-500 flex gap-2">
                                 <span>Original: {(file.size / 1024).toFixed(1)} KB</span>
                                 {res && <span className="text-green-600 font-bold">Unlocked: {(res.file.size / 1024).toFixed(1)} KB</span>}
                              </div>
                           </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                           {res ? (
                              <button onClick={() => { const l = document.createElement('a'); l.href=res.file.dataUrl; l.download=res.file.name; l.click(); }} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded shadow-sm">
                                 Download
                              </button>
                           ) : err ? (
                              <span className="text-red-500 text-xs font-bold">{err}</span>
                           ) : (
                              <button onClick={() => onRemoveFile(file.id)} className="text-gray-400 hover:text-red-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                           )}
                        </div>
                     </div>
                  );
               })}
            </div>

            <div className="flex justify-center space-x-4">
                {!loading && (
                   <>
                      <Button variant="secondary" onClick={() => onUpload([])}>Add More Files</Button>
                      <Button onClick={handleUnlock} className="bg-green-600 hover:bg-green-700 shadow-lg px-8">
                         {results.length > 0 && Object.keys(errors).length === 0 ? "Unlock Again" : "Unlock PDF"}
                      </Button>
                      {results.length > 1 && (
                         <Button variant="primary" onClick={handleDownloadAll}>Download All</Button>
                      )}
                   </>
                )}
                {loading && <LoadingSpinner message="Decrypting files..." />}
            </div>
         </div>
      )}
    </div>
  );
};

export default UnlockPdfTool;
