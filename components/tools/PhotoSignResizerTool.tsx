import React, { useState, useCallback } from 'react';
import { AppFile, ProcessedFile } from '../../types';
import Button from '../Button';
import LoadingSpinner from '../LoadingSpinner';
import { imageService } from '../../services/imageService';
import { fileToArrayBuffer } from '../../utils/fileUtils';

const ResizerSection: React.FC<{
  title: string;
  uploadLabel: string;
  buttonLabel: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultDpi: number;
}> = ({ title, uploadLabel, buttonLabel, defaultWidth, defaultHeight, defaultDpi }) => {
  const [file, setFile] = useState<AppFile | null>(null);
  const [width, setWidth] = useState(defaultWidth);
  const [height, setHeight] = useState(defaultHeight);
  const [dpi, setDpi] = useState(defaultDpi);
  const [loading, setLoading] = useState(false);
  const [processedFile, setProcessedFile] = useState<ProcessedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputId = `fileInput-${title.replace(/\s/g, '')}`;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setError(null);
      setProcessedFile(null);
      const appFile: AppFile = {
        id: crypto.randomUUID(),
        file: selectedFile,
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
        objectURL: URL.createObjectURL(selectedFile),
      };
      setFile(appFile);

      try {
        const arrayBuffer = await fileToArrayBuffer(selectedFile);
        setFile(f => f ? { ...f, arrayBuffer } : null);
      } catch (err) {
        setError("Could not read file content.");
      }
    }
    e.target.value = '';
  };

  const handleResize = async () => {
    if (!file || !file.arrayBuffer) {
      setError('Please select a file and wait for it to load.');
      return;
    }
    setError(null);
    setProcessedFile(null);
    setLoading(true);
    try {
      // NOTE: DPI is metadata primarily for printing and is not reliably settable with current browser-based tools.
      // The core functionality is resizing to the exact pixel dimensions, which this service provides.
      const result = await imageService.resizeImage(file, width, height);
      setProcessedFile(result);
    } catch (e) {
      setError((e as Error).message);
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

  return (
    <div className="bg-gray-900 bg-opacity-50 p-6 rounded-lg border border-white/20">
      <h3 className="text-xl font-bold text-blue-400 mb-4 text-center">{title}</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor={fileInputId} className="block text-sm font-medium text-white mb-1">{uploadLabel}</label>
          <div className="relative">
             <input
                id={fileInputId}
                type="file"
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                onChange={handleFileChange}
                accept="image/jpeg,image/png"
              />
          </div>
          {file && <p className="text-xs text-gray-400 mt-1 truncate" title={file.name}>{file.name}</p>}
        </div>
        <div>
          <label htmlFor={`${title}-width`} className="block text-sm font-medium text-white mb-1">Required Width in Pixels:</label>
          <input
            type="number"
            id={`${title}-width`}
            value={width}
            onChange={(e) => setWidth(parseInt(e.target.value, 10) || 0)}
            className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label htmlFor={`${title}-height`} className="block text-sm font-medium text-white mb-1">Required Height in Pixels:</label>
          <input
            type="number"
            id={`${title}-height`}
            value={height}
            onChange={(e) => setHeight(parseInt(e.target.value, 10) || 0)}
            className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label htmlFor={`${title}-dpi`} className="block text-sm font-medium text-white mb-1">Required DPI Value:</label>
          <input
            type="number"
            id={`${title}-dpi`}
            value={dpi}
            onChange={(e) => setDpi(parseInt(e.target.value, 10) || 0)}
            className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white focus:ring-blue-500 focus:border-blue-500"
            aria-describedby={`${title}-dpi-note`}
          />
           <p className="text-xs text-gray-500 mt-1" id={`${title}-dpi-note`}>(Note: DPI is for print reference only; the output image will have the specified pixel dimensions.)</p>
        </div>
        <div className="pt-2">
          <Button onClick={handleResize} loading={loading} disabled={!file} className="w-full">
            {buttonLabel}
          </Button>
        </div>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        {loading && <div className="h-10"><LoadingSpinner message="Resizing..." /></div>}
        {processedFile && (
          <div className="mt-4 text-center p-2 rounded-md bg-green-900 bg-opacity-30">
            <p className="text-green-400 font-semibold">Resizing Complete!</p>
            <img src={processedFile.dataUrl} alt="Resized preview" className="mx-auto my-2 max-h-24 border-2 border-blue-500 rounded" />
            <Button onClick={handleDownload} variant="secondary" size="sm">Download</Button>
          </div>
        )}
      </div>
    </div>
  );
};


const PhotoSignResizerTool: React.FC = () => {
    return (
        <div className="p-4 sm:p-6 bg-gray-800 rounded-lg shadow-lg" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232c2240' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}}>
            <h2 className="text-3xl font-bold text-white text-center mb-2">Photo & Signature Resizer</h2>
            <p className="text-gray-400 text-center mb-8">Resize your photos and signatures to exact pixel dimensions for online applications.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                <ResizerSection
                    title="Photo Resize"
                    uploadLabel="Upload Photo:"
                    buttonLabel="Get Photo"
                    defaultWidth={213}
                    defaultHeight={213}
                    defaultDpi={300}
                />
                <ResizerSection
                    title="Signature Resize"
                    uploadLabel="Upload Signature:"
                    buttonLabel="Get Signature"
                    defaultWidth={400}
                    defaultHeight={200}
                    defaultDpi={600}
                />
            </div>
        </div>
    );
};

export default PhotoSignResizerTool;