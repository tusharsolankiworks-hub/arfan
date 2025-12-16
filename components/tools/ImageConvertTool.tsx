import React, { useState, useCallback } from 'react';
import { AppFile, ProcessedFile } from '../../types';
import Dropzone from '../Dropzone';
import Button from '../Button';
import LoadingSpinner from '../LoadingSpinner';
import FilePreviewCard from '../FilePreviewCard';
import { imageService } from '../../services/imageService';

interface ImageConvertToolProps {
  onUpload: (files: File[]) => void;
  uploadedFiles: AppFile[];
  onRemoveFile: (id: string) => void;
}

const ImageConvertTool: React.FC<ImageConvertToolProps> = ({
  onUpload,
  uploadedFiles,
  onRemoveFile,
}) => {
  const [loading, setLoading] = useState(false);
  const [processedFile, setProcessedFile] = useState<ProcessedFile | null>(null);
  const [targetFormat, setTargetFormat] = useState('image/png'); // Default target
  const [error, setError] = useState<string | null>(null);

  const handleConvert = useCallback(async () => {
    setError(null);
    setProcessedFile(null);
    if (uploadedFiles.length === 0) {
      setError('Please upload an image file to convert.');
      return;
    }
    if (uploadedFiles.length > 1) {
      setError('Please upload only one image file for conversion.');
      return;
    }
    const imageFile = uploadedFiles[0];
    if (!imageFile.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, BMP, WebP).');
      return;
    }
    if (!imageFile.arrayBuffer) {
      setError('File content not loaded yet. Please wait for the file to finish processing or try re-uploading.');
      return;
    }

    setLoading(true);
    try {
      const result = await imageService.convertImage(imageFile, targetFormat);
      setProcessedFile(result);
    } catch (e) {
      console.error(e);
      setError(`Failed to convert image: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [uploadedFiles, targetFormat]);

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

  const acceptedFileTypes = ['image/jpeg', 'image/png', 'image/bmp', 'image/webp'];

  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Convert Image</h2>
      <p className="text-gray-600 mb-6">
        Convert your image files between popular formats like JPG and PNG.
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
            <label htmlFor="targetFormat" className="block text-sm font-medium text-gray-700 mb-2">
              Convert to:
            </label>
            <select
              id="targetFormat"
              value={targetFormat}
              onChange={(e) => setTargetFormat(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              disabled={loading}
            >
              <option value="image/jpeg">JPG</option>
              <option value="image/png">PNG</option>
              <option value="image/bmp">BMP</option>
            </select>
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
        <Button onClick={handleConvert} disabled={uploadedFiles.length === 0 || loading} loading={loading}>
          Convert Image
        </Button>
      </div>

      {loading && <LoadingSpinner message="Converting image..." />}

      {processedFile && (
        <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-inner text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Converted Image</h3>
          <img src={processedFile.dataUrl} alt={processedFile.name} className="max-w-full h-auto mx-auto mb-4 rounded-md shadow-sm border border-gray-100" style={{ maxHeight: '200px' }} />
          <p className="text-gray-700 mb-4">
            File: {processedFile.name} <br />
            Size: {(processedFile.size / 1024).toFixed(2)} KB
          </p>
          <Button onClick={handleDownload} variant="primary">
            Download Converted Image
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImageConvertTool;