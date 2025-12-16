
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppFile } from '../../types';
import Button from '../Button';
import LoadingSpinner from '../LoadingSpinner';
import { arrayBufferToDataURL } from '../../utils/fileUtils';

// Access Fabric from global window object
declare const fabric: any;

interface ImageMergeToolProps {
  onUpload: (files: File[]) => void;
  uploadedFiles: AppFile[]; 
  onRemoveFile: (id: string) => void;
  onReorderFiles: (newOrder: AppFile[]) => void;
}

const Icons = {
  RotateCw: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  FlipH: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 4 17 4 17"/><path d="M4 12V7a5 5 0 0 1 10 0v5"/><path d="M4 17h16"/><path d="M20 17v-5a5 5 0 0 0-10 0v5"/></svg>,
  Camera: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Trash: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  ZoomIn: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>,
  ZoomOut: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>,
  Check: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>,
  Close: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Magic: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19.5 9.5l-2.5-2.5 2.5-2.5 2.5 2.5-2.5 2.5z"/><path d="M15.5 13.5l-2.5-2.5 2.5-2.5 2.5 2.5-2.5 2.5z"/><path d="M4 20h12l-5-5-3 3-4-4v6z"/></svg>
};

const ImageMergeTool: React.FC<ImageMergeToolProps> = () => {
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergeDirection, setMergeDirection] = useState<'horizontal' | 'vertical'>('horizontal');
  const [outputFormat, setOutputFormat] = useState('jpeg');
  const [quality, setQuality] = useState(80);
  const [showResult, setShowResult] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [estimatedSize, setEstimatedSize] = useState<string | null>(null);

  // Canvas Refs
  const frontCanvasRef = useRef<any>(null);
  const backCanvasRef = useRef<any>(null);
  const frontContainerRef = useRef<HTMLDivElement>(null);
  const backContainerRef = useRef<HTMLDivElement>(null);

  // Crop State
  const [croppingTarget, setCroppingTarget] = useState<'front' | 'back' | null>(null);

  // --- Initialization ---

  const initCanvas = useCallback((canvasId: string, file: File, ref: React.MutableRefObject<any>) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const imgObj = new Image();
      imgObj.src = e.target?.result as string;
      imgObj.onload = () => {
        if (ref.current) {
          ref.current.dispose();
        }

        const canvas = new fabric.Canvas(canvasId, {
          backgroundColor: '#ffffff',
          preserveObjectStacking: true,
          selection: false
        });
        
        const containerWidth = document.getElementById(canvasId)?.parentElement?.clientWidth || 300;
        const scale = Math.min(containerWidth / imgObj.width, 1);
        
        canvas.setWidth(imgObj.width * scale);
        canvas.setHeight(imgObj.height * scale);

        const fImg = new fabric.Image(imgObj, {
          selectable: false,
          evented: false,
          left: 0, 
          top: 0,
          scaleX: scale,
          scaleY: scale
        });

        canvas.add(fImg);
        canvas.centerObject(fImg);
        canvas.renderAll();
        
        canvas.originalWidth = imgObj.width;
        canvas.originalHeight = imgObj.height;
        
        ref.current = canvas;
      }
    };
    reader.readAsDataURL(file);
  }, []);

  useEffect(() => {
    if (frontFile) setTimeout(() => initCanvas('front-canvas', frontFile, frontCanvasRef), 100);
    if (backFile) setTimeout(() => initCanvas('back-canvas', backFile, backCanvasRef), 100);
  }, [frontFile, backFile, initCanvas]);


  // --- Actions ---

  const rotate = (target: 'front' | 'back', angle: number) => {
    const canvas = target === 'front' ? frontCanvasRef.current : backCanvasRef.current;
    if (!canvas) return;
    const img = canvas.getObjects('image')[0];
    if (img) {
      let curAngle = img.angle || 0;
      img.rotate((curAngle + angle) % 360);
      if (angle % 180 !== 0) {
         // Adjust scale if needed to fit? Or let user handle it.
      }
      canvas.centerObject(img);
      canvas.renderAll();
    }
  };

  const flip = (target: 'front' | 'back', axis: 'X' | 'Y') => {
    const canvas = target === 'front' ? frontCanvasRef.current : backCanvasRef.current;
    if (!canvas) return;
    const img = canvas.getObjects('image')[0];
    if (img) {
      if (axis === 'X') img.set('flipX', !img.flipX);
      if (axis === 'Y') img.set('flipY', !img.flipY);
      canvas.renderAll();
    }
  };

  const startCrop = (target: 'front' | 'back') => {
    if (croppingTarget === target) {
        cancelCrop(target);
        return;
    }
    if (croppingTarget) cancelCrop(croppingTarget);
    
    setCroppingTarget(target);
    const canvas = target === 'front' ? frontCanvasRef.current : backCanvasRef.current;
    if (!canvas) return;
    
    const width = canvas.width * 0.8;
    const height = canvas.height * 0.8;
    
    const cropRect = new fabric.Rect({
        left: (canvas.width - width) / 2,
        top: (canvas.height - height) / 2,
        width: width,
        height: height,
        fill: 'rgba(0,0,0,0.3)',
        stroke: '#2563eb',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        cornerColor: '#2563eb',
        cornerStrokeColor: '#ffffff',
        cornerStyle: 'circle',
        transparentCorners: false,
        hasRotatingPoint: false,
        lockRotation: true,
        id: 'crop-rect'
    });
    
    canvas.add(cropRect);
    canvas.setActiveObject(cropRect);
    canvas.renderAll();
  };

  const applyCrop = (target: 'front' | 'back') => {
    const canvas = target === 'front' ? frontCanvasRef.current : backCanvasRef.current;
    if (!canvas) return;
    
    const cropRect = canvas.getObjects().find((o:any) => o.id === 'crop-rect');
    const img = canvas.getObjects('image')[0];
    
    if (cropRect && img) {
        const cropX = cropRect.left;
        const cropY = cropRect.top;
        const cropW = cropRect.getScaledWidth();
        const cropH = cropRect.getScaledHeight();
        
        const dataUrl = canvas.toDataURL({
            left: cropX,
            top: cropY,
            width: cropW,
            height: cropH,
            format: 'png'
        });
        
        const newImgObj = new Image();
        newImgObj.src = dataUrl;
        newImgObj.onload = () => {
             canvas.remove(cropRect);
             canvas.remove(img);
             
             const containerW = (target === 'front' ? frontContainerRef.current : backContainerRef.current)?.clientWidth || 300;
             const scale = Math.min(containerW / newImgObj.width, 1);
             
             canvas.setWidth(newImgObj.width * scale);
             canvas.setHeight(newImgObj.height * scale);
             
             const fImg = new fabric.Image(newImgObj, {
                selectable: false,
                evented: false,
                scaleX: scale,
                scaleY: scale,
             });
             
             canvas.add(fImg);
             canvas.centerObject(fImg);
             canvas.renderAll();
             setCroppingTarget(null);
        };
    } else {
        setCroppingTarget(null);
    }
  };

  const cancelCrop = (target: 'front' | 'back') => {
    const canvas = target === 'front' ? frontCanvasRef.current : backCanvasRef.current;
    if (!canvas) return;
    const cropRect = canvas.getObjects().find((o:any) => o.id === 'crop-rect');
    if (cropRect) canvas.remove(cropRect);
    canvas.renderAll();
    setCroppingTarget(null);
  };

  const deleteImage = (target: 'front' | 'back') => {
     if (target === 'front') {
         setFrontFile(null);
         if (frontCanvasRef.current) {
             frontCanvasRef.current.dispose();
             frontCanvasRef.current = null;
         }
     } else {
         setBackFile(null);
         if (backCanvasRef.current) {
             backCanvasRef.current.dispose();
             backCanvasRef.current = null;
         }
     }
  };

  const handleMerge = async () => {
      if (!frontCanvasRef.current || !backCanvasRef.current) return;
      setIsProcessing(true);
      
      try {
          const c1 = frontCanvasRef.current;
          const c2 = backCanvasRef.current;
          
          // Use current visual state from canvas
          const mult = 2; // Export at 2x screen resolution for better quality
          
          const u1 = c1.toDataURL({ format: 'png', multiplier: mult });
          const u2 = c2.toDataURL({ format: 'png', multiplier: mult });
          
          const i1 = await new Promise<HTMLImageElement>(r => { const i = new Image(); i.onload=()=>r(i); i.src=u1; });
          const i2 = await new Promise<HTMLImageElement>(r => { const i = new Image(); i.onload=()=>r(i); i.src=u2; });
          
          const gap = 20;
          let w, h, x1, y1, x2, y2;
          
          if (mergeDirection === 'horizontal') {
              w = i1.width + i2.width + gap;
              h = Math.max(i1.height, i2.height);
              x1 = 0; y1 = (h - i1.height) / 2;
              x2 = i1.width + gap; y2 = (h - i2.height) / 2;
          } else {
              w = Math.max(i1.width, i2.width);
              h = i1.height + i2.height + gap;
              x1 = (w - i1.width) / 2; y1 = 0;
              x2 = (w - i2.width) / 2; y2 = i1.height + gap;
          }
          
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error("Context failed");
          
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(i1, x1, y1);
          ctx.drawImage(i2, x2, y2);
          
          if (outputFormat === 'pdf') {
              const { PDFDocument } = await import('pdf-lib');
              const imgData = canvas.toDataURL('image/jpeg', quality / 100);
              const pdfDoc = await PDFDocument.create();
              const image = await pdfDoc.embedJpg(imgData);
              const page = pdfDoc.addPage([image.width, image.height]);
              page.drawImage(image, {
                  x: 0,
                  y: 0,
                  width: image.width,
                  height: image.height,
              });
              const pdfBytes = await pdfDoc.save();
              const pdfDataUrl = arrayBufferToDataURL(pdfBytes.buffer, 'application/pdf');
              setResultUrl(pdfDataUrl);
              setEstimatedSize((pdfBytes.byteLength / 1024).toFixed(0) + ' KB');
          } else {
              const result = canvas.toDataURL(`image/${outputFormat}`, quality / 100);
              setResultUrl(result);
              
              const head = `data:image/${outputFormat};base64,`;
              const size = Math.round((result.length - head.length) * 3 / 4);
              setEstimatedSize((size / 1024).toFixed(0) + ' KB');
          }
          
          setShowResult(true);
      } catch (e) {
          console.error(e);
      } finally {
          setIsProcessing(false);
      }
  };

  const handleDownload = () => {
      if (resultUrl) {
          const a = document.createElement('a');
          a.href = resultUrl;
          a.download = `merged_${Date.now()}.${outputFormat}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
      }
  };

  const renderImageSection = (file: File | null, target: 'front' | 'back', setFile: (f: File) => void, containerRef: any) => (
      <div className="flex flex-col flex-1 min-w-[300px]" ref={containerRef}>
          <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-gray-700 uppercase text-xs tracking-wider">{target} Image</h3>
              {file && (
                  <div className="flex gap-1">
                      {croppingTarget === target ? (
                          <>
                              <button onClick={() => applyCrop(target)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Apply Crop"><Icons.Check /></button>
                              <button onClick={() => cancelCrop(target)} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Cancel Crop"><Icons.Close /></button>
                          </>
                      ) : (
                          <>
                              <button onClick={() => rotate(target, -90)} className="p-1 text-gray-500 hover:bg-gray-100 rounded" title="Rotate"><Icons.RotateCw /></button>
                              <button onClick={() => flip(target, 'X')} className="p-1 text-gray-500 hover:bg-gray-100 rounded" title="Flip"><Icons.FlipH /></button>
                              <button onClick={() => startCrop(target)} className="p-1 text-blue-500 hover:bg-blue-50 rounded" title="Crop"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"/></svg></button>
                              <button onClick={() => deleteImage(target)} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Delete"><Icons.Trash /></button>
                          </>
                      )}
                  </div>
              )}
          </div>
          
          <div className="flex-grow bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 relative overflow-hidden flex items-center justify-center min-h-[300px]">
              {!file ? (
                  <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full hover:bg-gray-50 transition-colors">
                      <div className="bg-blue-100 p-3 rounded-full text-blue-600 mb-2"><Icons.Camera /></div>
                      <span className="text-sm font-medium text-gray-500">Upload Image</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && setFile(e.target.files[0])} />
                  </label>
              ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white">
                      <canvas id={`${target}-canvas`} />
                  </div>
              )}
          </div>
      </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 animate-fade-in bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl font-black text-gray-800 mb-2 text-center">Merge Images</h1>
        <p className="text-gray-500 text-center mb-8">Combine two images side-by-side or stacked. Perfect for ID cards, comparisons, or collages.</p>

        {showResult && resultUrl ? (
            <div className="flex flex-col items-center">
                <div className="bg-gray-100 p-2 rounded border border-gray-200 shadow-sm max-w-full overflow-auto">
                    {outputFormat === 'pdf' ? (
                        <iframe src={resultUrl} className="w-full h-[70vh] border-none" title="PDF Preview"></iframe>
                    ) : (
                        <img src={resultUrl} alt="Merged Result" className="max-h-[70vh] object-contain" />
                    )}
                </div>
                <div className="flex items-center gap-4 mt-6">
                    <div className="text-sm text-gray-600">
                        Size: <span className="font-bold text-gray-900">{estimatedSize}</span>
                    </div>
                    <Button onClick={() => setShowResult(false)} variant="secondary">Back</Button>
                    <Button onClick={handleDownload} className="bg-green-600 hover:bg-green-700 shadow-md">Download</Button>
                </div>
            </div>
        ) : (
            <>
                <div className="flex flex-col lg:flex-row gap-8 mb-8">
                    {renderImageSection(frontFile, 'front', setFrontFile, frontContainerRef)}
                    
                    {/* Center Controls */}
                    <div className="flex flex-row lg:flex-col items-center justify-center gap-4 py-4 lg:py-0">
                       <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex lg:flex-col gap-2">
                           <button 
                                onClick={() => setMergeDirection('horizontal')}
                                className={`p-2 rounded ${mergeDirection === 'horizontal' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:bg-gray-200'}`}
                                title="Horizontal Merge"
                           >
                               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="9" height="14" rx="1"/><rect x="13" y="5" width="9" height="14" rx="1"/></svg>
                           </button>
                           <button 
                                onClick={() => setMergeDirection('vertical')}
                                className={`p-2 rounded ${mergeDirection === 'vertical' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:bg-gray-200'}`}
                                title="Vertical Merge"
                           >
                               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="9" rx="1"/><rect x="5" y="13" width="14" height="9" rx="1"/></svg>
                           </button>
                       </div>
                    </div>

                    {renderImageSection(backFile, 'back', setBackFile, backContainerRef)}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Format</label>
                            <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} className="bg-white border border-gray-300 text-gray-700 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block p-2">
                                <option value="jpeg">JPG</option>
                                <option value="png">PNG</option>
                                <option value="pdf">PDF</option>
                            </select>
                        </div>
                        {outputFormat !== 'png' && (
                            <div className="w-32">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quality: {quality}%</label>
                                <input type="range" min="10" max="100" value={quality} onChange={(e) => setQuality(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                            </div>
                        )}
                    </div>

                    <Button 
                        onClick={handleMerge} 
                        disabled={!frontFile || !backFile || isProcessing} 
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 shadow-lg"
                        loading={isProcessing}
                    >
                        Merge Images
                    </Button>
                </div>
            </>
        )}
    </div>
  );
};

export default ImageMergeTool;
