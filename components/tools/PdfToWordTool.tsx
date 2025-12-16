import React, { useState, useCallback } from 'react';
import { AppFile, ProcessedFile } from '../../types';
import Dropzone from '../Dropzone';
import Button from '../Button';
import LoadingSpinner from '../LoadingSpinner';
import FilePreviewCard from '../FilePreviewCard';
import { pdfToWordService, WordStructureItem } from '../../services/pdfToWordService';
import { geminiService } from '../../services/geminiService';

interface PdfToWordToolProps {
  onUpload: (files: File[]) => void;
  uploadedFiles: AppFile[];
  onRemoveFile: (id: string) => void;
}

const PdfToWordTool: React.FC<PdfToWordToolProps> = ({
  onUpload,
  uploadedFiles,
  onRemoveFile,
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [structuredData, setStructuredData] = useState<WordStructureItem[] | null>(null);
  const [processedFile, setProcessedFile] = useState<ProcessedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useOcr, setUseOcr] = useState(false);

  const handleExtractText = useCallback(async () => {
    if (uploadedFiles.length === 0) return;
    setLoading(true);
    setError(null);
    setExtractedText(null);
    setStructuredData(null);
    setProcessedFile(null);

    try {
      let text = "";
      if (useOcr) {
        setLoadingMessage('Extracting text using OCR (this may take a while)...');
        text = await pdfToWordService.extractTextWithOcr(uploadedFiles[0]);
      } else {
        setLoadingMessage('Extracting text from PDF...');
        text = await pdfToWordService.extractText(uploadedFiles[0]);
      }

      if (!text || text.trim().length === 0) {
        throw new Error("No text found. Try enabling OCR for scanned documents.");
      }
      setExtractedText(text);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [uploadedFiles, useOcr]);

  const handleAiReformat = async () => {
    if (!extractedText) return;
    setLoading(true);
    setLoadingMessage('AI is analyzing and reformatting structure...');
    try {
      const jsonStr = await geminiService.reformatTextForWord(extractedText);
      const parsedData = JSON.parse(jsonStr) as WordStructureItem[];
      setStructuredData(parsedData);
    } catch (e) {
      setError(`AI Reformat failed: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDocx = async () => {
    setLoading(true);
    setLoadingMessage('Generating Word document...');
    try {
      // Use structured data if available, otherwise raw text
      const data = structuredData || extractedText || "";
      const result = await pdfToWordService.generateDocx(data, uploadedFiles[0].name);
      setProcessedFile(result);
    } catch (e) {
      setError(`Generation failed: ${(e as Error).message}`);
    } finally {
      setLoading(false);
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
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">PDF to Word Converter</h2>
      <p className="text-gray-600 mb-6">
        Convert your PDF to an editable Word (.docx) document. Use OCR for scanned files and AI to restructure formatting.
      </p>

      <Dropzone
        onFilesSelected={onUpload}
        acceptedFileTypes={acceptedFileTypes}
        multiple={false}
        label="Drag & drop PDF here"
      />

      {uploadedFiles.length > 0 && (
        <div className="mt-6 border-t pt-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Uploaded File</h3>
          <div className="mb-4">
              <FilePreviewCard file={uploadedFiles[0]} onRemove={onRemoveFile} />
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-md border border-gray-200">
             <div className="flex items-center">
                <input 
                  id="ocr-checkbox" 
                  type="checkbox" 
                  checked={useOcr} 
                  onChange={(e) => setUseOcr(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={loading || !!extractedText}
                />
                <label htmlFor="ocr-checkbox" className="ml-2 block text-sm text-gray-900">
                  Enable OCR (for scanned docs)
                </label>
             </div>
             {!extractedText && (
                <Button onClick={handleExtractText} disabled={loading} size="sm">
                  Extract Text
                </Button>
             )}
          </div>

          {/* Extracted Content Preview & AI Actions */}
          {extractedText && (
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                 <h3 className="font-semibold text-gray-700">Extracted Content</h3>
                 <div className="space-x-2">
                    {!structuredData && (
                      <Button variant="secondary" size="sm" onClick={handleAiReformat} disabled={loading}>
                        ✨ AI Reformat Structure
                      </Button>
                    )}
                    <Button variant="primary" size="sm" onClick={handleGenerateDocx} disabled={loading}>
                       Generate Word Doc
                    </Button>
                 </div>
               </div>
               
               <div className="bg-white border border-gray-300 rounded-md p-4 max-h-64 overflow-y-auto">
                 {structuredData ? (
                    <div className="space-y-2">
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-2 mb-2 text-xs text-blue-700">
                        AI Structured Preview: Showing logical sections (Titles, Headings, etc.)
                      </div>
                      {structuredData.map((item, idx) => (
                        <div key={idx} className={`
                          ${item.type === 'title' ? 'text-2xl font-bold text-center' : ''}
                          ${item.type === 'heading1' ? 'text-xl font-bold mt-4' : ''}
                          ${item.type === 'heading2' ? 'text-lg font-semibold mt-2' : ''}
                          ${item.type === 'bullet' ? 'ml-4 list-disc list-item' : ''}
                          ${item.type === 'paragraph' ? 'text-base text-gray-700' : ''}
                        `}>
                          {item.content}
                        </div>
                      ))}
                    </div>
                 ) : (
                    <pre className="whitespace-pre-wrap text-sm text-gray-600 font-mono">{extractedText.substring(0, 2000)}...</pre>
                 )}
               </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {loading && <LoadingSpinner message={loadingMessage || "Processing..."} />}

      {processedFile && (
        <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-inner text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Word Document Ready!</h3>
          <p className="text-gray-700 mb-4">
            Your file has been converted and formatted.
          </p>
          <Button onClick={handleDownload} variant="primary">
            Download .DOCX
          </Button>
        </div>
      )}
    </div>
  );
};

export default PdfToWordTool;