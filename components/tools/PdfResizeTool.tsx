import React, { useState } from 'react';
import { AppFile, ProcessedFile } from '../../types';
import Dropzone from '../Dropzone';
import Button from '../Button';
import LoadingSpinner from '../LoadingSpinner';
import FilePreviewCard from '../FilePreviewCard';
import { pdfService } from '../../services/pdfService';

interface PdfResizeToolProps {
  onUpload: (files: File[]) => void;
  uploadedFiles: AppFile[];
  onRemoveFile: (id: string) => void;
}

const PdfResizeTool: React.FC<PdfResizeToolProps> = ({ onUpload, uploadedFiles, onRemoveFile }) => {
  const [loading, setLoading] = useState(false);
  const [processedFile, setProcessedFile] = useState<ProcessedFile | null>(null);
  const [targetSize, setTargetSize] = useState<'a4' | 'a3' | 'letter' | 'custom'>('a4');
  const [customWidth, setCustomWidth] = useState<number>(595); // Default A4 point width
  const [customHeight, setCustomHeight] = useState<number>(842); // Default A4 point height
  const [error, setError] = useState<string | null>(null);

  const handleResize = async () => {
    if (uploadedFiles.length === 0) return;
    setLoading(true);
    setProcessedFile(null);
    setError(null);

    try {
        const result = await pdfService.resizePdf(uploadedFiles[0], targetSize, customWidth, customHeight);
        setProcessedFile(result);
    } catch (e) {
        console.error(e);
        setError("Resize failed: " + (e as Error).message);
    } finally {
        setLoading(false);
    }
  };

  const handleDownload = () => {
      if (!processedFile) return;
      const link = document.createElement('a');
      link.href = processedFile.dataUrl;
      link.download = processedFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto min-h-[600px] flex flex-col">
      <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center">
            <span className="bg-blue-100 text-blue-600 p-2 rounded-lg mr-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"/></svg>
            </span>
            Resize PDF
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto">Change PDF page dimensions. Scale your document content to A4, Letter, A3 or custom sizes.</p>
      </div>

      {uploadedFiles.length === 0 ? (
          <div className="flex-grow flex flex-col justify-center">
              <Dropzone onFilesSelected={onUpload} acceptedFileTypes={['application/pdf']} multiple={false} label="Drag & drop PDF to resize" />
          </div>
      ) : (
          <div className="flex-grow">
              <div className="mb-6">
                  <h3 className="font-bold text-gray-700 mb-4">Selected File</h3>
                  <FilePreviewCard file={uploadedFiles[0]} onRemove={onRemoveFile} />
              </div>

              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6">
                  <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Page Size Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Target Page Size</label>
                          <div className="grid grid-cols-2 gap-2">
                              {['a4', 'letter', 'a3', 'custom'].map((s) => (
                                  <button 
                                    key={s} 
                                    onClick={() => setTargetSize(s as any)}
                                    className={`px-4 py-3 rounded-lg border text-sm font-bold uppercase transition-all ${targetSize === s ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'}`}
                                  >
                                      {s}
                                  </button>
                              ))}
                          </div>
                      </div>
                      
                      {targetSize === 'custom' && (
                          <div className="grid grid-cols-2 gap-4 animate-fade-in">
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Width (Points)</label>
                                  <input type="number" value={customWidth} onChange={(e) => setCustomWidth(Number(e.target.value))} className="w-full border rounded p-2" />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Height (Points)</label>
                                  <input type="number" value={customHeight} onChange={(e) => setCustomHeight(Number(e.target.value))} className="w-full border rounded p-2" />
                              </div>
                              <p className="col-span-2 text-xs text-gray-400 mt-1">1 inch = 72 points. A4 is approx 595 x 842.</p>
                          </div>
                      )}
                  </div>
              </div>

              {!loading && !processedFile && (
                  <div className="text-center mt-8">
                      <Button onClick={handleResize} className="bg-blue-600 hover:bg-blue-700 px-12 py-4 text-lg shadow-lg">
                          Resize PDF
                      </Button>
                  </div>
              )}

              {loading && (
                  <div className="flex flex-col items-center justify-center h-40">
                      <LoadingSpinner message="Resizing pages and scaling content..." />
                  </div>
              )}

              {processedFile && (
                  <div className="mt-8 p-8 bg-green-50 border border-green-200 rounded-xl text-center animate-fade-in">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">Resizing Complete!</h3>
                      <p className="text-gray-600 mb-6">Your PDF pages have been resized.</p>
                      
                      <Button onClick={handleDownload} className="bg-green-600 hover:bg-green-700 px-10 py-3 text-lg shadow-md">
                          Download PDF
                      </Button>
                      <button onClick={() => { setProcessedFile(null); onUpload([]); }} className="block mx-auto mt-4 text-sm text-gray-500 hover:text-gray-700 underline">
                          Resize Another
                      </button>
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

export default PdfResizeTool;