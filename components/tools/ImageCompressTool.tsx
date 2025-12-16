import React, { useState, useCallback } from 'react';
import { AppFile, ProcessedFile } from '../../types';
import Dropzone from '../Dropzone';
import Button from '../Button';
import LoadingSpinner from '../LoadingSpinner';
import FilePreviewCard from '../FilePreviewCard';
import { imageService } from '../../services/imageService';
import { arrayBufferToFile } from '../../utils/fileUtils';

interface ImageCompressToolProps {
  onUpload: (files: File[]) => void;
  uploadedFiles: AppFile[];
  onRemoveFile: (id: string) => void;
}

const ImageCompressTool: React.FC<ImageCompressToolProps> = ({
  onUpload,
  uploadedFiles,
  onRemoveFile,
}) => {
  const [loading, setLoading] = useState(false);
  const [processedFile, setProcessedFile] = useState<ProcessedFile | null>(null);
  const [compressionStrength, setCompressionStrength] = useState(75); // Higher value = more compression
  const [error, setError] = useState<string | null>(null);

  const handleCompress = useCallback(async () => {
    setError(null);
    setProcessedFile(null);
    if (uploadedFiles.length === 0) {
      setError('Please upload an image file to compress.');
      return;
    }
    if (uploadedFiles.length > 1) {
      setError('Please upload only one image file for compression.');
      return;
    }
    const imageFile = uploadedFiles[0];
    if (!imageFile.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, WebP) for compression.');
      return;
    }
    if (!imageFile.arrayBuffer) {
      setError('File content not loaded yet. Please wait for the file to finish processing or try re-uploading.');
      return;
    }

    setLoading(true);
    try {
      const result = await imageService.compressImage(imageFile, compressionStrength);
      setProcessedFile(result);
    } catch (e) {
      console.error(e);
      setError(`Failed to compress image: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [uploadedFiles, compressionStrength]);

  const handleDownload = useCallback(() => {
    if (processedFile) {
      // Create a Blob from the data URL and then a temporary URL
      const link = document.createElement('a');
      link.href = processedFile.dataUrl;
      link.download = processedFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // No need to revokeObjectURL if using data URL directly
    }
  }, [processedFile]);

  const acceptedFileTypes = ['image/jpeg', 'image/png', 'image/webp'];

  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Compress Image</h2>
      <p className="text-gray-600 mb-6">
        Reduce the file size of your JPG or PNG images. Adjust the compression strength to find the perfect balance between size and quality.
      </p>

      <Dropzone
        onFilesSelected={onUpload}
        acceptedFileTypes={acceptedFileTypes}
        multiple={false}
        label="Drag & drop your image here, or click to select"
      />

      {uploadedFiles.length > 0 && (
        <div className="mt-6 border-t pt-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Uploaded Image</h3>
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
              aria-label="Image Compression Strength Slider"
            />
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
          Compress Image
        </Button>
      </div>

      {loading && <LoadingSpinner message="Compressing image..." />}

      {processedFile && (
        <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-inner text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Compressed Image</h3>
          <img src={processedFile.dataUrl} alt={processedFile.name} className="max-w-full h-auto mx-auto mb-4 rounded-md shadow-sm border border-gray-100" style={{ maxHeight: '200px' }} />
          <p className="text-gray-700 mb-4">
            File: {processedFile.name} <br />
            Size: {(processedFile.size / 1024).toFixed(2)} KB
          </p>
          <Button onClick={handleDownload} variant="primary">
            Download Compressed Image
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImageCompressTool;