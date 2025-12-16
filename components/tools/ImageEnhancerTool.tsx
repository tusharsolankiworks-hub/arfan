import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AppFile, ProcessedFile } from '../../types';
import Dropzone from '../Dropzone';
import Button from '../Button';
import LoadingSpinner from '../LoadingSpinner';
import { imageEnhancerService, EnhanceSettings, AnalysisResult } from '../../services/imageEnhancerService';
import { arrayBufferToDataURL } from '../../utils/fileUtils';

declare const fabric: any;

interface ImageEnhancerToolProps {
  onUpload: (files: File[]) => void;
  uploadedFiles: AppFile[];
  onRemoveFile: (id: string) => void;
}

const ImageEnhancerTool: React.FC<ImageEnhancerToolProps> = ({ onUpload, uploadedFiles, onRemoveFile }) => {
  const [mode, setMode] = useState<'manual' | 'ai'>('manual');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  
  // Image State
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null); // For AI result
  const [finalResult, setFinalResult] = useState<ProcessedFile | null>(null);

  // Manual Settings
  const [settings, setSettings] = useState<EnhanceSettings>({
    sharpen: 0,
    contrast: 0,
    brightness: 0
  });

  // AI State
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [aiUpscaleFactor, setAiUpscaleFactor] = useState<2 | 4>(2);

  // UI State
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  
  // Refs
  const canvasRef = useRef<any>(null); // Fabric canvas
  const containerRef = useRef<HTMLDivElement>(null);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  // Initialize
  useEffect(() => {
    if (uploadedFiles.length > 0 && uploadedFiles[0].arrayBuffer) {
        const url = arrayBufferToDataURL(uploadedFiles[0].arrayBuffer, uploadedFiles[0].type);
        setOriginalUrl(url);
        setProcessedUrl(null); // Reset
        setFinalResult(null);
        setSettings({ sharpen: 0, contrast: 0, brightness: 0 });
        
        // Analyze with Gemini
        analyzeImage(uploadedFiles[0]);

        if (mode === 'manual') {
            initManualCanvas();
        }
    }
  }, [uploadedFiles]);

  useEffect(() => {
      if (mode === 'manual' && uploadedFiles.length > 0) {
          initManualCanvas();
      }
  }, [mode]);

  const analyzeImage = async (file: AppFile) => {
      try {
          const res = await imageEnhancerService.analyzeImage(file);
          setAnalysis(res);
          setAiUpscaleFactor(res.suggestedUpscale);
      } catch (e) {
          console.warn("Analysis skipped");
      }
  };

  const initManualCanvas = () => {
      // Delay to ensure DOM is ready
      setTimeout(() => {
          if (!containerRef.current || !uploadedFiles[0]) return;
          
          if (canvasRef.current) canvasRef.current.dispose();

          const width = containerRef.current.clientWidth;
          const height = 500; // Fixed height for consistency

          const canvas = new fabric.Canvas('manual-canvas', {
              width,
              height,
              backgroundColor: '#1f2937' // gray-800
          });

          imageEnhancerService.loadToCanvas(uploadedFiles[0], canvas).then(() => {
              canvasRef.current = canvas;
              applySettings(); // Apply initial 0 settings
          });
      }, 100);
  };

  // Debounced Filter Application
  const applySettings = useCallback(() => {
      if (canvasRef.current) {
          imageEnhancerService.applyManualFilters(canvasRef.current, settings);
      }
  }, [settings]);

  useEffect(() => {
      applySettings();
  }, [settings, applySettings]);

  // --- Handlers ---

  const handleAiEnhance = async () => {
      setLoading(true);
      setStatusText("Initializing AI Engine (ESRGAN)...");
      setProgress(0);

      try {
          // 1. Upscale
          const resultDataUrl = await imageEnhancerService.upscaleAI(
              uploadedFiles[0], 
              aiUpscaleFactor, 
              (p) => {
                  setProgress(p);
                  setStatusText(`Upscaling... ${p}%`);
              }
          );

          setProcessedUrl(resultDataUrl);
          
          // Create a processed file object for download
          const blob = await (await fetch(resultDataUrl)).blob();
          setFinalResult({
              id: crypto.randomUUID(),
              name: `enhanced_ai_${uploadedFiles[0].name}`,
              mimeType: uploadedFiles[0].type,
              dataUrl: resultDataUrl,
              size: blob.size
          });

      } catch (e) {
          alert((e as Error).message);
      } finally {
          setLoading(false);
          setStatusText("");
      }
  };

  const handleManualExport = async () => {
      if (!canvasRef.current) return;
      setLoading(true);
      try {
          const result = await imageEnhancerService.exportCanvas(canvasRef.current, uploadedFiles[0].name);
          setFinalResult(result);
          // Also set processed URL for split view
          setProcessedUrl(result.dataUrl);
          // Switch to "AI" mode visually just to show the split view result
          setMode('ai'); 
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  // --- Split View Logic ---
  const handleDragStart = () => setIsDragging(true);
  const handleDragEnd = () => setIsDragging(false);
  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDragging || !splitContainerRef.current) return;
      
      const rect = splitContainerRef.current.getBoundingClientRect();
      let clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      
      let newPos = ((clientX - rect.left) / rect.width) * 100;
      newPos = Math.max(0, Math.min(100, newPos));
      setSliderPosition(newPos);
  };

  // --- Render ---

  return (
    <div className="flex flex-col min-h-[600px] bg-gray-50 rounded-xl shadow-xl overflow-hidden max-w-6xl mx-auto">
        
        {/* Top Header */}
        <div className="bg-white border-b px-6 py-4 flex flex-col md:flex-row justify-between items-center z-20">
            <div>
                <h2 className="text-2xl font-black text-gray-800 flex items-center">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-1.5 rounded-lg mr-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    </span>
                    AI Image Enhancer <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">PRO</span>
                </h2>
                <p className="text-sm text-gray-500 mt-1">De-blur, sharpen, and upscale images up to 4K.</p>
            </div>
            
            {uploadedFiles.length > 0 && (
                <div className="flex bg-gray-100 p-1 rounded-lg mt-4 md:mt-0">
                    <button 
                        onClick={() => setMode('manual')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${mode === 'manual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Manual Adjust
                    </button>
                    <button 
                        onClick={() => setMode('ai')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${mode === 'ai' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        AI Upscale
                    </button>
                </div>
            )}
        </div>

        {/* Main Content */}
        {uploadedFiles.length === 0 ? (
            <div className="flex-1 p-10 flex items-center justify-center bg-gray-50">
                <div className="w-full max-w-2xl">
                    <Dropzone onFilesSelected={onUpload} acceptedFileTypes={['image/jpeg', 'image/png', 'image/webp']} multiple={false} label="Drag & Drop blurry photo here" />
                    
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-white rounded-lg shadow-sm">
                            <div className="text-2xl mb-2">🔎</div>
                            <h4 className="font-bold text-gray-800">De-Blur</h4>
                            <p className="text-xs text-gray-500">Fix out-of-focus shots</p>
                        </div>
                        <div className="p-4 bg-white rounded-lg shadow-sm">
                            <div className="text-2xl mb-2">🚀</div>
                            <h4 className="font-bold text-gray-800">4x Upscale</h4>
                            <p className="text-xs text-gray-500">Boost resolution w/ AI</p>
                        </div>
                        <div className="p-4 bg-white rounded-lg shadow-sm">
                            <div className="text-2xl mb-2">✨</div>
                            <h4 className="font-bold text-gray-800">Enhance</h4>
                            <p className="text-xs text-gray-500">Correct color & lighting</p>
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                
                {/* Left Sidebar: Controls */}
                <div className="w-full lg:w-80 bg-white border-r p-6 overflow-y-auto shrink-0 z-10 shadow-lg lg:shadow-none">
                    {mode === 'manual' ? (
                        <div className="space-y-8">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-bold text-gray-700">Sharpen (De-blur)</label>
                                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{(settings.sharpen * 100).toFixed(0)}%</span>
                                </div>
                                <input 
                                    type="range" min="0" max="2" step="0.1" 
                                    value={settings.sharpen} 
                                    onChange={(e) => setSettings({...settings, sharpen: parseFloat(e.target.value)})}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <p className="text-xs text-gray-400 mt-1">Best for out-of-focus edges</p>
                            </div>

                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-bold text-gray-700">Contrast</label>
                                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{settings.contrast.toFixed(2)}</span>
                                </div>
                                <input 
                                    type="range" min="-1" max="1" step="0.05" 
                                    value={settings.contrast} 
                                    onChange={(e) => setSettings({...settings, contrast: parseFloat(e.target.value)})}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-bold text-gray-700">Brightness</label>
                                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{settings.brightness.toFixed(2)}</span>
                                </div>
                                <input 
                                    type="range" min="-1" max="1" step="0.05" 
                                    value={settings.brightness} 
                                    onChange={(e) => setSettings({...settings, brightness: parseFloat(e.target.value)})}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                            </div>

                            <Button onClick={handleManualExport} className="w-full py-3 mt-4" loading={loading}>
                                Apply & Compare
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Gemini Analysis Card */}
                            {analysis && (
                                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                                        <h4 className="text-xs font-bold text-purple-800 uppercase tracking-wider">AI Analysis</h4>
                                    </div>
                                    <div className="space-y-2 text-sm text-purple-900">
                                        <div className="flex justify-between">
                                            <span>Blur Level:</span>
                                            <span className="font-bold">{analysis.blurScore > 50 ? 'High' : 'Low'}</span>
                                        </div>
                                        <div className="w-full bg-purple-200 h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-purple-600 h-full" style={{width: `${analysis.blurScore}%`}}></div>
                                        </div>
                                        <p className="text-xs text-purple-700 mt-2 italic">
                                            Recommendation: Upscale {analysis.suggestedUpscale}x with {analysis.suggestedSharpen} sharpening.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-3">Upscale Factor</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => setAiUpscaleFactor(2)}
                                        className={`py-3 border-2 rounded-lg font-bold text-center transition-all ${aiUpscaleFactor === 2 ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                    >
                                        2x <span className="block text-[10px] font-normal">Fast</span>
                                    </button>
                                    <button 
                                        onClick={() => setAiUpscaleFactor(4)}
                                        className={`py-3 border-2 rounded-lg font-bold text-center transition-all ${aiUpscaleFactor === 4 ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                    >
                                        4x <span className="block text-[10px] font-normal">Super HD</span>
                                    </button>
                                </div>
                            </div>

                            <Button 
                                onClick={handleAiEnhance} 
                                disabled={loading} 
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg text-lg"
                            >
                                {loading ? (
                                    <div className="flex flex-col items-center">
                                        <span>{statusText || "Processing..."}</span>
                                        {progress > 0 && <span className="text-xs opacity-80 mt-1">{progress}%</span>}
                                    </div>
                                ) : "✨ Auto Enhance"}
                            </Button>
                            
                            <p className="text-xs text-center text-gray-400">
                                Powered by TensorFlow.js & ESRGAN.<br/>Processing happens on your device.
                            </p>
                        </div>
                    )}
                </div>

                {/* Right Area: Preview */}
                <div className="flex-1 bg-gray-900 flex flex-col items-center justify-center p-4 lg:p-8 relative overflow-hidden">
                    
                    {mode === 'manual' && !processedUrl ? (
                        /* Manual Mode Canvas */
                        <div className="shadow-2xl border-4 border-gray-700 rounded-lg overflow-hidden bg-gray-800" ref={containerRef}>
                            <canvas id="manual-canvas"></canvas>
                        </div>
                    ) : (
                        /* Comparison Split View */
                        processedUrl && originalUrl ? (
                            <div className="flex flex-col items-center w-full h-full max-h-[600px]">
                                <div 
                                    ref={splitContainerRef}
                                    className="relative w-full h-full max-w-4xl select-none cursor-ew-resize rounded-lg overflow-hidden shadow-2xl border-4 border-gray-700 bg-black"
                                    onMouseDown={handleDragStart}
                                    onTouchStart={handleDragStart}
                                    onMouseMove={handleDragMove}
                                    onTouchMove={handleDragMove}
                                    onMouseUp={handleDragEnd}
                                    onTouchEnd={handleDragEnd}
                                    onMouseLeave={handleDragEnd}
                                >
                                    {/* After Image (Background) */}
                                    <img 
                                        src={processedUrl} 
                                        alt="After" 
                                        className="absolute inset-0 w-full h-full object-contain"
                                        draggable={false}
                                    />
                                    
                                    {/* Before Image (Foreground, clipped) */}
                                    <img 
                                        src={originalUrl} 
                                        alt="Before" 
                                        className="absolute inset-0 w-full h-full object-contain bg-black"
                                        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                                        draggable={false}
                                    />

                                    {/* Labels */}
                                    <span className="absolute top-4 left-4 bg-black/50 text-white px-2 py-1 text-xs rounded font-bold backdrop-blur-sm pointer-events-none">Original</span>
                                    <span className="absolute top-4 right-4 bg-blue-600/80 text-white px-2 py-1 text-xs rounded font-bold backdrop-blur-sm pointer-events-none">Enhanced</span>

                                    {/* Slider Handle */}
                                    <div 
                                        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20"
                                        style={{ left: `${sliderPosition}%` }}
                                    >
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg text-gray-600">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"/></svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Download Action */}
                                <div className="mt-6 flex space-x-4">
                                    <Button onClick={() => setProcessedUrl(null)} variant="secondary">
                                        Back
                                    </Button>
                                    <Button 
                                        onClick={() => {
                                            if (!finalResult) return;
                                            const link = document.createElement('a');
                                            link.href = finalResult.dataUrl;
                                            link.download = finalResult.name;
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                        }} 
                                        className="bg-green-600 hover:bg-green-700 px-8 shadow-lg"
                                    >
                                        Download HD Image
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-500 flex flex-col items-center">
                                {loading && <LoadingSpinner message={statusText || "Processing..."} />}
                                {!loading && mode === 'ai' && <p>Click "Auto Enhance" to start.</p>}
                            </div>
                        )
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default ImageEnhancerTool;