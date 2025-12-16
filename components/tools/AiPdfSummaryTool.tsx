import React, { useState, useCallback } from 'react';
import { AppFile, ProcessedFile } from '../../types';
import Dropzone from '../Dropzone';
import Button from '../Button';
import LoadingSpinner from '../LoadingSpinner';
import FilePreviewCard from '../FilePreviewCard';
import { geminiService } from '../../services/geminiService';
import { arrayBufferToFile } from '../../utils/fileUtils';

interface AiPdfSummaryToolProps {
  onUpload: (files: File[]) => void;
  uploadedFiles: AppFile[];
  onRemoveFile: (id: string) => void;
}

const AiPdfSummaryTool: React.FC<AiPdfSummaryToolProps> = ({
  onUpload,
  uploadedFiles,
  onRemoveFile,
}) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSummarize = useCallback(async () => {
    setError(null);
    setSummary(null);
    if (uploadedFiles.length === 0) {
      setError('Please upload a PDF file to summarize.');
      return;
    }
    if (uploadedFiles.length > 1) {
      setError('Please upload only one PDF file for summarization.');
      return;
    }
    const pdfFile = uploadedFiles[0];
    if (pdfFile.type !== 'application/pdf') {
      setError('Only PDF files can be summarized.');
      return;
    }
    if (!pdfFile.arrayBuffer) {
      setError('File content not loaded yet. Please wait for the file to finish processing or try re-uploading.');
      return;
    }

    setLoading(true);
    try {
      const result = await geminiService.summarizePdf(pdfFile.arrayBuffer);
      setSummary(result);
    } catch (e) {
      let errorMessage = (e as Error).message;
      if (errorMessage.includes("API_KEY is not set")) {
        errorMessage = "API key not found. Please ensure your Google Gemini API key is configured in the AI Studio sidebar.";
      } else if (errorMessage.includes("Failed to summarize PDF")) {
        errorMessage = `Failed to summarize PDF. This might be due to an issue with the API or the document content. Detailed error: ${errorMessage}`;
      }
      console.error(e);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [uploadedFiles]);

  const handleDownloadSummary = useCallback(() => {
    if (summary) {
      const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${uploadedFiles[0].name.replace('.pdf', '')}_summary.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }, [summary, uploadedFiles]);

  const acceptedFileTypes = ['application/pdf'];

  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">AI PDF Summary</h2>
      <p className="text-gray-600 mb-6">
        Upload a PDF document to generate an AI-powered summary of its content.
      </p>

      <Dropzone
        onFilesSelected={onUpload}
        acceptedFileTypes={acceptedFileTypes}
        multiple={false}
        label="Drag & drop your PDF here, or click to select"
      />

      {uploadedFiles.length > 0 && (
        <div className="mt-6 border-t pt-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Uploaded PDF</h3>
          <div className="grid grid-cols-1 gap-4">
            {uploadedFiles.map((file) => (
              <FilePreviewCard key={file.id} file={file} onRemove={onRemoveFile} />
            ))}
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
        <Button onClick={handleSummarize} disabled={uploadedFiles.length === 0 || loading} loading={loading}>
          Generate Summary
        </Button>
      </div>

      {loading && <LoadingSpinner message="Generating summary, please wait..." />}

      {summary && (
        <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-inner">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Summary Result</h3>
          <div className="prose max-w-none text-gray-700 leading-relaxed mb-6">
            <p className="whitespace-pre-wrap">{summary}</p>
          </div>
          <div className="flex justify-center">
            <Button onClick={handleDownloadSummary} variant="secondary">
              Download Summary (.txt)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiPdfSummaryTool;