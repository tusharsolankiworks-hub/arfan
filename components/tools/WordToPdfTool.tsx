import React, { useState, useCallback, useEffect } from 'react';
import { AppFile, ProcessedFile } from '../../types';
import Dropzone from '../Dropzone';
import Button from '../Button';
import LoadingSpinner from '../LoadingSpinner';
import FilePreviewCard from '../FilePreviewCard';
import { wordService } from '../../services/wordService';
import { geminiService } from '../../services/geminiService';

interface WordToPdfToolProps {
  onUpload: (files: File[]) => void;
  uploadedFiles: AppFile[];
  onRemoveFile: (id: string) => void;
}

const WordToPdfTool: React.FC<WordToPdfToolProps> = ({
  onUpload,
  uploadedFiles,
  onRemoveFile,
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [processedFile, setProcessedFile] = useState<ProcessedFile | null>(null);
  const [htmlPreview, setHtmlPreview] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isProofreading, setIsProofreading] = useState(false);
  const [proofreadText, setProofreadText] = useState<string | null>(null);

  // Parse DOCX when uploaded
  useEffect(() => {
    const parseDoc = async () => {
      if (uploadedFiles.length === 1 && uploadedFiles[0].arrayBuffer) {
        try {
          setLoading(true);
          setLoadingMessage('Generating preview...');
          const html = await wordService.convertToHtml(uploadedFiles[0]);
          const text = await wordService.extractText(uploadedFiles[0]);
          setHtmlPreview(html);
          setRawText(text);
          setProofreadText(null);
        } catch (e) {
          setError("Failed to parse Word document.");
        } finally {
          setLoading(false);
        }
      } else {
        setHtmlPreview(null);
        setRawText('');
        setProcessedFile(null);
      }
    };
    parseDoc();
  }, [uploadedFiles]);

  const handleProofread = async () => {
    if (!rawText) return;
    
    setLoading(true);
    setIsProofreading(true);
    setLoadingMessage('AI is proofreading your document...');
    setError(null);

    try {
      // Limit text length for demo purposes if needed, but Gemini handles large contexts well.
      const corrected = await geminiService.proofreadText(rawText);
      setProofreadText(corrected);
    } catch (e) {
      setError(`AI Proofreading failed: ${(e as Error).message}`);
    } finally {
      setLoading(false);
      setIsProofreading(false);
    }
  };

  const handleConvert = async () => {
    setLoading(true);
    setLoadingMessage('Creating PDF...');
    setError(null);
    setProcessedFile(null);

    try {
      // If user has proofread text, use that. Otherwise use original raw text.
      const textToConvert = proofreadText || rawText;
      const result = await wordService.createPdfFromText(textToConvert);
      setProcessedFile(result);
    } catch (e) {
      setError(`Conversion failed: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (processedFile) {
      const link = document.createElement('a');
      link.href = processedFile.dataUrl;
      link.download = `${uploadedFiles[0].name.replace('.docx', '')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleUseOriginal = () => {
    setProofreadText(null);
  };

  const acceptedFileTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Word to PDF Converter</h2>
      <p className="text-gray-600 mb-6">
        Convert your Microsoft Word (.docx) documents to PDF. Use AI to proofread and fix grammar before converting.
      </p>

      <Dropzone
        onFilesSelected={onUpload}
        acceptedFileTypes={acceptedFileTypes}
        multiple={false}
        label="Drag & drop .docx file here"
      />

      {uploadedFiles.length > 0 && (
        <div className="mt-6 border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Document Preview</h3>
            <div className="flex space-x-2">
              {proofreadText ? (
                 <Button size="sm" variant="outline" onClick={handleUseOriginal}>Revert to Original</Button>
              ) : (
                <Button size="sm" variant="secondary" onClick={handleProofread} disabled={loading} title="Check grammar and spelling">
                  ✨ AI Proofread
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-6">
            {uploadedFiles.map((file) => (
              <FilePreviewCard key={file.id} file={file} onRemove={onRemoveFile} />
            ))}
          </div>

          {/* Preview Area */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto shadow-inner">
             {proofreadText ? (
               <div className="prose max-w-none">
                 <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-green-700">
                          AI Proofreading applied. The text below is the corrected version that will be converted to PDF.
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap text-gray-800 font-serif leading-relaxed">{proofreadText}</p>
               </div>
             ) : htmlPreview ? (
               <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: htmlPreview }} />
             ) : (
               <div className="text-center text-gray-400 py-8">Loading preview...</div>
             )}
          </div>
          
           {proofreadText && (
             <p className="text-xs text-gray-500 mt-2 text-center">
               Note: PDF conversion regenerates the document layout. Complex formatting (tables, images) from the Word doc might not be preserved perfectly.
             </p>
           )}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}

      <div className="mt-6 flex justify-center">
        <Button onClick={handleConvert} disabled={uploadedFiles.length === 0 || loading} loading={loading}>
          Convert to PDF
        </Button>
      </div>

      {loading && <LoadingSpinner message={loadingMessage || "Processing..."} />}

      {processedFile && (
        <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-inner text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">PDF Ready!</h3>
          <p className="text-gray-700 mb-4">
            Your document has been converted successfully.
          </p>
          <Button onClick={handleDownload} variant="primary">
            Download PDF
          </Button>
        </div>
      )}
    </div>
  );
};

export default WordToPdfTool;