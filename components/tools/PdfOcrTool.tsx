import React, { useState, useCallback } from 'react';
import { AppFile, ProcessedFile } from '../../types';
import Dropzone from '../Dropzone';
import Button from '../Button';
import LoadingSpinner from '../LoadingSpinner';
import FilePreviewCard from '../FilePreviewCard';
import { geminiService } from '../../services/geminiService';
import { pdfToWordService } from '../../services/pdfToWordService';

interface PdfOcrToolProps {
  onUpload: (files: File[]) => void;
  uploadedFiles: AppFile[];
  onRemoveFile: (id: string) => void;
}

type OcrMode = 'extract_text' | 'searchable_pdf';

const PdfOcrTool: React.FC<PdfOcrToolProps> = ({
  onUpload,
  uploadedFiles,
  onRemoveFile,
}) => {
  const [mode, setMode] = useState<OcrMode>('extract_text');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Results
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [searchablePdf, setSearchablePdf] = useState<ProcessedFile | null>(null);
  
  const [error, setError] = useState<string | null>(null);

  const handlePerformOcr = useCallback(async () => {
    setError(null);
    setOcrText(null);
    setSearchablePdf(null);
    setProgress(0);

    if (uploadedFiles.length === 0) {
      setError('Please upload a PDF file to perform OCR.');
      return;
    }
    const pdfFile = uploadedFiles[0];
    if (pdfFile.type !== 'application/pdf') {
      setError('Only PDF files are supported for OCR.');
      return;
    }
    if (!pdfFile.arrayBuffer) {
      setError('File content not loaded yet. Please wait or re-upload.');
      return;
    }

    setLoading(true);
    
    try {
      if (mode === 'extract_text') {
          // Use Gemini for high quality text extraction
          const result = await geminiService.ocrPdf(pdfFile.arrayBuffer);
          setOcrText(result);
      } else {
          // Use Tesseract for Searchable PDF (Client-side)
          const result = await pdfToWordService.generateSearchablePdf(pdfFile, (p) => setProgress(p));
          setSearchablePdf(result);
      }
    } catch (e) {
      let errorMessage = (e as Error).message;
      if (errorMessage.includes("API_KEY is not set")) {
        errorMessage = "API key not found. Please ensure your Google Gemini API key is configured in the AI Studio sidebar.";
      }
      console.error(e);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [uploadedFiles, mode]);

  const handleDownloadText = useCallback(() => {
    if (ocrText) {
      const blob = new Blob([ocrText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${uploadedFiles[0].name.replace('.pdf', '')}_ocr.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }, [ocrText, uploadedFiles]);

  const handleDownloadPdf = useCallback(() => {
      if (searchablePdf) {
          const link = document.createElement('a');
          link.href = searchablePdf.dataUrl;
          link.download = searchablePdf.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }
  }, [searchablePdf]);

  const acceptedFileTypes = ['application/pdf'];

  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">PDF OCR (Text Recognition)</h2>
      <p className="text-gray-600 mb-6">
        Turn scanned documents into editable text or searchable PDFs.
      </p>

      <Dropzone
        onFilesSelected={onUpload}
        acceptedFileTypes={acceptedFileTypes}
        multiple={false}
        label="Drag & drop your scanned PDF here"
      />

      {uploadedFiles.length > 0 && (
        <div className="mt-6 border-t pt-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Uploaded PDF</h3>
          <div className="mb-6">
            <FilePreviewCard file={uploadedFiles[0]} onRemove={onRemoveFile} />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
              <h4 className="font-bold text-gray-700 text-sm mb-3 uppercase">Select Output Mode</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={() => setMode('extract_text')}
                    className={`flex flex-col items-center p-4 border-2 rounded-lg transition-all ${mode === 'extract_text' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300 bg-white'}`}
                  >
                      <span className="text-lg font-bold mb-1">Extract Text (TXT)</span>
                      <span className="text-xs text-center opacity-80">Best for copying content. Uses Gemini AI for high accuracy.</span>
                  </button>
                  <button 
                    onClick={() => setMode('searchable_pdf')}
                    className={`flex flex-col items-center p-4 border-2 rounded-lg transition-all ${mode === 'searchable_pdf' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300 bg-white'}`}
                  >
                      <span className="text-lg font-bold mb-1">Searchable PDF</span>
                      <span className="text-xs text-center opacity-80">Overlays text on original images. Runs 100% Client-Side.</span>
                  </button>
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

      <div className="mt-6 flex justify-center">
        <Button onClick={handlePerformOcr} disabled={uploadedFiles.length === 0 || loading} loading={loading} className="w-full md:w-auto px-8">
          {mode === 'extract_text' ? 'Extract Text' : 'Start OCR Process'}
        </Button>
      </div>

      {loading && (
          <div className="mt-6 flex flex-col items-center">
              <LoadingSpinner message={mode === 'extract_text' ? "AI is analyzing document..." : `Processing page... ${progress}%`} />
              {mode === 'searchable_pdf' && (
                  <div className="w-64 h-2 bg-gray-200 rounded-full mt-3 overflow-hidden">
                      <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                  </div>
              )}
          </div>
      )}

      {/* Result: Text */}
      {ocrText && mode === 'extract_text' && (
        <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-inner animate-fade-in">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Extracted Text Result</h3>
          <textarea
            className="w-full h-80 p-4 bg-white border border-gray-300 rounded-md font-mono text-sm text-gray-800 resize-y"
            readOnly
            value={ocrText}
          ></textarea>
          <div className="flex justify-center mt-4">
            <Button onClick={handleDownloadText} variant="secondary">
              Download .TXT
            </Button>
          </div>
        </div>
      )}

      {/* Result: PDF */}
      {searchablePdf && mode === 'searchable_pdf' && (
          <div className="mt-8 p-8 bg-green-50 border border-green-200 rounded-xl text-center animate-fade-in">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Success!</h3>
              <p className="text-gray-600 mb-6">Your PDF is now searchable.</p>
              
              <Button onClick={handleDownloadPdf} className="bg-green-600 hover:bg-green-700 px-10 py-3 text-lg shadow-md">
                  Download Searchable PDF
              </Button>
          </div>
      )}
    </div>
  );
};

export default PdfOcrTool;