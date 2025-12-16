
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppFile } from '../../types';
import Button from '../Button';
import LoadingSpinner from '../LoadingSpinner';
import Dropzone from '../Dropzone';
import { pdfEditorService, TextItem } from '../../services/pdfEditorService';
import { pdfService, getPdfJs } from '../../services/pdfService';
import QRCode from 'qrcode';

// Access Fabric from window
declare const fabric: any;

interface PdfEditorToolProps {
  onUpload: (files: File[]) => void;
  uploadedFiles: AppFile[];
  onRemoveFile: (id: string) => void;
}

// --- Icons ---
const Icon = ({ name, size = 5, className = "" }: { name: string, size?: number, className?: string }) => {
    const s = `w-${size} h-${size} ${className}`;
    switch (name) {
        case 'undo': return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/></svg>;
        case 'redo': return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 1.7"/></svg>;
        case 'text': return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>;
        case 'link': return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
        case 'whiteout': return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M14 3v18"/></svg>;
        case 'image': return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
        case 'signature': return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2"><path d="M16 8a6 6 0 0 1 6 6v7h-14a2 2 0 0 1-2-2v-3.5"/><path d="M2 17.5c2 0 3-3 3-3s.5-3 3-3 2 4 4 4 2-5 3-5 3 5 3 5"/></svg>;
        case 'annotate': return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
        case 'find': return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="#d946ef" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
        case 'trash': return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
        case 'close': return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
        case 'bold': return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>;
        case 'italic': return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>;
        case 'underline': return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>;
        case 'stamp': return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><path d="M16 3a2 2 0 0 1 2 2v2h-4V5a2 2 0 0 1 2-2z" /><path d="M20 7H4a2 2 0 0 0-2 2v2h20V9a2 2 0 0 0-2-2z" /><path d="M4 11h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8z" /></svg>;
        case 'qr': return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="#18181b" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>;
        default: return null;
    }
};

