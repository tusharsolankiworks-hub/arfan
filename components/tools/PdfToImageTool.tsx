import React, { useState, useCallback } from 'react';
import { AppFile, ProcessedFile } from '../../types';
import Dropzone from '../Dropzone';
import Button from '../Button';
import LoadingSpinner from '../LoadingSpinner';
import FilePreviewCard from '../FilePreviewCard';
import { pdfService } from '../../services/pdfService';
import { arrayBufferToFile } from '../../utils/fileUtils';

interface PdfToImageToolProps {
  onUpload: (files: File[]) => void;
  uploadedFiles: AppFile[];
  onRemoveFile: (id: string) => void;
}

const PdfToImageTool: React.FC<PdfToImageToolProps> = ({
  onUpload,
  uploadedFiles,
  onRemoveFile,
}) => {
  const [loading, setLoading] = useState(false);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleConvertToImages = useCallback(async () => {
    setError(null);
    setProcessedFiles([]);
    if (uploadedFiles.length === 0) {
      setError('Please upload a PDF file to convert to images.');
      return;
    }
    if (uploadedFiles.length > 1) {
      setError('Please upload only one PDF file for conversion.');
      return;
    }
    const pdfFile = uploadedFiles[0];
    if (pdfFile.type !== 'application/pdf') {
      setError('Only PDF files can be converted to images.');
      return;
    }
    if (!pdfFile.arrayBuffer) {
      setError('File content not loaded yet. Please wait for the file to finish processing or try re-uploading.');
      return;
    }

    setLoading(true);
    try {
      const results = await pdfService.pdfToImages(pdfFile);
      setProcessedFiles(results);
    } catch (e) {
      console.error(e);
      setError(`Failed to convert PDF to images: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [uploadedFiles]);

  const handleDownloadAll = useCallback(() => {
    if (processedFiles.length > 0) {
      processedFiles.forEach((file) => {
        const link = document.createElement('a');
        link.href = file.dataUrl;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }
  }, [processedFiles]);

  const acceptedFileTypes = ['application/pdf'];

  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">PDF to JPG</h2>
      <p className="text-gray-600 mb-6">
        Convert each page of your PDF document into separate JPG image files.
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
        <Button onClick={handleConvertToImages} disabled={uploadedFiles.length === 0 || loading} loading={loading}>
          Convert to JPG
        </Button>
      </div>

      {loading && <LoadingSpinner message="Converting PDF to images. This may take a moment for large PDFs..." />}

      {processedFiles.length > 0 && (
        <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-inner text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Images Created!</h3>
          <p className="text-gray-700 mb-4">
            {processedFiles.length} images have been generated from your PDF.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6 max-h-60 overflow-y-auto p-2 border border-gray-300 rounded-md">
            {processedFiles.map((img) => (
              <div key={img.id} className="flex flex-col items-center">
                <img src={img.dataUrl} alt={img.name} className="w-24 h-24 object-cover rounded-md shadow-sm border border-gray-100" />
                <p className="text-xs text-gray-600 mt-1 truncate w-24">{img.name}</p>
              </div>
            ))}
          </div>
          <Button onClick={handleDownloadAll} variant="primary">
            Download All Images
          </Button>
        </div>
      )}
    </div>
  );
};

export default PdfToImageTool;