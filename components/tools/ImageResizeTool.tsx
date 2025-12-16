import React, { useState, useEffect } from 'react';
import { AppFile, ProcessedFile } from '../../types';
import Dropzone from '../Dropzone';
import Button from '../Button';
import LoadingSpinner from '../LoadingSpinner';
import FilePreviewCard from '../FilePreviewCard';
import { imageService } from '../../services/imageService';
import { arrayBufferToDataURL } from '../../utils/fileUtils';

interface ImageResizeToolProps {
  onUpload: (files: File[]) => void;
  uploadedFiles: AppFile[];
  onRemoveFile: (id: string) => void;
}

const ImageResizeTool: React.FC<ImageResizeToolProps> = ({ onUpload, uploadedFiles, onRemoveFile }) => {
  const [loading, setLoading] = useState(false);
  const [processedFile, setProcessedFile] = useState<ProcessedFile | null>(null);
  const [originalDims, setOriginalDims] = useState<{ width: number; height: number } | null>(null);
  
  // Settings
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [percentage, setPercentage] = useState<number>(100);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [resizeMode, setResizeMode] = useState<'pixels' | 'percentage'>('pixels');
  const [error, setError] = useState<string | null>(null);

  // Load original dimensions
  useEffect(() => {
    if (uploadedFiles.length > 0 && uploadedFiles[0].arrayBuffer) {
        const url = arrayBufferToDataURL(uploadedFiles[0].arrayBuffer, uploadedFiles[0].type);
        const img = new Image();
        img.onload = () => {
            setOriginalDims({ width: img.width, height: img.height });
            // Init inputs
            setWidth(img.width);
            setHeight(img.height);
            setPercentage(100);
        };
        img.src = url;
    } else {
        setOriginalDims(null);
        setProcessedFile(null);
    }
  }, [uploadedFiles]);

  // Handle Dimension Changes
  const handleWidthChange = (val: number) => {
      setWidth(val);
      if (maintainAspectRatio && originalDims) {
          const ratio = originalDims.height / originalDims.width;
          setHeight(Math.round(val * ratio));
      }
  };

  const handleHeightChange = (val: number) => {
      setHeight(val);
      if (maintainAspectRatio && originalDims) {
          const ratio = originalDims.width / originalDims.height;
          setWidth(Math.round(val * ratio));
      }
  };

  const handlePercentageChange = (val: number) => {
      setPercentage(val);
      if (originalDims) {
          setWidth(Math.round(originalDims.width * (val / 100)));
          setHeight(Math.round(originalDims.height * (val / 100)));
      }
  };

  const handleResize = async () => {
    if (uploadedFiles.length === 0) return;
    setLoading(true);
    setProcessedFile(null);
    setError(null);

    try {
        const result = await imageService.resizeImage(uploadedFiles[0], width, height);
        setProcessedFile(result);
    } catch (e) {
        console.error(e);
        setError("Resize failed: " + (e as Error).message);
    } finally {
        setLoading(false);
    }
  };

  const handleDownload = () => {
      if (!processedFile) return;
      const link = document.createElement('a');
      link.href = processedFile.dataUrl;
      link.download = processedFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto min-h-[600px] flex flex-col">
      <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center">
            <span className="bg-purple-100 text-purple-600 p-2 rounded-lg mr-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </span>
            Resize Image
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto">Resize JPG, PNG or WebP images by defining pixel dimensions or percentage scaling.</p>
      </div>

      {uploadedFiles.length === 0 ? (
          <div className="flex-grow flex flex-col justify-center">
              <Dropzone onFilesSelected={onUpload} acceptedFileTypes={['image/jpeg', 'image/png', 'image/webp']} multiple={false} label="Drag & drop image to resize" />
          </div>
      ) : (
          <div className="flex-grow">
              <div className="mb-6">
                  <h3 className="font-bold text-gray-700 mb-4">Selected Image</h3>
                  <FilePreviewCard file={uploadedFiles[0]} onRemove={onRemoveFile} />
                  {originalDims && (
                      <p className="text-xs text-gray-500 mt-2 text-center">Original Dimensions: <strong>{originalDims.width}px x {originalDims.height}px</strong></p>
                  )}
              </div>

              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6 max-w-lg mx-auto">
                  <div className="flex justify-center space-x-4 mb-6 border-b border-gray-200 pb-4">
                      <button 
                        onClick={() => setResizeMode('pixels')}
                        className={`pb-1 text-sm font-bold ${resizeMode === 'pixels' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
                      >
                          By Pixels
                      </button>
                      <button 
                        onClick={() => setResizeMode('percentage')}
                        className={`pb-1 text-sm font-bold ${resizeMode === 'percentage' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
                      >
                          By Percentage
                      </button>
                  </div>

                  {resizeMode === 'pixels' ? (
                      <div className="grid grid-cols-2 gap-4 relative">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Width (px)</label>
                              <input type="number" value={width} onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)} className="w-full border rounded p-2 text-center" />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Height (px)</label>
                              <input type="number" value={height} onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)} className="w-full border rounded p-2 text-center" />
                          </div>
                          
                          {/* Link Icon for Aspect Ratio */}
                          {maintainAspectRatio && (
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-1 border shadow-sm text-gray-400">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                              </div>
                          )}
                      </div>
                  ) : (
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-2">Scale Percentage: {percentage}%</label>
                          <input type="range" min="1" max="200" value={percentage} onChange={(e) => handlePercentageChange(parseInt(e.target.value))} className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600" />
                          <p className="text-center text-sm font-bold text-gray-700 mt-2">{width}px x {height}px</p>
                      </div>
                  )}

                  <div className="mt-4 flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        id="aspectRatio" 
                        checked={maintainAspectRatio} 
                        onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <label htmlFor="aspectRatio" className="ml-2 text-sm text-gray-600 cursor-pointer select-none">Maintain Aspect Ratio</label>
                  </div>
              </div>

              {!loading && !processedFile && (
                  <div className="text-center mt-8">
                      <Button onClick={handleResize} className="bg-purple-600 hover:bg-purple-700 px-12 py-4 text-lg shadow-lg">
                          Resize Image
                      </Button>
                  </div>
              )}

              {loading && (
                  <div className="flex flex-col items-center justify-center h-40">
                      <LoadingSpinner message="Resizing..." />
                  </div>
              )}

              {processedFile && (
                  <div className="mt-8 p-8 bg-purple-50 border border-purple-200 rounded-xl text-center animate-fade-in">
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">Done!</h3>
                      <p className="text-gray-600 mb-4">Image resized to {width} x {height} px.</p>
                      
                      <div className="flex justify-center mb-6">
                          <img src={processedFile.dataUrl} alt="Resized" className="max-h-48 border rounded shadow-sm bg-white" />
                      </div>

                      <Button onClick={handleDownload} className="bg-green-600 hover:bg-green-700 px-10 py-3 text-lg shadow-md">
                          Download Image
                      </Button>
                      <button onClick={() => { setProcessedFile(null); onUpload([]); }} className="block mx-auto mt-4 text-sm text-gray-500 hover:text-gray-700 underline">
                          Resize Another
                      </button>
                  </div>
              )}

              {error && (
                  <div className="mt-6 p-4 bg-red-100 text-red-700 rounded-lg text-center border border-red-200">
                      <p className="font-bold">Error:</p>
                      <p>{error}</p>
                      <Button variant="secondary" size="sm" className="mt-4" onClick={() => { setError(null); setLoading(false); }}>Try Again</Button>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};

export default ImageResizeTool;