const ToolbarButton = ({ label, icon, onClick, active }: any) => (
    <button 
        onClick={onClick}
        className={`
            group flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-[70px]
            ${active 
                ? 'bg-blue-50 text-blue-600 border border-blue-100 shadow-inner' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }
        `}
    >
        <div className={`mb-1.5 transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</div>
        <span className="text-[10px] font-bold tracking-wide uppercase">{label}</span>
    </button>
);

const SIGNATURE_FONTS = [
    { name: 'Dancing Script', label: 'Dancing Script' },
    { name: 'Great Vibes', label: 'Great Vibes' },
    { name: 'Sacramento', label: 'Sacramento' },
    { name: 'Allura', label: 'Allura' },
    { name: 'Homemade Apple', label: 'Homemade' },
];

const STAMP_COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#6b7280', '#8b5cf6', '#f97316', '#000000'];

interface SignatureItem {
    id: string;
    src: string;
    type: 'type' | 'draw' | 'upload';
}

interface HistoryState {
    pageIndex: number;
    json: string;
}

const PdfEditorTool: React.FC<PdfEditorToolProps> = ({ onUpload, uploadedFiles, onRemoveFile }) => {
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState<{id: number, loaded: boolean}[]>([]);
  const [activeTool, setActiveTool] = useState('select'); 
  
  // Undo/Redo
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryState[]>([]);
  
  // Floating Text Toolbar
  const [showFloatingBar, setShowFloatingBar] = useState(false);
  const [floatingBarPos, setFloatingBarPos] = useState({ top: 0, left: 0 });
  const [selectedTextObj, setSelectedTextObj] = useState<any>(null);
  const [fontSize, setFontSize] = useState(12);
  const [fontFamily, setFontFamily] = useState('Helvetica');
  const [fontColor, setFontColor] = useState('#000000');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  // Sign Modal
  const [showSignModal, setShowSignModal] = useState(false);
  const [signTab, setSignTab] = useState<'type' | 'draw' | 'upload'>('type');
  const [typedName, setTypedName] = useState('John Doe');
  const [selectedSigFont, setSelectedSigFont] = useState('Dancing Script');
  const [sigColor, setSigColor] = useState('#000000');
  const [uploadedSigImg, setUploadedSigImg] = useState<string | null>(null);
  const [sigProcessedUrls, setSigProcessedUrls] = useState<{original: string, transparent: string, light: string} | null>(null);
  const [selectedSigType, setSelectedSigType] = useState<'original' | 'transparent' | 'light'>('transparent');
  const [savedSignatures, setSavedSignatures] = useState<SignatureItem[]>([]);

  // Stamp Modal (Enhanced)
  const [showStampModal, setShowStampModal] = useState(false);
  const [stampSubject, setStampSubject] = useState('Approved');
  const [stampAuthor, setStampAuthor] = useState('John Doe');
  const [stampDate, setStampDate] = useState(new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
  const [stampColor, setStampColor] = useState('#22c55e');

  // QR Modal
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrText, setQrText] = useState('');

  // Find & Replace Modal
  const [showFindModal, setShowFindModal] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{pageIndex: number, item: TextItem, index: number}[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [matchCase, setMatchCase] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasesRef = useRef<{[key: number]: any}>({});
  const pageStateRef = useRef<{[key: number]: string}>({}); // Tracks current JSON state of each page to prevent duplicate history
  const pageTextItemsRef = useRef<Map<number, TextItem[]>>(new Map());
  const activeToolRef = useRef(activeTool);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const sigPadRef = useRef<any>(null);
  const sigUploadInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);

  // Initialization & Cleanup
  useEffect(() => {
    if (uploadedFiles.length > 0 && uploadedFiles[0].arrayBuffer) {
        initializeEditor(uploadedFiles[0]);
    }
    
    return () => {
        Object.values(canvasesRef.current).forEach((c: any) => c.dispose());
        canvasesRef.current = {};
        setPages([]);
        setHistory([]);
        setRedoStack([]);
        pageStateRef.current = {};
    };
  }, [uploadedFiles]);

  // --- Undo/Redo Logic ---
  const saveHistory = (pageIndex: number) => {
      const canvas = canvasesRef.current[pageIndex];
      if (!canvas) return;
      
      const currentJson = JSON.stringify(canvas.toJSON(['id', 'subtype', 'isOriginalText']));
      const previousJson = pageStateRef.current[pageIndex];

      // Only save if changed
      if (previousJson !== currentJson) {
          // If this is the first change, we must save the initial state first so we can undo to it
          if (!previousJson) {
             // This case is handled by initial load, but safeguard:
             // Assume empty canvas state? No, we need the initial PDF background state.
             // We'll rely on the fact that we set pageStateRef on render.
          } else {
             setHistory(prev => [...prev, { pageIndex, json: previousJson }]);
             setRedoStack([]); // Clear redo
          }
          pageStateRef.current[pageIndex] = currentJson;
      }
  };

  const handleUndo = () => {
      if (history.length === 0) return;
      const lastState = history[history.length - 1];
      const pageIndex = lastState.pageIndex;
      const canvas = canvasesRef.current[pageIndex];
      
      if (canvas) {
          // Push current state to Redo
          const currentJson = JSON.stringify(canvas.toJSON(['id', 'subtype', 'isOriginalText']));
          setRedoStack(prev => [...prev, { pageIndex, json: currentJson }]);
          
          // Load Undo State
          canvas.loadFromJSON(JSON.parse(lastState.json), () => {
              canvas.renderAll();
              pageStateRef.current[pageIndex] = lastState.json; // Update current ref
              setHistory(prev => prev.slice(0, -1)); // Pop
          });
      }
  };

  const handleRedo = () => {
      if (redoStack.length === 0) return;
      const nextState = redoStack[redoStack.length - 1];
      const pageIndex = nextState.pageIndex;
      const canvas = canvasesRef.current[pageIndex];
      
      if (canvas) {
          // Push current state to Undo
          const currentJson = JSON.stringify(canvas.toJSON(['id', 'subtype', 'isOriginalText']));
          setHistory(prev => [...prev, { pageIndex, json: currentJson }]);
          
          // Load Redo State
          canvas.loadFromJSON(JSON.parse(nextState.json), () => {
              canvas.renderAll();
              pageStateRef.current[pageIndex] = nextState.json;
              setRedoStack(prev => prev.slice(0, -1)); // Pop
          });
      }
  };

  const initializeEditor = async (file: AppFile) => {
      setLoading(true);
      try {
          const count = await pdfService.getPageCount(file);
          setPages(Array.from({ length: count }, (_, i) => ({ id: i, loaded: false })));
          
          const textMap = await pdfEditorService.extractTextData(file);
          pageTextItemsRef.current = textMap;

          await renderPage(file, 0); // Render first page
          for (let i = 1; i < count; i++) {
              setTimeout(() => renderPage(file, i), i * 200);
          }
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  const renderPage = async (file: AppFile, pageIndex: number) => {
      if (canvasesRef.current[pageIndex]) return;
      
      try {
          const pdfImage = await pdfService.renderPage(file, pageIndex, 2.0);
          const pdfjsLib = await getPdfJs();
          const loadingTask = pdfjsLib.getDocument(file.arrayBuffer!.slice(0));
          const pdf = await loadingTask.promise;
          const page = await pdf.getPage(pageIndex + 1);
          const viewport = page.getViewport({ scale: 1.0 });

          const canvasId = `fabric-page-${pageIndex}`;
          const canvasEl = document.getElementById(canvasId);
          if (!canvasEl) return;

          const fabricCanvas = new fabric.Canvas(canvasId, {
              width: viewport.width,
              height: viewport.height,
              selection: true 
          });

          fabric.Image.fromURL(pdfImage, (img: any) => {
              if (!img) return;
              img.set({
                  left: 0, top: 0, 
                  scaleX: viewport.width / img.width, 
                  scaleY: viewport.height / img.height,
                  selectable: false, evented: false, 
                  isOriginalText: true
              });
              fabricCanvas.add(img);
              fabricCanvas.sendToBack(img);
              canvasesRef.current[pageIndex] = fabricCanvas;
              
              // Initial State Save
              pageStateRef.current[pageIndex] = JSON.stringify(fabricCanvas.toJSON(['id', 'subtype', 'isOriginalText']));

              setPages(prev => prev.map(p => p.id === pageIndex ? { ...p, loaded: true } : p));

              // Interaction Events
              fabricCanvas.on('mouse:down', (e: any) => handleCanvasClick(fabricCanvas, e, pageIndex));
              fabricCanvas.on('selection:created', (e: any) => handleSelection(e, pageIndex));
              fabricCanvas.on('selection:updated', (e: any) => handleSelection(e, pageIndex));
              fabricCanvas.on('selection:cleared', () => setShowFloatingBar(false));
              
              // Undo/Redo Triggers
              const save = () => saveHistory(pageIndex);
              fabricCanvas.on('object:added', (e: any) => { if(!e.target.isOriginalText && !e.target.excludeFromHistory) save(); });
              fabricCanvas.on('object:modified', save);
              fabricCanvas.on('object:removed', save);
              
              switchTool(activeToolRef.current);
          });
      } catch(err) {
          console.warn("Page render interrupted", err);
      }
  };

  const handleSelection = (e: any, pageIndex: number) => {
      const obj = e.selected?.[0];
      if (obj && (obj.type === 'i-text' || obj.type === 'text')) {
          setSelectedTextObj(obj);
          setFontSize(obj.fontSize || 12);
          setFontFamily(obj.fontFamily || 'Helvetica');
          setFontColor(obj.fill || '#000000');
          setIsBold(obj.fontWeight === 'bold');
          setIsItalic(obj.fontStyle === 'italic');
          setIsUnderline(!!obj.underline);
          
          const canvasEl = canvasesRef.current[pageIndex].lowerCanvasEl;
          const rect = canvasEl.getBoundingClientRect();
          const containerRect = containerRef.current?.getBoundingClientRect() || { top: 0, left: 0 };
          const objBound = obj.getBoundingRect();
          
          setFloatingBarPos({
              top: rect.top - containerRect.top + objBound.top - 50,
              left: rect.left - containerRect.left + objBound.left
          });
          setShowFloatingBar(true);
      } else {
          setShowFloatingBar(false);
      }
  };

  const handleCanvasClick = (canvas: any, opt: any, pageIndex: number) => {
      const pointer = canvas.getPointer(opt.e);
      const tool = activeToolRef.current;

      if (tool === 'text') {
          if (opt.target) return;
          const items = pageTextItemsRef.current.get(pageIndex) || [];
          const hit = items.find(item => {
              const x = item.transform[4];
              const y = item.transform[5];
              return (
                  pointer.x >= x && pointer.x <= x + item.width &&
                  pointer.y >= y - item.height && pointer.y <= y
              );
          });

          if (hit) {
              const whiteout = new fabric.Rect({
                  left: hit.transform[4],
                  top: hit.transform[5] - hit.height,
                  width: hit.width,
                  height: hit.height * 1.2,
                  fill: '#ffffff',
                  selectable: false,
                  subtype: 'whiteout'
              });
              
              const newText = new fabric.IText(hit.str, {
                  left: hit.transform[4],
                  top: hit.transform[5] - hit.height,
                  fontFamily: 'Helvetica',
                  fontSize: hit.height,
                  fill: '#000000',
              });

              canvas.add(whiteout);
              canvas.add(newText);
              canvas.setActiveObject(newText);
              newText.enterEditing();
              newText.selectAll();
          } else {
              const newText = new fabric.IText('Type here', {
                  left: pointer.x,
                  top: pointer.y,
                  fontSize: 14,
                  fontFamily: 'Helvetica'
              });
              canvas.add(newText);
              canvas.setActiveObject(newText);
              newText.enterEditing();
              newText.selectAll();
          }
      } 
      else if (tool === 'whiteout' && !opt.target) {
          const rect = new fabric.Rect({
              left: pointer.x, top: pointer.y, width: 100, height: 30, fill: '#ffffff', stroke: '#cccccc', strokeWidth: 1, strokeDashArray: [4,4]
          });
          canvas.add(rect);
          canvas.setActiveObject(rect);
          switchTool('select');
      }
      else if (tool === 'annotate' && !opt.target) {
          const note = new fabric.IText('Note', {
              left: pointer.x, top: pointer.y, fontSize: 14, backgroundColor: '#fef3c7', padding: 8, fill: '#4b5563'
          });
          canvas.add(note);
          canvas.setActiveObject(note);
          switchTool('select');
      }
  };

  const switchTool = (tool: string) => {
      setActiveTool(tool);
      Object.values(canvasesRef.current).forEach((c: any) => {
          c.discardActiveObject();
          c.requestRenderAll();
          
          if (tool === 'select') {
              c.selection = true;
              c.defaultCursor = 'default';
              c.forEachObject((o: any) => { o.selectable = true; o.evented = true; });
          } else {
              c.selection = false;
              c.defaultCursor = tool === 'text' ? 'text' : 'crosshair';
              c.forEachObject((o: any) => { 
                  const isText = o.type === 'i-text';
                  o.selectable = isText; 
                  o.evented = isText; 
              });
          }
      });
  };

  // --- Find & Replace ---
  const handleFind = () => {
      const results: any[] = [];
      const query = matchCase ? findQuery : findQuery.toLowerCase();
      
      if (!query) return;

      pageTextItemsRef.current.forEach((items, pageIndex) => {
          items.forEach((item, index) => {
              const str = matchCase ? item.str : item.str.toLowerCase();
              if (str.includes(query)) {
                  results.push({ pageIndex, item, index });
              }
          });
      });

      setSearchResults(results);
      if (results.length > 0) {
          setCurrentMatchIndex(0);
          highlightMatch(results[0]);
      } else {
          setCurrentMatchIndex(-1);
          alert("No matches found.");
      }
  };

  const highlightMatch = (match: any) => {
      // Scroll to page
      const el = document.getElementById(`fabric-page-${match.pageIndex}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Visual highlight (optional, can just rely on user seeing replacement)
      // Here we assume user will replace immediately
  };

  const replaceMatch = (match: any, replaceText: string) => {
      const canvas = canvasesRef.current[match.pageIndex];
      if (!canvas) return;

      const { item } = match;
      
      // Whiteout original
      const whiteout = new fabric.Rect({
          left: item.transform[4],
          top: item.transform[5] - item.height,
          width: item.width,
          height: item.height * 1.2,
          fill: '#ffffff',
          selectable: false,
          subtype: 'whiteout'
      });

      // Add Replacement Text
      const newText = new fabric.Text(replaceText, {
          left: item.transform[4],
          top: item.transform[5] - item.height,
          fontSize: item.height, // Match size
          fill: '#000000', // Default to black as requested
          fontFamily: 'Helvetica'
      });

      canvas.add(whiteout);
      canvas.add(newText);
      canvas.renderAll();
      saveHistory(match.pageIndex);
  };

  const handleReplace = () => {
      if (currentMatchIndex >= 0 && currentMatchIndex < searchResults.length) {
          replaceMatch(searchResults[currentMatchIndex], replaceQuery);
          // Move next
          if (currentMatchIndex < searchResults.length - 1) {
              const next = currentMatchIndex + 1;
              setCurrentMatchIndex(next);
              highlightMatch(searchResults[next]);
          } else {
              alert("Reached end of document");
          }
      }
  };

  const handleReplaceAll = () => {
      searchResults.forEach(match => {
          replaceMatch(match, replaceQuery);
      });
      setSearchResults([]);
      setCurrentMatchIndex(-1);
      setShowFindModal(false);
  };

  // --- Stamp Logic (Enhanced) ---
  const handleAddCustomStamp = () => {
      const canvas = canvasesRef.current[0]; // Default to first page
      if (!canvas) return;

      const group = new fabric.Group([], { left: 100, top: 100 });

      const rect = new fabric.Rect({
          width: 300, height: 100,
          fill: 'transparent',
          stroke: stampColor,
          strokeWidth: 4,
          rx: 15, ry: 15,
          originX: 'center', originY: 'center'
      });

      const subject = new fabric.Text(stampSubject, {
          fontSize: 32,
          fontFamily: 'Helvetica',
          fontWeight: 'bold',
          fill: stampColor,
          originX: 'center', originY: 'center',
          top: -10
      });

      const footer = new fabric.Text(`By ${stampAuthor} at ${stampDate}`, {
          fontSize: 12,
          fontFamily: 'Helvetica',
          fill: stampColor,
          originX: 'center', originY: 'center',
          top: 25
      });

      group.addWithUpdate(rect);
      group.addWithUpdate(subject);
      group.addWithUpdate(footer);

      canvas.add(group);
      canvas.setActiveObject(group);
      setShowStampModal(false);
      switchTool('select');
  };

  // --- QR Logic ---
  const handleAddQr = async () => {
      if (!qrText) return;
      try {
          const url = await QRCode.toDataURL(qrText, { width: 150, margin: 1 });
          const canvas = canvasesRef.current[0];
          if (canvas) {
              fabric.Image.fromURL(url, (img: any) => {
                  img.set({ left: 100, top: 100 });
                  canvas.add(img);
                  canvas.setActiveObject(img);
                  setShowQrModal(false);
                  setQrText('');
                  switchTool('select');
              });
          }
      } catch (e) {
          console.error(e);
      }
  };

  // --- Signature Logic ---
  useEffect(() => {
      if (showSignModal && signTab === 'draw' && drawCanvasRef.current && !sigPadRef.current) {
          const canvas = new fabric.Canvas(drawCanvasRef.current, { isDrawingMode: true, width: 500, height: 200, backgroundColor: '#f9fafb' });
          canvas.freeDrawingBrush.width = 3;
          canvas.freeDrawingBrush.color = sigColor;
          sigPadRef.current = canvas;
      }
  }, [showSignModal, signTab]);

  useEffect(() => { if (sigPadRef.current) sigPadRef.current.freeDrawingBrush.color = sigColor; }, [sigColor]);

  const processUploadedSignature = async (file: File) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
          const src = e.target?.result as string;
          setUploadedSigImg(src);
          // Auto remove background for preview options
          const transparent = await pdfEditorService.removeBackground(src, 30, 1.0);
          const light = await pdfEditorService.removeBackground(src, 30, 0.5);
          setSigProcessedUrls({ original: src, transparent, light });
      };
      reader.readAsDataURL(file);
  };

  const saveSignature = (src: string, type: 'type' | 'draw' | 'upload') => {
      setSavedSignatures(prev => [...prev, { id: crypto.randomUUID(), src, type }]);
  };

  const handleAddSignature = (src?: string) => {
      let finalSrc = src || '';
      
      if (!finalSrc) {
          if (signTab === 'type') {
              const c = document.createElement('canvas');
              const ctx = c.getContext('2d');
              if (ctx) {
                  ctx.font = `60px "${selectedSigFont}"`;
                  const w = ctx.measureText(typedName).width + 40;
                  c.width = w; c.height = 100;
                  ctx.font = `60px "${selectedSigFont}"`;
                  ctx.fillStyle = sigColor;
                  ctx.fillText(typedName, 10, 70);
                  finalSrc = c.toDataURL();
              }
          } else if (signTab === 'draw') {
              finalSrc = sigPadRef.current.toDataURL();
          } else if (signTab === 'upload' && sigProcessedUrls) {
              finalSrc = sigProcessedUrls[selectedSigType];
          }
          if (finalSrc) saveSignature(finalSrc, signTab);
      }

      if (finalSrc) {
          const canvas = canvasesRef.current[0]; 
          if (canvas) {
              fabric.Image.fromURL(finalSrc, (img: any) => {
                  img.scaleToWidth(200);
                  img.set({ left: 100, top: 100 });
                  canvas.add(img);
                  canvas.setActiveObject(img);
              });
              setShowSignModal(false);
              switchTool('select');
          }
      }
  };

  const handleDownload = async () => {
      setLoading(true);
      const pagesData = pages.map(p => {
          const canvas = canvasesRef.current[p.id];
          return {
              pageIndex: p.id,
              objects: canvas ? canvas.toJSON(['id', 'subtype', 'linkUrl', 'isOriginalText']).objects : []
          };
      });
      
      try {
          const result = await pdfEditorService.savePdf(uploadedFiles[0], pagesData);
          const link = document.createElement('a');
          link.href = result.dataUrl;
          link.download = result.name;
          link.click();
      } catch (e) {
          alert('Error saving PDF');
      } finally {
          setLoading(false);
      }
  };

  // --- HELPER FOR TEXT UPDATES ---
  const updateTextObj = (prop: string, val: any) => {
      if (!selectedTextObj) return;
      selectedTextObj.set(prop, val);
      selectedTextObj.canvas.renderAll();
      if (prop === 'fontSize') setFontSize(val);
      if (prop === 'fontFamily') setFontFamily(val);
      if (prop === 'fill') setFontColor(val);
      if (prop === 'fontWeight') setIsBold(val === 'bold');
      if (prop === 'fontStyle') setIsItalic(val === 'italic');
      if (prop === 'underline') setIsUnderline(val);
      saveHistory(pages.findIndex(p => canvasesRef.current[p.id] === selectedTextObj.canvas));
  };

  const deleteSelected = () => {
      if (!selectedTextObj) return;
      const canvas = selectedTextObj.canvas;
      canvas.remove(selectedTextObj);
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      setShowFloatingBar(false);
  };

  // --- EMPTY STATE ---
  if (uploadedFiles.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[600px] bg-gray-50 p-8 font-sans">
            <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100">
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8 text-blue-600 shadow-sm">
                    <Icon name="text" size={12} />
                </div>
                <h2 className="text-4xl font-black text-gray-800 mb-4 tracking-tight">PDF Editor</h2>
                <p className="text-gray-500 mb-10 text-xl max-w-lg mx-auto leading-relaxed">Edit text, add signatures, insert images, and fill forms securely in your browser.</p>
                <div className="bg-gray-50 rounded-xl p-2 border border-dashed border-gray-300">
                    <Dropzone onFilesSelected={onUpload} acceptedFileTypes={['application/pdf']} multiple={false} label="Drag & Drop PDF to Edit" />
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-100 font-sans">
        {/* Top Header */}
        <div className="bg-[#0f0f23] text-white h-14 flex items-center justify-between px-6 shrink-0 shadow-md z-30">
            <div className="flex items-center space-x-4">
               <button onClick={() => onRemoveFile(uploadedFiles[0].id)} className="hover:bg-white/10 p-1 rounded transition-colors text-gray-400 hover:text-white" title="Back">
                   <Icon name="undo" className="rotate-180" />
               </button>
               <span className="font-medium text-sm text-gray-200 truncate max-w-xs">{uploadedFiles[0].name}</span>
            </div>
            <Button onClick={handleDownload} className="bg-[#007bff] hover:bg-blue-600 text-white font-bold py-1.5 px-6 rounded-lg text-sm shadow-lg border border-blue-500 transition-all hover:shadow-blue-500/30">
                Apply Changes
            </Button>
        </div>

        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 h-20 flex items-center px-4 shadow-sm z-20 shrink-0 gap-2 overflow-x-auto no-scrollbar justify-center">
            <ToolbarButton label="Text" icon={<Icon name="text" />} active={activeTool === 'text'} onClick={() => switchTool('text')} />
            <ToolbarButton label="Whiteout" icon={<Icon name="whiteout" />} active={activeTool === 'whiteout'} onClick={() => switchTool('whiteout')} />
            <ToolbarButton label="Image" icon={<Icon name="image" />} onClick={() => imageInputRef.current?.click()} />
            <ToolbarButton label="Link" icon={<Icon name="link" />} active={activeTool === 'link'} onClick={() => switchTool('link')} />
            <div className="w-px h-8 bg-gray-200 mx-2"></div>
            <ToolbarButton label="Sign" icon={<Icon name="signature" />} onClick={() => setShowSignModal(true)} />
            <ToolbarButton label="Annotate" icon={<Icon name="annotate" />} active={activeTool === 'annotate'} onClick={() => switchTool('annotate')} />
            <div className="w-px h-8 bg-gray-200 mx-2"></div>
            <ToolbarButton label="Stamp" icon={<Icon name="stamp" />} onClick={() => setShowStampModal(true)} />
            <ToolbarButton label="QR Code" icon={<Icon name="qr" />} onClick={() => setShowQrModal(true)} />
            <div className="w-px h-8 bg-gray-200 mx-2"></div>
            <ToolbarButton label="Find" icon={<Icon name="find" />} onClick={() => setShowFindModal(true)} />
            <div className="w-px h-8 bg-gray-200 mx-2"></div>
            <ToolbarButton label="Undo" icon={<Icon name="undo" />} onClick={handleUndo} />
            <ToolbarButton label="Redo" icon={<Icon name="redo" />} onClick={handleRedo} />
            
            <input ref={imageInputRef} type="file" hidden accept="image/*" onChange={(e) => { 
                if (e.target.files?.[0]) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        const canvas = canvasesRef.current[0];
                        if (canvas) {
                            fabric.Image.fromURL(evt.target?.result, (img: any) => {
                                img.scaleToWidth(200);
                                img.set({ left: 100, top: 100 });
                                canvas.add(img);
                                canvas.setActiveObject(img);
                                switchTool('select');
                            });
                        }
                    };
                    reader.readAsDataURL(e.target.files[0]);
                }
            }} />
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto relative p-8 bg-[#e5e7eb]" ref={containerRef}>
            <div className="flex flex-col items-center space-y-8 pb-32">
                {pages.map(page => (
                    <div key={page.id} className="shadow-xl bg-white relative">
                        <canvas id={`fabric-page-${page.id}`} />
                    </div>
                ))}
            </div>

            {/* Floating Text Toolbar */}
            {showFloatingBar && (
                <div 
                    className="absolute bg-white border border-gray-300 rounded-lg shadow-2xl p-1.5 flex items-center gap-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                    style={{ top: floatingBarPos.top, left: floatingBarPos.left }}
                >
                    <select className="text-xs border-r pr-2 outline-none font-medium text-gray-700 bg-transparent cursor-pointer" value={fontFamily} onChange={(e) => updateTextObj('fontFamily', e.target.value)}>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Times New Roman">Times Roman</option>
                        <option value="Courier">Courier</option>
                    </select>
                    <select className="text-xs border-r pr-2 outline-none font-medium text-gray-700 bg-transparent cursor-pointer w-14" value={fontSize} onChange={(e) => updateTextObj('fontSize', parseInt(e.target.value))}>
                        {[8,10,12,14,16,18,24,36,48,72].map(s => <option key={s} value={s}>{s}px</option>)}
                    </select>
                    
                    <button onClick={() => updateTextObj('fontWeight', isBold ? 'normal' : 'bold')} className={`p-1.5 rounded hover:bg-gray-100 ${isBold ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}><Icon name="bold" size={4} /></button>
                    <button onClick={() => updateTextObj('fontStyle', isItalic ? 'normal' : 'italic')} className={`p-1.5 rounded hover:bg-gray-100 ${isItalic ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}><Icon name="italic" size={4} /></button>
                    <button onClick={() => updateTextObj('underline', !isUnderline)} className={`p-1.5 rounded hover:bg-gray-100 ${isUnderline ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}><Icon name="underline" size={4} /></button>
                    <input type="color" value={fontColor} onChange={(e) => updateTextObj('fill', e.target.value)} className="w-5 h-5 border-none p-0 cursor-pointer rounded-full overflow-hidden" />
                    <button onClick={deleteSelected} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Icon name="trash" size={4} /></button>
                </div>
            )}

            {loading && <div className="absolute inset-0 bg-white/90 z-50 flex flex-col items-center justify-center"><LoadingSpinner message="Preparing Document..." /></div>}
        </div>

        {/* Signature Modal */}
        {showSignModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                        <h3 className="font-bold text-gray-800 text-lg">Create Signature</h3>
                        <button onClick={() => setShowSignModal(false)} className="text-gray-400 hover:text-gray-600"><Icon name="close" /></button>
                    </div>
                    <div className="flex border-b">
                        {['type', 'draw', 'upload'].map(t => (
                            <button key={t} onClick={() => setSignTab(t as any)} className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide ${signTab === t ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'}`}>{t}</button>
                        ))}
                    </div>
                    <div className="p-6 min-h-[300px]">
                        {signTab === 'type' && (
                            <div className="space-y-6">
                                <input type="text" value={typedName} onChange={e => setTypedName(e.target.value)} className="w-full text-4xl text-center border-b-2 border-gray-200 focus:border-blue-600 outline-none pb-2 transition-colors" style={{ fontFamily: selectedSigFont, color: sigColor }} />
                                <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                                    {SIGNATURE_FONTS.map(f => (
                                        <button key={f.name} onClick={() => setSelectedSigFont(f.name)} className={`p-3 border rounded-lg text-xl hover:shadow-sm transition-all ${selectedSigFont === f.name ? 'border-blue-500 bg-blue-50 text-blue-900' : 'border-gray-200 text-gray-600'}`} style={{ fontFamily: f.name }}>{typedName}</button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {signTab === 'draw' && (
                            <div className="border-2 border-gray-200 rounded-lg bg-white h-48 relative overflow-hidden shadow-inner">
                                <canvas ref={drawCanvasRef} className="w-full h-full cursor-crosshair" />
                                <button onClick={() => sigPadRef.current?.clear()} className="absolute top-2 right-2 text-xs bg-white/90 px-2 py-1 rounded border shadow-sm text-red-500 hover:text-red-700">Clear</button>
                            </div>
                        )}
                        {signTab === 'upload' && (
                            <div className="space-y-4">
                                {!uploadedSigImg ? (
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg h-48 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group" onClick={() => sigUploadInputRef.current?.click()}>
                                        <div className="bg-blue-100 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform text-blue-600"><Icon name="image" size={8} /></div>
                                        <p className="text-gray-500 font-medium">Click to upload image</p>
                                        <input ref={sigUploadInputRef} type="file" hidden accept="image/*" onChange={(e) => e.target.files && processUploadedSignature(e.target.files[0])} />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            { id: 'original', label: 'Original', src: sigProcessedUrls?.original },
                                            { id: 'transparent', label: 'Transparent', src: sigProcessedUrls?.transparent },
                                            { id: 'light', label: 'Light', src: sigProcessedUrls?.light }
                                        ].map((opt) => (
                                            <div key={opt.id} className={`border rounded-lg p-2 cursor-pointer transition-all ${selectedSigType === opt.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`} onClick={() => setSelectedSigType(opt.id as any)}>
                                                <div className="h-20 flex items-center justify-center bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAABlBMVEX///+/v7+jQ3Y5AAAANElEQVR42jrMyQEAIAgFQYd7/53bIA10B6CBi239Cg6P0cM9gIFAWvMAFoIDyE5gIDwAAQ60AO5n0nQAAAAASUVORK5CYII=')] mb-2 rounded overflow-hidden border border-gray-200">
                                                    <img src={opt.src} alt={opt.label} className="max-h-full max-w-full object-contain" />
                                                </div>
                                                <p className="text-xs text-center font-bold text-gray-700">{opt.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="mt-6 flex justify-between items-center">
                            <div className="flex gap-2">
                                {['#000000', '#0033cc', '#cc0000'].map(c => (
                                    <button key={c} onClick={() => setSigColor(c)} className={`w-8 h-8 rounded-full border-2 ${sigColor === c ? 'border-gray-400 scale-110 shadow' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                                ))}
                            </div>
                            <Button onClick={() => handleAddSignature()} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-lg">Create Signature</Button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Enhanced Stamp Modal */}
        {showStampModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                    <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                        <h3 className="font-bold text-gray-800 text-lg">Create Stamp</h3>
                        <button onClick={() => setShowStampModal(false)} className="text-gray-400 hover:text-gray-600"><Icon name="close" /></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-xs font-bold text-gray-500 mb-1">Subject</label><input type="text" value={stampSubject} onChange={e => setStampSubject(e.target.value)} className="w-full border rounded p-2 text-sm" /></div>
                            <div><label className="block text-xs font-bold text-gray-500 mb-1">Author</label><input type="text" value={stampAuthor} onChange={e => setStampAuthor(e.target.value)} className="w-full border rounded p-2 text-sm" /></div>
                        </div>
                        <div><label className="block text-xs font-bold text-gray-500 mb-1">Date and time</label><input type="text" value={stampDate} onChange={e => setStampDate(e.target.value)} className="w-full border rounded p-2 text-sm" /></div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Color</label>
                            <div className="flex gap-2">
                                {STAMP_COLORS.map(c => (
                                    <button key={c} onClick={() => setStampColor(c)} className={`w-6 h-6 rounded-full border ${stampColor === c ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`} style={{ backgroundColor: c }} />
                                ))}
                            </div>
                        </div>
                        <div className="mt-4 p-6 bg-gray-50 rounded-lg flex justify-center items-center border border-dashed border-gray-300">
                            <div className="border-4 rounded-xl px-4 py-2 font-bold text-center opacity-90" style={{ borderColor: stampColor, color: stampColor }}>
                                <div className="text-2xl uppercase tracking-wider">{stampSubject}</div>
                                <div className="text-[10px]">By {stampAuthor} at {stampDate}</div>
                            </div>
                        </div>
                        <Button onClick={handleAddCustomStamp} className="w-full bg-green-600 hover:bg-green-700">Save</Button>
                    </div>
                </div>
            </div>
        )}

        {/* QR Code Modal */}
        {showQrModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                        <h3 className="font-bold text-gray-800 text-lg">Add QR Code</h3>
                        <button onClick={() => setShowQrModal(false)} className="text-gray-400 hover:text-gray-600"><Icon name="close" /></button>
                    </div>
                    <div className="p-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Enter URL or Text</label>
                        <input type="text" className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none mb-4" placeholder="https://example.com" value={qrText} onChange={(e) => setQrText(e.target.value)} />
                        <Button onClick={handleAddQr} disabled={!qrText.trim()} className="w-full">Generate & Add</Button>
                    </div>
                </div>
            </div>
        )}

        {/* Find & Replace Modal */}
        {showFindModal && (
            <div className="fixed top-20 right-8 w-80 bg-white shadow-xl rounded-lg border border-gray-200 p-4 z-40 animate-in slide-in-from-right-10 duration-200">
                <div className="flex justify-between items-center mb-3 border-b pb-2">
                    <h4 className="font-bold text-gray-700">Find & Replace</h4>
                    <button onClick={() => setShowFindModal(false)} className="text-gray-400 hover:text-red-500"><Icon name="close" size={4} /></button>
                </div>
                <div className="space-y-3">
                    <input type="text" placeholder="Find..." className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={findQuery} onChange={e => setFindQuery(e.target.value)} />
                    <input type="text" placeholder="Replace with..." className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={replaceQuery} onChange={e => setReplaceQuery(e.target.value)} />
                    <div className="flex items-center space-x-2">
                        <input type="checkbox" id="match-case" checked={matchCase} onChange={e => setMatchCase(e.target.checked)} className="rounded text-blue-600" />
                        <label htmlFor="match-case" className="text-xs text-gray-600 select-none">Match case</label>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={handleFind} className="flex-1">Find</Button>
                        <Button size="sm" onClick={handleReplace} disabled={currentMatchIndex === -1} className="flex-1">Replace</Button>
                    </div>
                    <Button size="sm" variant="outline" onClick={handleReplaceAll} disabled={searchResults.length === 0} className="w-full">Replace All</Button>
                    {searchResults.length > 0 && <p className="text-xs text-center text-gray-500 mt-1">{currentMatchIndex + 1} of {searchResults.length} matches</p>}
                </div>
            </div>
        )}
    </div>
  );
};

export default PdfEditorTool;
