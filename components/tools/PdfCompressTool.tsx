import React, { useState, useCallback } from 'react';
import { AppFile, ProcessedFile } from '../../types';
import Dropzone from '../Dropzone';
import Button from '../Button';
import LoadingSpinner from '../LoadingSpinner';
import FilePreviewCard from '../FilePreviewCard';
import { pdfService } from '../../services/pdfService';
import { arrayBufferToFile } from '../../utils/fileUtils';

interface PdfCompressToolProps {
  onUpload: (files: File[]) => void;
  uploadedFiles: AppFile[];
  onRemoveFile: (id: string) => void;
}

const PdfCompressTool: React.FC<PdfCompressToolProps> = ({
  onUpload,
  uploadedFiles,
  onRemoveFile,
}) => {
  const [loading, setLoading] = useState(false);
  const [processedFile, setProcessedFile] = useState<ProcessedFile | null>(null);
  const [compressionStrength, setCompressionStrength] = useState(75); // Renamed from 'quality' for better semantic
  const [error, setError] = useState<string | null>(null);

  const handleCompress = useCallback(async () => {
    setError(null);
    setProcessedFile(null);
    if (uploadedFiles.length === 0) {
      setError('Please upload a PDF file to compress.');
      return;
    }
    if (uploadedFiles.length > 1) {
      setError('Please upload only one PDF file for compression.');
      return;
    }
    const pdfFile = uploadedFiles[0];
    if (pdfFile.type !== 'application/pdf') {
      setError('Only PDF files can be compressed.');
      return;
    }
    if (!pdfFile.arrayBuffer) {
      setError('File content not loaded yet. Please wait for the file to finish processing or try re-uploading.');
      return;
    }

    setLoading(true);
    try {
      const result = await pdfService.compressPdf(pdfFile, compressionStrength); 
      setProcessedFile(result);
    } catch (e) {
      console.error(e);
      setError(`Failed to compress PDF: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [uploadedFiles, compressionStrength]);

  const handleDownload = useCallback(() => {
    if (processedFile) {
      const link = document.createElement('a');
      link.href = processedFile.dataUrl;
      link.download = processedFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [processedFile]);

  const acceptedFileTypes = ['application/pdf'];

  const originalFileSize = uploadedFiles.length > 0 ? uploadedFiles[0].size : 0;
  
  // Model estimated compressed size based on compression strength.
  // Use a non-linear curve for a more realistic estimate, as compression
  // benefits are often more pronounced at mid-to-high strengths.
  const MIN_OUTPUT_RATIO = 0.05; // Smallest possible output size (e.g., 5% of original at 100% compression)
  const MAX_OUTPUT_RATIO = 0.95; // Largest possible output size (e.g., 95% of original at 0% compression)
  
  const strengthRatio = compressionStrength / 100;
  const power = 2; // Use a power of 2 for an exponential curve
  
  const estimatedSizeRatio = 
    MIN_OUTPUT_RATIO + (MAX_OUTPUT_RATIO - MIN_OUTPUT_RATIO) * Math.pow(1 - strengthRatio, power);
  
  const estimatedCompressedSize = originalFileSize * estimatedSizeRatio;

  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Compress PDF</h2>
      <p className="text-gray-600 mb-6">
        Reduce the file size of your PDF documents by re-encoding pages as compressed images.
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
          <div className="mt-4">
            <label htmlFor="compressionStrength" className="block text-sm font-medium text-gray-700 mb-2">
              Compression Strength: <span className="font-semibold text-blue-600">{compressionStrength}%</span>
            </label>
            <input
              type="range"
              id="compressionStrength"
              min="0"
              max="100"
              step="1"
              value={compressionStrength}
              onChange={(e) => setCompressionStrength(Number(e.target.value))}
              className="w-full h-4 bg-blue-600 rounded-lg appearance-none cursor-pointer range-lg [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:appearance-none"
              disabled={loading}
              aria-valuenow={compressionStrength}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Compression Strength Slider"
            />
             <p className="text-xs text-gray-500 mt-1">
              (Note: This process converts each page into a compressed image, which significantly reduces file size for image-heavy PDFs. This will rasterize text, making it non-selectable.)
            </p>
            {originalFileSize > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                Original Size: {(originalFileSize / 1024).toFixed(2)} KB <br />
                <span className="font-medium text-blue-700">Rough Estimated Size: {(estimatedCompressedSize / 1024).toFixed(2)} KB</span>
              </p>
            )}
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
        <Button onClick={handleCompress} disabled={uploadedFiles.length === 0 || loading} loading={loading}>
          Compress PDF
        </Button>
      </div>

      {loading && <LoadingSpinner message="Compressing PDF. This may take a moment for large documents..." />}

      {processedFile && (
        <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-inner text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Compressed PDF</h3>
          <p className="text-gray-700 mb-4">
            File: {processedFile.name} <br />
            Original Size: {(uploadedFiles[0].size / 1024).toFixed(2)} KB <br />
            Compressed Size: {(processedFile.size / 1024).toFixed(2)} KB
          </p>
          <Button onClick={handleDownload} variant="primary">
            Download Compressed PDF
          </Button>
        </div>
      )}
    </div>
  );
};

export default PdfCompressTool;