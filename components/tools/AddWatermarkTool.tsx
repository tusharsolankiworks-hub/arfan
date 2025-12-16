import React, { useState, useEffect, useRef } from 'react';
import { AppFile, ProcessedFile } from '../../types';
import Dropzone from '../Dropzone';
import Button from '../Button';
import LoadingSpinner from '../LoadingSpinner';
import FilePreviewCard from '../FilePreviewCard';
import { watermarkService, TextWatermarkSettings, ImageWatermarkSettings } from '../../services/watermarkService';
import { pdfService } from '../../services/pdfService';

interface AddWatermarkToolProps {
  onUpload: (files: File[]) => void;
  uploadedFiles: AppFile[];
  onRemoveFile: (id: string) => void;
}

const AddWatermarkTool: React.FC<AddWatermarkToolProps> = ({ onUpload, uploadedFiles, onRemoveFile }) => {
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [loading, setLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Settings
  const [textSettings, setTextSettings] = useState<TextWatermarkSettings>({
    text: 'CONFIDENTIAL',
    fontSize: 48,
    opacity: 50,
    rotation: 45,
    color: '#FF0000',
    isTiled: false,
    position: { x: 50, y: 50 }
  });

  const [imageSettings, setImageSettings] = useState<ImageWatermarkSettings>({
    imageFile: null,
    opacity: 50,
    rotation: 0,
    scale: 0.5,
    isTiled: false,
    position: { x: 50, y: 50 }
  });

  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // Drag State for Preview
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Load PDF Preview
  useEffect(() => {
    if (uploadedFiles.length > 0 && uploadedFiles[0].arrayBuffer) {
       pdfService.renderPage(uploadedFiles[0], 0, 1.0).then(setPreviewUrl);
    } else {
       setPreviewUrl(null);
    }
  }, [uploadedFiles]);

  const handleProcess = async () => {
    if (uploadedFiles.length === 0) return;
    setLoading(true);
    setProcessedFiles([]);
    
    try {
      const results: ProcessedFile[] = [];
      for (let i = 0; i < uploadedFiles.length; i++) {
        setProcessingStatus(`Watermarking file ${i + 1} of ${uploadedFiles.length}...`);
        // Small delay to let UI update
        await new Promise(r => setTimeout(r, 10));

        let result;
        if (activeTab === 'text') {
           result = await watermarkService.addTextWatermark(uploadedFiles[i], textSettings);
        } else {
           if (!imageSettings.imageFile) throw new Error("Please upload a watermark image.");
           result = await watermarkService.addImageWatermark(uploadedFiles[i], imageSettings);
        }
        results.push(result);
      }
      setProcessedFiles(results);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setLoading(false);
      setProcessingStatus('');
    }
  };

  const handleDownloadAll = () => {
      processedFiles.forEach(file => {
          const link = document.createElement('a');
          link.href = file.dataUrl;
          link.download = file.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files && e.target.files[0]) {
         const file = e.target.files[0];
         setImageSettings(prev => ({ ...prev, imageFile: file }));
         setImagePreviewUrl(URL.createObjectURL(file));
     }
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
     if (activeTab === 'text' && textSettings.isTiled) return;
     if (activeTab === 'image' && imageSettings.isTiled) return;
     isDraggingRef.current = true;
     e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !previewContainerRef.current) return;
    
    const rect = previewContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Clamp to 0-100%
    const perX = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const perY = Math.max(0, Math.min(100, (y / rect.height) * 100));
    
    if (activeTab === 'text') {
        setTextSettings(prev => ({ ...prev, position: { x: perX, y: perY } }));
    } else {
        setImageSettings(prev => ({ ...prev, position: { x: perX, y: perY } }));
    }
  };

  const handleMouseUp = () => {
      isDraggingRef.current = false;
  };

  const handleMouseLeave = () => {
      isDraggingRef.current = false;
  };

  // Helper to set predefined positions
  const setPosition = (x: number, y: number) => {
      if (activeTab === 'text') setTextSettings(prev => ({ ...prev, position: { x, y } }));
      else setImageSettings(prev => ({ ...prev, position: { x, y } }));
  };

  const GridButton = ({ x, y }: { x: number, y: number }) => (
      <button 
        className="w-8 h-8 border border-gray-300 hover:bg-blue-100 hover:border-blue-400 rounded-sm bg-white"
        onClick={() => setPosition(x, y)}
        title={`Position ${x}%, ${y}%`}
      >
          <div className={`w-2 h-2 rounded-full mx-auto ${
             ((activeTab === 'text' ? textSettings.position.x : imageSettings.position.x) === x &&
              (activeTab === 'text' ? textSettings.position.y : imageSettings.position.y) === y) ? 'bg-blue-600' : 'bg-gray-300'
          }`}></div>
      </button>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] w-full bg-gray-50">
        {/* Header / Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm z-20 sticky top-0">
             <div className="flex items-center space-x-2">
                 <h2 className="text-xl font-bold text-gray-800">Add Watermark</h2>
                 {uploadedFiles.length > 1 && (
                     <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-semibold border border-green-200">
                         Batch Mode ({uploadedFiles.length} files)
                     </span>
                 )}
             </div>
             {uploadedFiles.length > 0 && (
                <div className="flex space-x-3">
                    <Button variant="outline" onClick={() => onUpload([])} size="sm">Add More Files</Button>
                    <Button variant="danger" onClick={() => uploadedFiles.forEach(f => onRemoveFile(f.id))} size="sm">Clear All</Button>
                </div>
             )}
        </div>

        {uploadedFiles.length === 0 ? (
            <div className="flex-1 p-8 flex items-center justify-center">
                <div className="max-w-xl w-full">
                    <Dropzone onFilesSelected={onUpload} acceptedFileTypes={['application/pdf']} multiple={true} label="Drag & drop PDFs to watermark" />
                </div>
            </div>
        ) : (
            <div className="flex-1 flex overflow-hidden">
                {/* Left Controls Sidebar */}
                <div className="w-80 md:w-96 bg-white border-r border-gray-200 flex flex-col overflow-y-auto shrink-0 z-10">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-200">
                        <button 
                            className={`flex-1 py-4 text-sm font-bold text-center transition-colors ${activeTab === 'text' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
                            onClick={() => setActiveTab('text')}
                        >
                            Text
                        </button>
                        <button 
                            className={`flex-1 py-4 text-sm font-bold text-center transition-colors ${activeTab === 'image' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
                            onClick={() => setActiveTab('image')}
                        >
                            Image
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {activeTab === 'text' ? (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Watermark Text</label>
                                    <input 
                                        type="text" 
                                        value={textSettings.text} 
                                        onChange={e => setTextSettings({...textSettings, text: e.target.value})}
                                        className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                     <div>
                                         <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Font Size</label>
                                         <input type="number" min="8" max="200" value={textSettings.fontSize} onChange={e => setTextSettings({...textSettings, fontSize: parseInt(e.target.value)})} className="w-full border p-2 rounded"/>
                                     </div>
                                     <div>
                                         <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Color</label>
                                         <div className="flex items-center space-x-2">
                                             <input type="color" value={textSettings.color} onChange={e => setTextSettings({...textSettings, color: e.target.value})} className="h-10 w-10 border rounded cursor-pointer"/>
                                             <span className="text-xs text-gray-400">{textSettings.color}</span>
                                         </div>
                                     </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Opacity: {textSettings.opacity}%</label>
                                    <input type="range" min="10" max="100" value={textSettings.opacity} onChange={e => setTextSettings({...textSettings, opacity: parseInt(e.target.value)})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Rotation: {textSettings.rotation}°</label>
                                    <input type="range" min="-180" max="180" value={textSettings.rotation} onChange={e => setTextSettings({...textSettings, rotation: parseInt(e.target.value)})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"/>
                                </div>
                                <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-md border border-gray-200">
                                    <input 
                                        type="checkbox" 
                                        id="tile-check-text" 
                                        checked={textSettings.isTiled} 
                                        onChange={e => setTextSettings({...textSettings, isTiled: e.target.checked})}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="tile-check-text" className="text-sm font-medium text-gray-700 select-none">Tile / Repeat Watermark</label>
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Upload Image</label>
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Scale: {imageSettings.scale}</label>
                                    <input type="range" min="0.1" max="2.0" step="0.1" value={imageSettings.scale} onChange={e => setImageSettings({...imageSettings, scale: parseFloat(e.target.value)})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Opacity: {imageSettings.opacity}%</label>
                                    <input type="range" min="10" max="100" value={imageSettings.opacity} onChange={e => setImageSettings({...imageSettings, opacity: parseInt(e.target.value)})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Rotation: {imageSettings.rotation}°</label>
                                    <input type="range" min="-180" max="180" value={imageSettings.rotation} onChange={e => setImageSettings({...imageSettings, rotation: parseInt(e.target.value)})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"/>
                                </div>
                                <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-md border border-gray-200">
                                    <input 
                                        type="checkbox" 
                                        id="tile-check-img" 
                                        checked={imageSettings.isTiled} 
                                        onChange={e => setImageSettings({...imageSettings, isTiled: e.target.checked})}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="tile-check-img" className="text-sm font-medium text-gray-700 select-none">Tile / Repeat Watermark</label>
                                </div>
                            </>
                        )}

                        {/* Position Grid (Disabled if tiled) */}
                        <div className={`pt-4 border-t border-gray-200 ${(activeTab === 'text' && textSettings.isTiled) || (activeTab === 'image' && imageSettings.isTiled) ? 'opacity-40 pointer-events-none' : ''}`}>
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Position</label>
                             <div className="flex justify-center">
                                 <div className="grid grid-cols-3 gap-2">
                                     <GridButton x={0} y={0} /> <GridButton x={50} y={0} /> <GridButton x={100} y={0} />
                                     <GridButton x={0} y={50} /> <GridButton x={50} y={50} /> <GridButton x={100} y={50} />
                                     <GridButton x={0} y={100} /> <GridButton x={50} y={100} /> <GridButton x={100} y={100} />
                                 </div>
                             </div>
                             <p className="text-xs text-center text-gray-400 mt-2">Or drag watermark in preview</p>
                        </div>
                    </div>
                </div>

                {/* Right Preview Area */}
                <div className="flex-1 bg-gray-100 flex items-center justify-center p-8 overflow-auto relative">
                     {previewUrl ? (
                         <div 
                            ref={previewContainerRef}
                            className="relative shadow-xl bg-white select-none cursor-crosshair overflow-hidden"
                            style={{ maxWidth: '100%', maxHeight: '100%', aspectRatio: '1/1.414' }} // Standard A4 ratio approximation
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseLeave}
                         >
                             <img src={previewUrl} alt="Preview" className="max-w-full max-h-[80vh] block pointer-events-none"/>
                             
                             {/* Watermark Overlay */}
                             {(activeTab === 'text' && textSettings.isTiled) || (activeTab === 'image' && imageSettings.isTiled) ? (
                                 <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-90">
                                     <div className="grid grid-cols-3 grid-rows-4 w-full h-full">
                                         {Array.from({length: 12}).map((_, i) => (
                                             <div key={i} className="flex items-center justify-center">
                                                 {activeTab === 'text' ? (
                                                     <div style={{
                                                         transform: `rotate(${textSettings.rotation}deg)`,
                                                         color: textSettings.color,
                                                         fontSize: `${textSettings.fontSize / 2}px`, // Scale down slightly for preview sizing
                                                         opacity: textSettings.opacity / 100,
                                                         fontWeight: 'bold',
                                                         whiteSpace: 'nowrap'
                                                     }}>
                                                         {textSettings.text}
                                                     </div>
                                                 ) : imagePreviewUrl && (
                                                     <img src={imagePreviewUrl} alt="wm" style={{
                                                         transform: `rotate(${imageSettings.rotation}deg) scale(${imageSettings.scale})`,
                                                         opacity: imageSettings.opacity / 100,
                                                         maxWidth: '80%',
                                                         maxHeight: '80%'
                                                     }}/>
                                                 )}
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                             ) : (
                                 // Single Watermark
                                 <div 
                                    className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none whitespace-nowrap"
                                    style={{
                                        left: `${activeTab === 'text' ? textSettings.position.x : imageSettings.position.x}%`,
                                        top: `${activeTab === 'text' ? textSettings.position.y : imageSettings.position.y}%`,
                                    }}
                                 >
                                     {activeTab === 'text' ? (
                                         <div style={{
                                            fontSize: `${textSettings.fontSize}px`, 
                                            color: textSettings.color,
                                            opacity: textSettings.opacity / 100,
                                            transform: `rotate(${textSettings.rotation}deg)`,
                                            fontWeight: 'bold',
                                            textShadow: '0 0 2px rgba(255,255,255,0.5)' // Slight outline for visibility
                                         }}>
                                             {textSettings.text}
                                         </div>
                                     ) : imagePreviewUrl && (
                                         <img 
                                            src={imagePreviewUrl} 
                                            alt="watermark"
                                            style={{
                                                transform: `rotate(${imageSettings.rotation}deg) scale(${imageSettings.scale})`,
                                                opacity: imageSettings.opacity / 100,
                                                maxWidth: '300px'
                                            }}
                                         />
                                     )}
                                 </div>
                             )}
                         </div>
                     ) : (
                         <LoadingSpinner message="Loading PDF Preview..." />
                     )}
                </div>
            </div>
        )}

        {/* Bottom Bar */}
        <div className="bg-white border-t border-gray-200 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
             <div className="max-w-4xl mx-auto flex items-center justify-between">
                 <div className="text-sm text-gray-500">
                     {processedFiles.length > 0 ? (
                         <span className="text-green-600 font-bold flex items-center">
                             <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                             Processing Complete!
                         </span>
                     ) : (
                         <span>Ready to process {uploadedFiles.length} file(s)</span>
                     )}
                 </div>

                 {processedFiles.length > 0 ? (
                     <div className="flex space-x-3">
                         <Button onClick={() => setProcessedFiles([])} variant="secondary">Reset</Button>
                         <Button onClick={handleDownloadAll} className="bg-green-600 hover:bg-green-700 px-8">Download Files</Button>
                     </div>
                 ) : (
                     <Button 
                        onClick={handleProcess} 
                        disabled={uploadedFiles.length === 0 || loading || (activeTab === 'image' && !imageSettings.imageFile)} 
                        className="bg-blue-600 hover:bg-blue-700 px-10 py-3 text-lg shadow-md"
                        loading={loading}
                     >
                         {loading ? processingStatus : 'Add Watermark & Download'}
                     </Button>
                 )}
             </div>
        </div>
    </div>
  );
};

export default AddWatermarkTool;