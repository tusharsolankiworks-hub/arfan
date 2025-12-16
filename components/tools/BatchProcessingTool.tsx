



import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AppFile, ProcessedFile } from '../../types';
import Dropzone from '../Dropzone';
import Button from '../Button';
import LoadingSpinner from '../LoadingSpinner';
import { pdfService } from '../../services/pdfService';
import { imageService } from '../../services/imageService';
import { watermarkService } from '../../services/watermarkService';
import { pdfToWordService } from '../../services/pdfToWordService';
import { wordService } from '../../services/wordService';
import { htmlToPdfService } from '../../services/htmlToPdfService';
import { repairService } from '../../services/repairService';
import { securityService } from '../../services/securityService';
import JSZip from 'jszip';

interface BatchProcessingToolProps {
  onUpload: (files: File[]) => void;
  uploadedFiles: AppFile[];
  onRemoveFile: (id: string) => void;
}

type BatchOperation = 'compress_pdf' | 'pdf_to_word' | 'word_to_pdf' | 'pdf_to_image' | 'image_to_pdf' | 'watermark_pdf' | 'repair_pdf' | 'unlock_pdf';

interface FileStatus {
  fileId: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  message?: string;
  result?: ProcessedFile;
}

const BatchProcessingTool: React.FC<BatchProcessingToolProps> = ({ onUpload, uploadedFiles, onRemoveFile }) => {
  // Load initial operation from localStorage or default
  const [operation, setOperation] = useState<BatchOperation>(() => {
    return (localStorage.getItem('batch_last_operation') as BatchOperation) || 'compress_pdf';
  });
  
  const [statuses, setStatuses] = useState<Record<string, FileStatus>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Settings for specific tools
  const [compressionLevel, setCompressionLevel] = useState(75);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkColor, setWatermarkColor] = useState('#FF0000');
  const [watermarkOpacity, setWatermarkOpacity] = useState(30);
  const [unlockPassword, setUnlockPassword] = useState('');

  // Hidden input ref for adding files
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save operation to localStorage when changed
  useEffect(() => {
    localStorage.setItem('batch_last_operation', operation);
  }, [operation]);

  // Handle file status init
  useEffect(() => {
    const newStatuses: Record<string, FileStatus> = { ...statuses };
    uploadedFiles.forEach(f => {
      if (!newStatuses[f.id]) {
        newStatuses[f.id] = { fileId: f.id, status: 'pending' };
      }
    });
    setStatuses(newStatuses);
  }, [uploadedFiles]);

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(Array.from(e.target.files));
    }
    // Reset input to allow selecting the same file again if needed
    e.target.value = '';
  };

  const runBatch = async () => {
    setIsProcessing(true);
    setProgress(0);
    const filesToProcess = uploadedFiles.filter(f => statuses[f.id]?.status !== 'success');
    const total = filesToProcess.length;
    let completed = 0;

    for (const file of filesToProcess) {
       // Update status to processing
       setStatuses(prev => ({ ...prev, [file.id]: { fileId: file.id, status: 'processing' } }));

       try {
           let result: ProcessedFile | null = null;
           
           // PROCESS LOGIC
           switch(operation) {
               case 'compress_pdf':
                   if (file.type !== 'application/pdf') throw new Error("Not a PDF");
                   result = await pdfService.compressPdf(file, compressionLevel);
                   break;
               case 'pdf_to_word':
                   if (file.type !== 'application/pdf') throw new Error("Not a PDF");
                   const text = await pdfToWordService.extractText(file);
                   result = await pdfToWordService.generateDocx(text, file.name);
                   break;
               case 'word_to_pdf':
                    if (!file.name.endsWith('.docx') && file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                        throw new Error("Not a DOCX");
                    }
                    const htmlContent = await wordService.convertToHtml(file);
                    const container = document.createElement('div');
                    container.innerHTML = htmlContent;
                    container.style.width = '210mm'; 
                    container.style.padding = '20mm';
                    container.style.backgroundColor = 'white';
                    container.style.color = 'black';
                    container.style.position = 'fixed';
                    container.style.top = '-9999px';
                    container.style.left = '-9999px';
                    document.body.appendChild(container);

                    try {
                        const opts = {
                            margin: 10,
                            filename: file.name.replace('.docx', '.pdf'),
                            image: { type: 'jpeg', quality: 0.98 },
                            html2canvas: { scale: 2, useCORS: true },
                            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
                        };
                        result = await htmlToPdfService.convertHtmlToPdf(container, opts as any);
                    } finally {
                        document.body.removeChild(container);
                    }
                    break;
               case 'pdf_to_image':
                    if (file.type !== 'application/pdf') throw new Error("Not a PDF");
                    const images = await pdfService.pdfToImages(file);
                    if (images.length > 0) {
                        if(images.length === 1) {
                            result = images[0];
                        } else {
                            const zip = new JSZip();
                            images.forEach(img => zip.file(img.name, img.dataUrl.split(',')[1], {base64:true}));
                            const zipContent = await zip.generateAsync({type:'blob'});
                            const dataUrl = await new Promise<string>(r => { const fr = new FileReader(); fr.onload=()=>r(fr.result as string); fr.readAsDataURL(zipContent); });
                            result = {
                                id: crypto.randomUUID(), name: `${file.name}.zip`, mimeType: 'application/zip', size: zipContent.size, dataUrl
                            };
                        }
                    } else { throw new Error("No pages found"); }
                    break;
               case 'image_to_pdf':
                    if (!file.type.startsWith('image/')) throw new Error("Not an Image");
                    result = await imageService.imagesToPdf([file]);
                    break;
               case 'watermark_pdf':
                    if (file.type !== 'application/pdf') throw new Error("Not a PDF");
                    result = await watermarkService.addTextWatermark(file, {
                        text: watermarkText, 
                        fontSize: 48, 
                        opacity: watermarkOpacity, 
                        rotation: 45, 
                        color: watermarkColor, 
                        isTiled: true, 
                        position: {x:50, y:50}
                    });
                    break;
               case 'repair_pdf':
                    if (file.type !== 'application/pdf') throw new Error("Not a PDF");
                    const repairRes = await repairService.repairPdf(file);
                    result = repairRes.file;
                    break;
               case 'unlock_pdf':
                    if (file.type !== 'application/pdf') throw new Error("Not a PDF");
                    result = await securityService.unlockPdf(file, unlockPassword);
                    break;
           }

           if (result) {
               setStatuses(prev => ({ ...prev, [file.id]: { fileId: file.id, status: 'success', result: result! } }));
           } else {
               throw new Error("No result generated");
           }

       } catch (error) {
           console.error(`Batch processing error for ${file.name}:`, error);
           setStatuses(prev => ({ ...prev, [file.id]: { fileId: file.id, status: 'error', message: (error as Error).message } }));
       }
       
       completed++;
       setProgress(Math.round((completed / total) * 100));
    }
    
    setIsProcessing(false);
  };

  const downloadAllZip = async () => {
     const zip = new JSZip();
     let count = 0;
     Object.values(statuses).forEach((s: FileStatus) => {
         if (s.status === 'success' && s.result) {
             const base64 = s.result.dataUrl.split(',')[1];
             zip.file(s.result.name, base64, { base64: true });
             count++;
         }
     });
     
     if (count === 0) return;
     
     const content = await zip.generateAsync({ type: 'blob' });
     const url = URL.createObjectURL(content);
     const link = document.createElement('a');
     link.href = url;
     link.download = `batch_result_${new Date().getTime()}.zip`;
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
     URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md max-w-6xl mx-auto min-h-[600px] flex flex-col">
       <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
           <div>
               <h2 className="text-3xl font-bold text-gray-800 flex items-center">
                   <span className="bg-gray-800 text-white p-2 rounded mr-3"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></span>
                   Batch Processing
               </h2>
               <p className="text-gray-500 mt-1">Automate tasks for up to 20 files at once.</p>
           </div>
           
           {/* Tool Selector */}
           <div className="flex items-center space-x-3 bg-gray-50 p-2 rounded-lg border border-gray-200">
               <label className="font-bold text-gray-700 whitespace-nowrap">Select Tool:</label>
               <select 
                  value={operation} 
                  onChange={(e) => setOperation(e.target.value as BatchOperation)}
                  className="bg-white border border-blue-300 text-blue-800 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block p-2.5 font-bold"
               >
                   <option value="compress_pdf">Compress PDF</option>
                   <option value="watermark_pdf">Watermark PDF</option>
                   <option value="unlock_pdf">Unlock PDF</option>
                   <option value="word_to_pdf">Word to PDF</option>
                   <option value="pdf_to_word">PDF to Word</option>
                   <option value="image_to_pdf">Image to PDF</option>
                   <option value="pdf_to_image">PDF to Image</option>
                   <option value="repair_pdf">Repair PDF</option>
               </select>
           </div>
       </div>

       {/* Settings Bar based on tool */}
       <div className="bg-blue-50 border border-blue-100 rounded-lg p-5 mb-6 transition-all duration-300">
           <div className="flex flex-col md:flex-row md:items-center gap-6">
               <div className="shrink-0 font-bold text-blue-900 uppercase text-xs tracking-wider border-r border-blue-200 pr-6 mr-2 hidden md:block">
                   Settings
               </div>
               
               <div className="flex-grow">
                   {operation === 'compress_pdf' && (
                       <div className="flex items-center gap-4">
                           <label className="text-sm font-semibold text-blue-800">Compression Strength: {compressionLevel}%</label>
                           <input type="range" min="0" max="100" value={compressionLevel} onChange={e => setCompressionLevel(parseInt(e.target.value))} className="w-full max-w-xs h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"/>
                       </div>
                   )}
                   {operation === 'watermark_pdf' && (
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <div>
                               <label className="text-xs font-bold text-blue-800 uppercase block mb-1">Text</label>
                               <input type="text" value={watermarkText} onChange={e => setWatermarkText(e.target.value)} className="border border-blue-200 rounded p-2 w-full text-sm focus:ring-2 focus:ring-blue-400 outline-none"/>
                           </div>
                           <div>
                               <label className="text-xs font-bold text-blue-800 uppercase block mb-1">Color</label>
                               <div className="flex items-center gap-2">
                                   <input type="color" value={watermarkColor} onChange={e => setWatermarkColor(e.target.value)} className="h-9 w-12 cursor-pointer border border-gray-300 rounded"/>
                                   <span className="text-xs text-gray-500">{watermarkColor}</span>
                               </div>
                           </div>
                           <div>
                               <label className="text-xs font-bold text-blue-800 uppercase block mb-1">Opacity: {watermarkOpacity}%</label>
                               <input type="range" min="10" max="100" value={watermarkOpacity} onChange={e => setWatermarkOpacity(parseInt(e.target.value))} className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-2"/>
                           </div>
                       </div>
                   )}
                   {operation === 'unlock_pdf' && (
                       <div>
                           <label className="text-xs font-bold text-blue-800 uppercase block mb-1">PDF Password</label>
                           <input type="password" value={unlockPassword} onChange={e => setUnlockPassword(e.target.value)} placeholder="Password to open files" className="border border-blue-200 rounded p-2 w-full max-w-xs text-sm focus:ring-2 focus:ring-blue-400 outline-none"/>
                           <p className="text-xs text-blue-600 mt-1">If files have different passwords, process them individually.</p>
                       </div>
                   )}
                   {['pdf_to_word', 'word_to_pdf', 'image_to_pdf', 'pdf_to_image', 'repair_pdf'].includes(operation) && (
                       <div className="text-blue-700 text-sm font-medium flex items-center">
                           <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                           Standard configuration will be applied for best compatibility.
                       </div>
                   )}
               </div>
           </div>
       </div>

       {uploadedFiles.length === 0 ? (
           <div className="flex-grow flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
               <Dropzone onFilesSelected={onUpload} multiple={true} label="Drag & Drop multiple files here (Max 20)" />
           </div>
       ) : (
           <div className="flex-grow flex flex-col">
               {/* Progress Bar */}
               {isProcessing && (
                   <div className="w-full bg-gray-100 rounded-full h-4 mb-6 overflow-hidden relative shadow-inner">
                       <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-4 rounded-full transition-all duration-300 relative" style={{ width: `${progress}%` }}>
                           <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
                       </div>
                       <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-600 mix-blend-multiply">{progress}%</span>
                   </div>
               )}

               {/* File Table */}
               <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white">
                   <table className="w-full text-sm text-left text-gray-500">
                       <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                           <tr>
                               <th className="px-6 py-4 w-1/3">File Name</th>
                               <th className="px-6 py-4 w-1/6">Size</th>
                               <th className="px-6 py-4 w-1/4">Status</th>
                               <th className="px-6 py-4 w-1/4 text-right">Action</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                           {uploadedFiles.map(file => {
                               const status = statuses[file.id] || { status: 'pending' };
                               return (
                                   <tr key={file.id} className="hover:bg-gray-50 transition-colors">
                                       <td className="px-6 py-4 font-medium text-gray-900 truncate max-w-xs">
                                           <div className="flex items-center">
                                               <span className="w-8 h-8 rounded bg-gray-100 text-gray-500 flex items-center justify-center mr-3 text-xs font-bold uppercase">
                                                   {file.name.split('.').pop()}
                                               </span>
                                               <span className="truncate">{file.name}</span>
                                           </div>
                                       </td>
                                       <td className="px-6 py-4">{(file.size / 1024).toFixed(0)} KB</td>
                                       <td className="px-6 py-4">
                                           {status.status === 'pending' && <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-full">Ready</span>}
                                           {status.status === 'processing' && (
                                               <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center w-fit">
                                                   <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-blue-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                   Processing
                                               </span>
                                           )}
                                           {status.status === 'success' && <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">Completed</span>}
                                           {status.status === 'error' && <span className="bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full cursor-help" title={status.message}>Error</span>}
                                       </td>
                                       <td className="px-6 py-4 text-right">
                                           {status.status === 'success' && status.result ? (
                                               <button onClick={() => { const l = document.createElement('a'); l.href=status.result!.dataUrl; l.download=status.result!.name; l.click(); }} className="text-blue-600 hover:text-blue-800 font-bold text-xs bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded transition-colors">
                                                   Download
                                               </button>
                                           ) : (
                                               <button onClick={() => onRemoveFile(file.id)} className="text-gray-400 hover:text-red-500 transition-colors" title="Remove File">
                                                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                               </button>
                                           )}
                                       </td>
                                   </tr>
                               );
                           })}
                       </tbody>
                   </table>
               </div>
               
               {/* Footer Actions */}
               <div className="mt-6 flex flex-col sm:flex-row justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200 gap-4">
                   <div className="text-sm text-gray-500 font-medium">
                       {uploadedFiles.filter(f => statuses[f.id]?.status === 'success').length} of {uploadedFiles.length} processed
                   </div>
                   <div className="flex space-x-3 w-full sm:w-auto">
                       {/* Input hidden */}
                       <input 
                           type="file" 
                           multiple 
                           ref={fileInputRef} 
                           className="hidden" 
                           onChange={handleAddFiles} 
                       />
                       <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1 sm:flex-none justify-center">Add Files</Button>
                       
                       <Button 
                            onClick={runBatch} 
                            disabled={isProcessing || uploadedFiles.length === 0} 
                            className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none w-auto sm:w-40 justify-center"
                            loading={isProcessing}
                        >
                            Start Batch
                        </Button>
                        {uploadedFiles.some(f => statuses[f.id]?.status === 'success') && (
                            <Button onClick={downloadAllZip} className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none justify-center shadow-md">
                                Download ZIP
                            </Button>
                        )}
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};

export default BatchProcessingTool;