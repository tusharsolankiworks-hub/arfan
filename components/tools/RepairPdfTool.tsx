
import React, { useState } from 'react';
import { AppFile, ProcessedFile } from '../../types';
import Dropzone from '../Dropzone';
import Button from '../Button';
import LoadingSpinner from '../LoadingSpinner';
import FilePreviewCard from '../FilePreviewCard';
import { repairService, RepairResult } from '../../services/repairService';
import JSZip from 'jszip';

interface RepairPdfToolProps {
  onUpload: (files: File[]) => void;
  uploadedFiles: AppFile[];
  onRemoveFile: (id: string) => void;
}

const RepairPdfTool: React.FC<RepairPdfToolProps> = ({ onUpload, uploadedFiles, onRemoveFile }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RepairResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  const handleRepair = async () => {
    if (uploadedFiles.length === 0) return;
    setLoading(true);
    setResults([]);
    setError(null);
    setCurrentFileIndex(0);

    const newResults: RepairResult[] = [];

    for (let i = 0; i < uploadedFiles.length; i++) {
        setCurrentFileIndex(i + 1);
        try {
            const result = await repairService.repairPdf(uploadedFiles[i]);
            newResults.push(result);
        } catch (e) {
            // Push a placeholder for failed file to keep index alignment or handle differently
            // For now, we just alert/log and continue, but UI needs to show failure.
            console.error(`Failed to repair ${uploadedFiles[i].name}:`, e);
        }
    }
    
    setResults(newResults);
    setLoading(false);
    if (newResults.length === 0 && uploadedFiles.length > 0) {
        setError("Repair failed for all files. The documents might be encrypted or too heavily corrupted.");
    }
  };

  const handleDownloadAll = async () => {
      const zip = new JSZip();
      results.forEach(res => {
          const base64 = res.file.dataUrl.split(',')[1];
          zip.file(res.file.name, base64, { base64: true });
      });
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `repaired_pdfs.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const formatSize = (bytes: number) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md max-w-5xl mx-auto min-h-[600px] flex flex-col">
      <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center">
            <span className="bg-red-100 text-red-600 p-2 rounded-full mr-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            </span>
            Repair PDF
          </h2>
          <p className="text-gray-500">Recover data from corrupted or damaged PDF files. We rebuild the document structure to make it readable again.</p>
      </div>

      {uploadedFiles.length === 0 ? (
          <div className="flex-grow flex flex-col justify-center">
              <Dropzone onFilesSelected={onUpload} acceptedFileTypes={['application/pdf']} multiple={true} label="Drag & drop damaged PDFs here (Max 10)" />
          </div>
      ) : (
          <div className="flex-grow">
              {!loading && results.length === 0 && (
                  <div className="mb-6">
                      <h3 className="font-bold text-gray-700 mb-4">Files to Repair ({uploadedFiles.length})</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {uploadedFiles.map(file => (
                              <FilePreviewCard key={file.id} file={file} onRemove={onRemoveFile} />
                          ))}
                      </div>
                      <div className="mt-8 text-center">
                          <Button onClick={handleRepair} className="bg-green-600 hover:bg-green-700 px-12 py-4 text-lg shadow-lg">
                              Repair Now
                          </Button>
                      </div>
                  </div>
              )}

              {loading && (
                  <div className="flex flex-col items-center justify-center h-64">
                      <LoadingSpinner message={`Analyzing and rebuilding file ${currentFileIndex} of ${uploadedFiles.length}...`} />
                      <p className="text-sm text-gray-500 mt-4 max-w-md text-center">We are attempting to reconstruct the XRef table and recover page objects.</p>
                  </div>
              )}

              {results.length > 0 && (
                  <div className="animate-fade-in">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-bold text-gray-800">Repair Results</h3>
                          {results.length > 1 && (
                              <Button onClick={handleDownloadAll} variant="primary">Download All (ZIP)</Button>
                          )}
                      </div>
                      
                      <div className="space-y-4">
                          {results.map((res, idx) => (
                              <div key={idx} className={`border rounded-lg p-6 flex flex-col md:flex-row items-center justify-between ${res.status === 'fully' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                                  <div className="mb-4 md:mb-0">
                                      <h4 className="font-bold text-gray-800 text-lg mb-1">{res.file.name}</h4>
                                      <p className={`text-sm font-medium ${res.status === 'fully' ? 'text-green-700' : 'text-yellow-700'}`}>
                                          Status: {res.status === 'fully' ? 'Fully Repaired' : 'Partially Recovered'}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-2">{res.message}</p>
                                  </div>
                                  
                                  <div className="flex items-center gap-8 text-sm text-gray-600 mb-4 md:mb-0">
                                      <div className="text-center">
                                          <div className="font-bold text-gray-400">Pages</div>
                                          <div>{res.originalPageCount} <span className="text-gray-400">→</span> <span className="font-bold text-gray-800">{res.repairedPageCount}</span></div>
                                      </div>
                                      <div className="text-center">
                                          <div className="font-bold text-gray-400">Size</div>
                                          <div>{formatSize(res.originalSize)} <span className="text-gray-400">→</span> <span className="font-bold text-gray-800">{formatSize(res.repairedSize)}</span></div>
                                      </div>
                                  </div>

                                  <Button 
                                    onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = res.file.dataUrl;
                                        link.download = res.file.name;
                                        link.click();
                                    }} 
                                    className={`${res.status === 'fully' ? 'bg-green-600' : 'bg-yellow-600 border-none text-white hover:bg-yellow-700'}`}
                                  >
                                      Download
                                  </Button>
                              </div>
                          ))}
                      </div>
                      
                      <div className="mt-8 text-center">
                          <Button variant="secondary" onClick={() => { setResults([]); onUpload([]); }}>Repair More Files</Button>
                      </div>
                  </div>
              )}
              
              {error && (
                  <div className="mt-6 p-4 bg-red-100 text-red-700 rounded-lg text-center border border-red-200">
                      <p className="font-bold">Error:</p>
                      <p>{error}</p>
                      <Button variant="secondary" size="sm" className="mt-4" onClick={() => { setError(null); setLoading(false); }}>Try Again</Button>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};

export default RepairPdfTool;
