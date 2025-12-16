
import React, { useState, useCallback, useEffect } from 'react';
import { AppFile, ProcessedFile } from '../../types';
import Dropzone from '../Dropzone';
import Button from '../Button';
import LoadingSpinner from '../LoadingSpinner';
import FilePreviewCard from '../FilePreviewCard';
import { pdfService } from '../../services/pdfService';
import { geminiService } from '../../services/geminiService';

interface PdfSplitToolProps {
  onUpload: (files: File[]) => void;
  uploadedFiles: AppFile[];
  onRemoveFile: (id: string) => void;
}

interface SplitRange {
  id: string;
  start: number;
  end: number;
  label: string;
  isAutoLabeled?: boolean;
}

const PdfSplitTool: React.FC<PdfSplitToolProps> = ({
  onUpload,
  uploadedFiles,
  onRemoveFile,
}) => {
  const [loading, setLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [pageCount, setPageCount] = useState<number>(0);
  const [ranges, setRanges] = useState<SplitRange[]>([]);
  const [pagePreviews, setPagePreviews] = useState<Record<number, string>>({});
  const [processedFile, setProcessedFile] = useState<ProcessedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeRangeInput, setActiveRangeInput] = useState<string>('');

  // Load PDF details when file is uploaded
  useEffect(() => {
    const loadPdfDetails = async () => {
      if (uploadedFiles.length === 1 && uploadedFiles[0].arrayBuffer) {
        try {
          const count = await pdfService.getPageCount(uploadedFiles[0]);
          setPageCount(count);
          // Initialize with one range covering the whole doc
          setRanges([{ id: crypto.randomUUID(), start: 1, end: count, label: 'Full Document' }]);
          
          // Generate previews for first few pages to show it's working
          // We won't generate ALL previews at once for massive PDFs to save memory
          generatePreviews(uploadedFiles[0], [1, 2, 3].filter(p => p <= count));
        } catch (e) {
          setError("Failed to load PDF structure.");
        }
      } else {
        setPageCount(0);
        setRanges([]);
        setPagePreviews({});
        setProcessedFile(null);
      }
    };
    loadPdfDetails();
  }, [uploadedFiles]);

  const generatePreviews = async (file: AppFile, pageNumbers: number[]) => {
    const newPreviews: Record<number, string> = {};
    for (const pageNum of pageNumbers) {
      if (!pagePreviews[pageNum]) {
        try {
          // 0-indexed for pdf.js rendering call inside service, but we pass 1-based index logic here?
          // pdfService.renderPage expects 0-based index
          const dataUrl = await pdfService.renderPage(file, pageNum - 1); 
          newPreviews[pageNum] = dataUrl;
        } catch (e) {
          console.error(`Error previewing page ${pageNum}`, e);
        }
      }
    }
    setPagePreviews(prev => ({ ...prev, ...newPreviews }));
  };

  const handleAddRange = () => {
    // Parse simple range "1-5" or "3"
    const input = activeRangeInput.trim();
    if (!input) return;

    let start = 0, end = 0;
    if (input.includes('-')) {
      const parts = input.split('-').map(p => parseInt(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        start = parts[0];
        end = parts[1];
      }
    } else {
      const page = parseInt(input);
      if (!isNaN(page)) {
        start = page;
        end = page;
      }
    }

    if (start > 0 && end >= start && end <= pageCount) {
      setRanges(prev => {
        // INTELLIGENT UX: If the list only contains the default "Full Document" range, 
        // remove it when the user adds their specific split. 
        // This prevents the common error of getting [FullDoc, Split1] instead of just [Split1].
        const isDefaultState = prev.length === 1 && prev[0].start === 1 && prev[0].end === pageCount && prev[0].label === 'Full Document';
        
        const newRange = { id: crypto.randomUUID(), start, end, label: `Split ${isDefaultState ? 1 : prev.length + 1}` };
        
        if (isDefaultState) {
            return [newRange];
        }
        return [...prev, newRange];
      });
      
      setActiveRangeInput('');
      // Generate preview for the start of this range
      if (uploadedFiles[0]) {
        generatePreviews(uploadedFiles[0], [start]);
      }
    } else {
      setError(`Invalid range. Please use format "1-5" or "3" within 1-${pageCount}.`);
    }
  };

  const handleRemoveRange = (id: string) => {
    setRanges(prev => prev.filter(r => r.id !== id));
  };

  const handleUpdateLabel = (id: string, newLabel: string) => {
    setRanges(prev => prev.map(r => r.id === id ? { ...r, label: newLabel } : r));
  };

  const handleAutoTag = async () => {
    if (ranges.length === 0) return;
    setLoading(true);
    setProcessingStatus("AI is analyzing first page of each range...");
    
    try {
      const newRanges = [...ranges];
      
      for (let i = 0; i < newRanges.length; i++) {
        const range = newRanges[i];
        // Get the first page of the range
        const pageIndex = range.start - 1;
        
        // We need the image of the page. Check if we have preview, else render it.
        let imageBase64 = pagePreviews[range.start];
        if (!imageBase64) {
           imageBase64 = await pdfService.renderPage(uploadedFiles[0], pageIndex);
           setPagePreviews(prev => ({ ...prev, [range.start]: imageBase64 }));
        }

        const suggestedLabel = await geminiService.identifyDocumentType(imageBase64);
        newRanges[i] = { ...newRanges[i], label: suggestedLabel, isAutoLabeled: true };
      }
      setRanges(newRanges);
    } catch (e) {
      console.error(e);
      setError("AI Auto-Tagging failed. Please check your API key.");
    } finally {
      setLoading(false);
      setProcessingStatus("");
    }
  };

  const handleSplit = async () => {
    if (ranges.length === 0) {
      setError("Please define at least one range to split.");
      return;
    }
    setLoading(true);
    setProcessingStatus("Splitting document...");
    setProcessedFile(null);
    setError(null);

    try {
      const result = await pdfService.splitPdf(uploadedFiles[0], ranges);
      setProcessedFile(result);
    } catch (e) {
      setError(`Split failed: ${(e as Error).message}`);
    } finally {
      setLoading(false);
      setProcessingStatus("");
    }
  };

  const handleDownload = () => {
    if (processedFile) {
      const link = document.createElement('a');
      link.href = processedFile.dataUrl;
      link.download = processedFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const acceptedFileTypes = ['application/pdf'];

  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Split PDF</h2>
      <p className="text-gray-600 mb-6">
        Separate one PDF into multiple files. Specify ranges (e.g. 1-5, 6-10) and use AI to automatically name your files based on their content.
      </p>

      <Dropzone
        onFilesSelected={onUpload}
        acceptedFileTypes={acceptedFileTypes}
        multiple={false}
        label="Drag & drop your PDF here"
      />

      {uploadedFiles.length > 0 && pageCount > 0 && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Settings */}
          <div className="lg:col-span-1 space-y-6">
             <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-2">Add Range</h3>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. 1-3 or 1"
                    value={activeRangeInput}
                    onChange={(e) => setActiveRangeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddRange()}
                  />
                  <Button size="sm" onClick={handleAddRange}>Add</Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Total Pages: {pageCount}. (Type "1" for just page 1)</p>
             </div>

             <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-blue-900">Split Ranges</h3>
                  <Button variant="outline" size="sm" onClick={handleAutoTag} disabled={loading || ranges.length === 0} title="Use AI to guess content type">
                    ✨ AI Tag
                  </Button>
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {ranges.map((range, idx) => (
                    <div key={range.id} className="bg-white p-3 rounded shadow-sm border border-gray-200 relative group">
                      <div className="flex justify-between items-start">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Pages {range.start}-{range.end}
                        </span>
                        <button 
                          onClick={() => handleRemoveRange(range.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                      <div className="mt-2">
                        <label className="text-xs text-gray-500 block mb-1">Filename Label</label>
                        <input 
                          type="text" 
                          value={range.label}
                          onChange={(e) => handleUpdateLabel(range.id, e.target.value)}
                          className={`w-full text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none pb-1 ${range.isAutoLabeled ? 'text-blue-700 font-medium' : 'text-gray-700'}`}
                        />
                      </div>
                    </div>
                  ))}
                  {ranges.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No ranges added yet.</p>}
                </div>
             </div>

             <Button 
                className="w-full" 
                onClick={handleSplit} 
                disabled={ranges.length === 0 || loading}
                loading={loading && !processingStatus.includes("AI")}
              >
               {ranges.length > 1 ? 'Split & Download ZIP' : 'Split & Download PDF'}
             </Button>
          </div>

          {/* Right Column: Visualization */}
          <div className="lg:col-span-2">
            <h3 className="font-semibold text-gray-800 mb-4">Document Preview</h3>
            <div className="bg-gray-100 p-4 rounded-lg border-dashed border-2 border-gray-300 min-h-[400px]">
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                 {ranges.map((range) => (
                   <div key={`preview-${range.id}`} className="flex flex-col items-center">
                      <div className="relative w-full aspect-[1/1.4] bg-white shadow-md rounded-sm overflow-hidden mb-2 group">
                        {pagePreviews[range.start] ? (
                          <img src={pagePreviews[range.start]} alt={`Page ${range.start}`} className="w-full h-full object-contain" />
                        ) : (
                           <div className="flex items-center justify-center h-full text-gray-300">
                             <span className="text-xs">Page {range.start}</span>
                           </div>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all pointer-events-none" />
                        <span className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-[10px] px-1.5 py-0.5 rounded">
                          Pg {range.start}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-700 truncate w-full text-center" title={range.label}>{range.label}</p>
                      <p className="text-xs text-gray-500">{range.end - range.start + 1} page(s)</p>
                   </div>
                 ))}
                 {ranges.length === 0 && (
                   <div className="col-span-full flex flex-col items-center justify-center h-64 text-gray-400">
                      <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <p>Add split ranges to see previews</p>
                   </div>
                 )}
               </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      {loading && processingStatus && (
         <div className="mt-4">
            <LoadingSpinner message={processingStatus} />
         </div>
      )}

      {processedFile && (
        <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg text-center animate-fade-in">
          <h3 className="text-xl font-semibold text-green-800 mb-2">Processing Complete!</h3>
          <p className="text-green-700 mb-4">
            {processedFile.mimeType === 'application/zip' ? 'Your separated PDF files are ready in a ZIP archive.' : 'Your split PDF is ready.'}
          </p>
          <Button onClick={handleDownload} variant="primary" className="bg-green-600 hover:bg-green-700">
            Download {processedFile.mimeType === 'application/zip' ? 'ZIP' : 'PDF'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PdfSplitTool;
