
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppFile } from '../../types';
import Button from '../Button';
import LoadingSpinner from '../LoadingSpinner';
import { photoEditorService, AdjustSettings } from '../../services/photoEditorService';

// Access Fabric from global window object
declare const fabric: any;

interface PhotoEditorToolProps {
  onUpload: (files: File[]) => void;
  uploadedFiles: AppFile[];
  onRemoveFile: (id: string) => void;
}

// UI Icons
const Icon = ({ name, size = 5, className = "" }: { name: string, size?: number, className?: string }) => {
    const s = `w-${size} h-${size} ${className}`;
    switch (name) {
        case 'move': return <svg className={s} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"/></svg>;
        case 'crop': return <svg className={s} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"/></svg>;
        case 'magic': return <svg className={s} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>;
        case 'adjust': return <svg className={s} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>;
        case 'download': return <svg className={s} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>;
        case 'undo': return <svg className={s} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>;
        case 'redo': return <svg className={s} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"/></svg>;
        case 'image': return <svg className={s} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>;
        case 'close': return <svg className={s} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>;
        default: return null;
    }
};

const PhotoEditorTool: React.FC<PhotoEditorToolProps> = ({ onUpload, uploadedFiles, onRemoveFile }) => {
  // State
  const [activeMode, setActiveMode] = useState<'move' | 'crop'>('move');
  const [sidebarPanel, setSidebarPanel] = useState<'ai' | 'adjust' | 'crop'>('ai');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  
  // Crop State
  const [cropAspectRatio, setCropAspectRatio] = useState(0); // 0 = Free

  // AI & Adjustments State
  const [fillPrompt, setFillPrompt] = useState('');
  const [suggestions, setSuggestions] = useState<{label: string, action: string}[]>([]);
  const [adjustSettings, setAdjustSettings] = useState<AdjustSettings>({
      brightness: 0, contrast: 0, saturation: 0, blur: 0, noise: 0, pixelate: 0
  });

  // History
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const historyLocked = useRef(false);

  // Refs
  const canvasRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Initialization ---
  useEffect(() => {
      // Fabric JS loading check
      const checkFabric = setInterval(() => {
          if (typeof fabric !== 'undefined') {
              clearInterval(checkFabric);
              if (uploadedFiles.length > 0 && !canvasRef.current && containerRef.current) {
                  initCanvas();
              }
          }
      }, 100);
      return () => clearInterval(checkFabric);
  }, [uploadedFiles]);

  // Keyboard Shortcuts
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
              e.preventDefault();
              undo();
          }
          if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
              e.preventDefault();
              redo();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]); // Dep on history index to trigger properly inside closure

  const initCanvas = () => {
      setLoading(true);
      setLoadingText("Opening Studio...");
      
      const width = containerRef.current?.clientWidth || 800;
      const height = containerRef.current?.clientHeight || 600;

      // Dispose existing if any (react strict mode double invoke protection)
      if(canvasRef.current) {
          canvasRef.current.dispose();
      }

      const canvas = new fabric.Canvas('photo-editor-canvas', {
          width,
          height,
          backgroundColor: '#111827', // dark-900
          selection: true,
          preserveObjectStacking: true
      });
      canvasRef.current = canvas;

      // Load Image
      const reader = new FileReader();
      reader.onload = (e) => {
          const imgUrl = e.target?.result as string;
          fabric.Image.fromURL(imgUrl, (img: any) => {
              if (!img) return;
              
              // Scale to fit 80% of canvas initially
              const scale = Math.min((width * 0.8) / img.width, (height * 0.8) / img.height);
              
              img.set({
                  left: width / 2,
                  top: height / 2,
                  originX: 'center',
                  originY: 'center',
                  scaleX: scale,
                  scaleY: scale,
                  id: 'main-image'
              });
              
              canvas.add(img);
              canvas.setActiveObject(img);
              saveHistory(); // Save initial state
              setLoading(false);
          });
      };
      reader.readAsDataURL(uploadedFiles[0].file);

      // Events
      canvas.on('object:modified', () => saveHistory());
      canvas.on('object:added', (e: any) => {
          // Prevent saving history when just adding crop rects or overlays to avoid clutter
          if (e.target && (e.target.id === 'crop-rect' || e.target.id === 'crop-overlay')) return;
          saveHistory();
      });
  };

  // --- History ---
  const saveHistory = useCallback(() => {
      if (historyLocked.current || !canvasRef.current) return;
      // Important: Include 'id' so we can find objects later (like main-image)
      const json = JSON.stringify(canvasRef.current.toJSON(['id', 'selectable', 'evented']));
      
      setHistory(prev => {
          const newH = prev.slice(0, historyIndex + 1);
          newH.push(json);
          return newH;
      });
      setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const undo = () => {
      if (historyIndex <= 0) return; // Cannot undo initial state
      historyLocked.current = true;
      const prevIdx = historyIndex - 1;
      const snapshot = history[prevIdx];
      
      canvasRef.current.loadFromJSON(snapshot, () => {
          canvasRef.current.renderAll();
          setHistoryIndex(prevIdx);
          syncSettingsFromCanvas(); // Sync sliders
          historyLocked.current = false;
      });
  };

  const redo = () => {
      if (historyIndex >= history.length - 1) return;
      historyLocked.current = true;
      const nextIdx = historyIndex + 1;
      const snapshot = history[nextIdx];

      canvasRef.current.loadFromJSON(snapshot, () => {
          canvasRef.current.renderAll();
          setHistoryIndex(nextIdx);
          syncSettingsFromCanvas(); // Sync sliders
          historyLocked.current = false;
      });
  };

  // Syncs React state sliders with actual Fabric filters after Undo/Redo
  const syncSettingsFromCanvas = () => {
      if (!canvasRef.current) return;
      const img = canvasRef.current.getObjects().find((o: any) => o.id === 'main-image');
      
      if (img) {
          const currentFilters = img.filters || [];
          const newSettings: AdjustSettings = {
              brightness: 0, contrast: 0, saturation: 0, blur: 0, noise: 0, pixelate: 0
          };
          
          currentFilters.forEach((f: any) => {
              // Fabric filter types usually capitalize
              if (f.type === 'Brightness') newSettings.brightness = f.brightness;
              if (f.type === 'Contrast') newSettings.contrast = f.contrast;
              if (f.type === 'Saturation') newSettings.saturation = f.saturation;
              if (f.type === 'Blur') newSettings.blur = f.blur;
              if (f.type === 'Noise') newSettings.noise = f.noise;
              if (f.type === 'Pixelate') newSettings.pixelate = f.blocksize / 10;
          });
          setAdjustSettings(newSettings);
      }
  };

  // --- Crop Logic ---
  const startCrop = () => {
      setActiveMode('crop');
      setSidebarPanel('crop');
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.discardActiveObject();
      const w = canvas.width * 0.6;
      const h = canvas.height * 0.6;

      const rect = new fabric.Rect({
          left: (canvas.width - w) / 2,
          top: (canvas.height - h) / 2,
          width: w,
          height: h,
          fill: 'rgba(0,0,0,0)',
          stroke: '#3b82f6', // blue-500
          strokeWidth: 2,
          strokeDashArray: [5, 5],
          cornerColor: '#3b82f6',
          cornerStrokeColor: '#ffffff',
          cornerStyle: 'circle',
          transparentCorners: false,
          hasRotatingPoint: false,
          lockRotation: true,
          id: 'crop-rect'
      });

      // Darken Overlay
      const overlay = new fabric.Rect({
          left: 0, top: 0, width: canvas.width, height: canvas.height,
          fill: 'rgba(0,0,0,0.5)',
          selectable: false, evented: false,
          id: 'crop-overlay'
      });
      
      canvas.add(overlay);
      canvas.add(rect);
      canvas.setActiveObject(rect);
      canvas.requestRenderAll();
  };

  const applyCrop = () => {
      const canvas = canvasRef.current;
      const rect = canvas.getObjects().find((o:any) => o.id === 'crop-rect');
      if (!rect) return;

      setLoading(true);
      setLoadingText("Cropping...");

      // Remove overlay for capture
      const overlay = canvas.getObjects().find((o:any) => o.id === 'crop-overlay');
      if(overlay) canvas.remove(overlay);
      rect.set({ strokeWidth: 0 }); // Hide border

      const dataUrl = canvas.toDataURL({
          left: rect.left,
          top: rect.top,
          width: rect.getScaledWidth(),
          height: rect.getScaledHeight(),
          format: 'png',
          multiplier: 1
      });

      // Reset
      fabric.Image.fromURL(dataUrl, (img: any) => {
          canvas.clear();
          canvas.setBackgroundColor('#111827', () => {});
          
          img.set({
              left: canvas.width / 2,
              top: canvas.height / 2,
              originX: 'center',
              originY: 'center',
              id: 'main-image'
          });
          
          // Fit to screen if too small
          if (img.width < canvas.width * 0.5) {
              img.scale(2);
          }

          canvas.add(img);
          canvas.setActiveObject(img);
          setActiveMode('move');
          setSidebarPanel('ai');
          setLoading(false);
          saveHistory();
      });
  };

  const cancelCrop = () => {
      const canvas = canvasRef.current;
      const rect = canvas.getObjects().find((o:any) => o.id === 'crop-rect');
      const overlay = canvas.getObjects().find((o:any) => o.id === 'crop-overlay');
      if (rect) canvas.remove(rect);
      if (overlay) canvas.remove(overlay);
      canvas.requestRenderAll();
      setActiveMode('move');
      setSidebarPanel('ai');
  };

  const setCropRatio = (ratio: number) => {
      const canvas = canvasRef.current;
      const rect = canvas.getObjects().find((o:any) => o.id === 'crop-rect');
      if (rect && ratio > 0) {
          const w = rect.getScaledWidth();
          const h = w / ratio;
          rect.set({ height: h, scaleY: 1 });
          canvas.requestRenderAll();
      }
      setCropAspectRatio(ratio);
  };

  // --- AI Features ---
  const handleMagicScan = async () => {
      setLoading(true);
      setLoadingText("AI is analyzing image...");
      try {
          const result = await photoEditorService.analyzeImage(canvasRef.current);
          setSuggestions(result);
      } catch (e) {
          alert("AI Analysis failed: " + (e as Error).message);
      } finally {
          setLoading(false);
      }
  };

  const handleAction = async (action: string) => {
      if (action === 'remove_bg') {
          const active = canvasRef.current.getActiveObject() || canvasRef.current.getObjects()[0];
          if (active) {
              setLoading(true);
              setLoadingText("Removing Background...");
              await photoEditorService.removeBackground(active);
              saveHistory();
              setLoading(false);
          }
      } else if (action === 'upscale') {
          setLoading(true);
          setLoadingText("Upscaling Image (2x)...");
          try {
              await photoEditorService.upscaleImage(canvasRef.current);
              saveHistory();
          } catch (e) {
              alert((e as Error).message);
          } finally {
              setLoading(false);
          }
      } else if (action === 'auto_enhance') {
          // Preset filters
          setAdjustSettings({ brightness: 0.05, contrast: 0.1, saturation: 0.1, blur: 0, noise: 0, pixelate: 0 });
          updateFilters({ brightness: 0.05, contrast: 0.1, saturation: 0.1, blur: 0, noise: 0, pixelate: 0 }, true);
      } else if (action.startsWith('prompt:')) {
          const prompt = action.split('prompt:')[1];
          setFillPrompt(prompt);
          // Auto trigger
          handleGenEdit(prompt);
      }
  };

  const handleGenEdit = async (promptOverride?: string) => {
      const p = promptOverride || fillPrompt;
      if (!p) return;
      setLoading(true);
      setLoadingText("Generating Edits...");
      try {
          await photoEditorService.generativeEdit(canvasRef.current, p);
          saveHistory();
          setFillPrompt('');
      } catch (e) {
          alert((e as Error).message);
      } finally {
          setLoading(false);
      }
  };

  // --- Adjustments ---
  const updateFilters = (settings: AdjustSettings, save: boolean = false) => {
      const active = canvasRef.current.getActiveObject() || canvasRef.current.getObjects().find((o:any) => o.id === 'main-image');
      if (active && active.type === 'image') {
          photoEditorService.applyFilters(active, settings);
          if (save) saveHistory();
      }
  };

  const handleAdjustChange = (key: keyof AdjustSettings, val: number) => {
      const newSettings = { ...adjustSettings, [key]: val };
      setAdjustSettings(newSettings);
      updateFilters(newSettings, false); // Don't save history on every drag event
  };

  const handleAdjustEnd = () => {
      saveHistory(); // Save history only when user releases slider
  };

  // --- Export ---
  const handleExport = () => {
      const url = canvasRef.current.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
      const a = document.createElement('a');
      a.href = url;
      a.download = `edited_photo_${Date.now()}.png`;
      a.click();
  };

  // --- Render ---
  if (uploadedFiles.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-[600px] bg-gray-900 text-white rounded-xl shadow-2xl">
              <div className="text-center space-y-6">
                  <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                      Photo Studio AI
                  </h1>
                  <p className="text-gray-400 text-lg">Professional Editing • Generative Fill • Upscaling</p>
                  <Button onClick={() => fileInputRef.current?.click()} className="px-8 py-3 text-lg rounded-full bg-white text-gray-900 hover:bg-gray-100 shadow-xl transition-transform hover:scale-105">
                      Open Image
                  </Button>
                  <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && onUpload(Array.from(e.target.files))} />
              </div>
          </div>
      );
  }

  return (
      <div className="flex h-[calc(100vh-64px)] bg-gray-900 text-white overflow-hidden font-sans">
          
          {/* Left Toolbar */}
          <div className="w-16 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-4 space-y-4 z-20">
              <ToolBtn icon="move" active={activeMode==='move'} onClick={() => { setActiveMode('move'); setSidebarPanel('ai'); }} tooltip="Move" />
              <ToolBtn icon="crop" active={activeMode==='crop'} onClick={startCrop} tooltip="Crop" />
              <div className="w-8 h-px bg-gray-700 my-2"></div>
              <ToolBtn icon="magic" active={sidebarPanel==='ai'} onClick={() => setSidebarPanel('ai')} tooltip="AI Tools" color="text-purple-400" />
              <ToolBtn icon="adjust" active={sidebarPanel==='adjust'} onClick={() => setSidebarPanel('adjust')} tooltip="Adjust" />
              <div className="flex-grow"></div>
              <ToolBtn icon="undo" onClick={undo} tooltip="Undo" disabled={historyIndex <= 0} />
              <ToolBtn icon="redo" onClick={redo} tooltip="Redo" disabled={historyIndex >= history.length - 1} />
          </div>

          {/* Main Canvas */}
          <div className="flex-1 relative bg-black/50 flex flex-col" ref={containerRef}>
              <div className="absolute top-4 right-4 z-30">
                  <Button onClick={handleExport} className="bg-blue-600 hover:bg-blue-500 text-white px-6 shadow-lg border border-blue-400/50">
                      Export
                  </Button>
              </div>
              <canvas id="photo-editor-canvas" className="block mx-auto my-auto shadow-2xl" />
              {loading && (
                  <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center">
                      <LoadingSpinner message={loadingText} />
                  </div>
              )}
          </div>

          {/* Right Sidebar */}
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col z-20 shadow-2xl">
              
              {sidebarPanel === 'crop' && (
                  <div className="p-6 space-y-6">
                      <h3 className="font-bold text-lg text-gray-200 border-b border-gray-700 pb-2">Crop & Rotate</h3>
                      
                      <div className="space-y-3">
                          <label className="text-xs font-bold text-gray-500 uppercase">Aspect Ratio</label>
                          <div className="grid grid-cols-3 gap-2">
                              <RatioBtn label="Free" ratio={0} active={cropAspectRatio===0} onClick={() => setCropAspectRatio(0)} />
                              <RatioBtn label="1:1" ratio={1} active={cropAspectRatio===1} onClick={() => setCropRatio(1)} />
                              <RatioBtn label="16:9" ratio={16/9} active={cropAspectRatio===16/9} onClick={() => setCropRatio(16/9)} />
                              <RatioBtn label="4:3" ratio={4/3} active={cropAspectRatio===4/3} onClick={() => setCropRatio(4/3)} />
                              <RatioBtn label="Portrait" ratio={9/16} active={cropAspectRatio===9/16} onClick={() => setCropRatio(9/16)} />
                          </div>
                      </div>

                      <div className="space-y-3">
                          <label className="text-xs font-bold text-gray-500 uppercase">Transform</label>
                          <div className="flex gap-2">
                              <button onClick={() => { const obj = canvasRef.current.getObjects('image')[0]; if(obj) { obj.rotate((obj.angle||0)-90); canvasRef.current.requestRenderAll(); } }} className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded text-xs">Rotate L</button>
                              <button onClick={() => { const obj = canvasRef.current.getObjects('image')[0]; if(obj) { obj.rotate((obj.angle||0)+90); canvasRef.current.requestRenderAll(); } }} className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded text-xs">Rotate R</button>
                          </div>
                      </div>

                      <div className="pt-4 flex gap-2">
                          <Button onClick={cancelCrop} variant="secondary" className="flex-1">Cancel</Button>
                          <Button onClick={applyCrop} className="flex-1 bg-blue-600">Apply</Button>
                      </div>
                  </div>
              )}

              {sidebarPanel === 'ai' && (
                  <div className="p-6 space-y-6 overflow-y-auto">
                      <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4">
                          <h3 className="font-bold text-purple-300 mb-2 flex items-center">
                              <Icon name="magic" size={4} className="mr-2"/> Magic Studio
                          </h3>
                          <div className="space-y-3">
                              <Button onClick={handleMagicScan} variant="outline" className="w-full border-purple-500/50 text-purple-200 hover:bg-purple-900/40">
                                  ✨ Magic Scan
                              </Button>
                              {suggestions.length > 0 && (
                                  <div className="grid grid-cols-1 gap-2 mt-2 animate-fade-in">
                                      {suggestions.map((s, i) => (
                                          <button key={i} onClick={() => handleAction(s.action)} className="text-left px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-gray-200 flex justify-between group">
                                              {s.label} <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                          </button>
                                      ))}
                                  </div>
                              )}
                          </div>
                      </div>

                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Generative Fill</label>
                          <textarea 
                              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-gray-200 focus:border-purple-500 outline-none h-24 resize-none"
                              placeholder="Describe change (e.g. 'Add a sunset')"
                              value={fillPrompt}
                              onChange={e => setFillPrompt(e.target.value)}
                          />
                          <Button onClick={() => handleGenEdit()} disabled={!fillPrompt} className="w-full mt-2 bg-purple-600 hover:bg-purple-500">
                              Generate
                          </Button>
                      </div>

                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Quick Tools</label>
                          <div className="grid grid-cols-2 gap-2">
                              <button onClick={() => handleAction('remove_bg')} className="bg-gray-700 hover:bg-gray-600 py-3 rounded text-xs font-bold text-gray-300">Remove BG</button>
                              <button onClick={() => handleAction('upscale')} className="bg-gray-700 hover:bg-gray-600 py-3 rounded text-xs font-bold text-gray-300">Upscale 2x</button>
                          </div>
                      </div>
                  </div>
              )}

              {sidebarPanel === 'adjust' && (
                  <div className="p-6 space-y-6 overflow-y-auto">
                      <h3 className="font-bold text-lg text-gray-200 border-b border-gray-700 pb-2">Adjustments</h3>
                      {[
                          { label: 'Brightness', key: 'brightness', min: -1, max: 1, step: 0.05 },
                          { label: 'Contrast', key: 'contrast', min: -1, max: 1, step: 0.05 },
                          { label: 'Saturation', key: 'saturation', min: -1, max: 1, step: 0.05 },
                          { label: 'Blur', key: 'blur', min: 0, max: 1, step: 0.05 },
                          { label: 'Noise', key: 'noise', min: 0, max: 100, step: 5 },
                      ].map((adj: any) => (
                          <div key={adj.key}>
                              <div className="flex justify-between mb-1">
                                  <label className="text-xs font-bold text-gray-500">{adj.label}</label>
                                  <span className="text-xs text-gray-400">{(adjustSettings as any)[adj.key]}</span>
                              </div>
                              <input 
                                  type="range" min={adj.min} max={adj.max} step={adj.step}
                                  value={(adjustSettings as any)[adj.key]}
                                  onChange={(e) => handleAdjustChange(adj.key, parseFloat(e.target.value))}
                                  onMouseUp={handleAdjustEnd}
                                  onTouchEnd={handleAdjustEnd}
                                  className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                              />
                          </div>
                      ))}
                      <Button onClick={() => {
                          setAdjustSettings({ brightness: 0, contrast: 0, saturation: 0, blur: 0, noise: 0, pixelate: 0 });
                          const active = canvasRef.current.getObjects()[0];
                          if(active) { active.filters = []; active.applyFilters(); canvasRef.current.requestRenderAll(); saveHistory(); }
                      }} variant="secondary" className="w-full mt-4">Reset All</Button>
                  </div>
              )}
          </div>
      </div>
  );
};

const ToolBtn = ({ icon, active, onClick, tooltip, color, disabled }: any) => (
    <button 
        onClick={onClick} 
        disabled={disabled}
        className={`p-3 rounded-xl transition-all group relative ${
            active ? 'bg-blue-600 text-white shadow-lg' : 
            disabled ? 'text-gray-600 cursor-not-allowed opacity-50' : 
            'text-gray-400 hover:bg-gray-700 hover:text-white'
        }`}
    >
        <div className={color}><Icon name={icon} size={6} /></div>
        {!disabled && <span className="absolute left-14 top-1/2 -translate-y-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">{tooltip}</span>}
    </button>
);

const RatioBtn = ({ label, active, onClick }: any) => (
    <button onClick={onClick} className={`text-xs py-2 rounded border ${active ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700'}`}>
        {label}
    </button>
);

export default PhotoEditorTool;
