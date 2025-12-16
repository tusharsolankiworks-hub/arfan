import React, { useState, useRef, useEffect } from 'react';
import { ProcessedFile } from '../../types';
import Button from '../Button';
import LoadingSpinner from '../LoadingSpinner';
import { htmlToPdfService, HtmlToPdfOptions } from '../../services/htmlToPdfService';

const HtmlToPdfTool: React.FC = () => {
  const [mode, setMode] = useState<'url' | 'raw'>('url');
  const [url, setUrl] = useState('');
  const [rawHtml, setRawHtml] = useState('<h1>Hello World</h1><p>Type your HTML here...</p>');
  const [loading, setLoading] = useState(false);
  const [processedFile, setProcessedFile] = useState<ProcessedFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Settings
  const [pageSize, setPageSize] = useState('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [margin, setMargin] = useState(10);
  const [customCss, setCustomCss] = useState(false);
  const [cssCode, setCssCode] = useState('body { font-family: sans-serif; }');

  const previewRef = useRef<HTMLDivElement>(null);

  const handleConvert = async () => {
    setLoading(true);
    setProcessedFile(null);
    setError(null);

    // Prepare content for conversion
    let elementToConvert: HTMLElement | null = null;
    let tempDiv: HTMLDivElement | null = null;

    try {
        if (mode === 'url') {
            if (!url) throw new Error("Please enter a URL");
            // NOTE: Client-side fetching of external URLs for PDF conversion faces CORS issues.
            // We can't easily fetch google.com and render it here without a backend proxy.
            // We will attempt to fetch, but likely fall back to user instruction.
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error("Could not fetch URL. It might be blocked by CORS policy.");
                const text = await response.text();
                
                tempDiv = document.createElement('div');
                tempDiv.innerHTML = text;
            } catch (e) {
                throw new Error("Cannot access this website directly due to browser security (CORS). Please copy the 'View Source' code of the website and paste it into the 'Raw HTML' tab instead.");
            }
        } else {
             tempDiv = document.createElement('div');
             const styleBlock = customCss ? `<style>${cssCode}</style>` : '';
             tempDiv.innerHTML = styleBlock + rawHtml;
        }
        
        // Append to DOM briefly to render (hidden or off-screen, but html2pdf needs it rendered)
        // We use the previewRef container which is visible or hidden
        if (previewRef.current && tempDiv) {
            previewRef.current.innerHTML = '';
            previewRef.current.appendChild(tempDiv);
            elementToConvert = tempDiv;
        }

        if (!elementToConvert) throw new Error("Content preparation failed");

        const opt: HtmlToPdfOptions = {
            margin: margin / 3.78, // px to mm approx logic (html2pdf uses mm usually, but depends on config. Let's assume mm input)
            filename: 'webpage.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: pageSize, orientation: orientation }
        };

        const result = await htmlToPdfService.convertHtmlToPdf(elementToConvert, opt);
        setProcessedFile(result);

    } catch (e) {
        setError((e as Error).message);
    } finally {
        setLoading(false);
        // Clean up preview if needed, or leave it for user to see what was rendered
    }
  };

  const downloadPdf = () => {
      if (!processedFile) return;
      const link = document.createElement('a');
      link.href = processedFile.dataUrl;
      link.download = processedFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md max-w-5xl mx-auto min-h-[600px] flex flex-col">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
        <span className="bg-red-100 text-red-600 p-2 rounded-lg mr-3">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </span>
        HTML to PDF Converter
      </h2>
      <p className="text-gray-600 mb-6">
        Convert websites or raw HTML code to PDF. Perfect for invoices, reports, and archiving.
      </p>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
          <button 
            className={`px-6 py-3 font-medium text-sm transition-colors ${mode === 'url' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setMode('url')}
          >
            From URL
          </button>
          <button 
            className={`px-6 py-3 font-medium text-sm transition-colors ${mode === 'raw' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setMode('raw')}
          >
            Raw HTML
          </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow">
          {/* Inputs Column */}
          <div className="lg:col-span-1 space-y-6">
              {mode === 'url' ? (
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Website URL</label>
                      <input 
                        type="url" 
                        placeholder="https://example.com" 
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                      />
                      <p className="text-xs text-yellow-600 mt-2 bg-yellow-50 p-2 rounded">
                          Note: Many websites block direct access. For best results, view the page source, copy the code, and use the "Raw HTML" tab.
                      </p>
                  </div>
              ) : (
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">HTML Code</label>
                      <textarea 
                        className="w-full border border-gray-300 rounded-lg p-3 h-64 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                        value={rawHtml}
                        onChange={e => setRawHtml(e.target.value)}
                        placeholder="<html><body>...</body></html>"
                      ></textarea>
                  </div>
              )}

              {/* Settings */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                  <h3 className="font-bold text-gray-700 text-sm">PDF Settings</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="text-xs font-semibold text-gray-500">Page Size</label>
                          <select value={pageSize} onChange={e => setPageSize(e.target.value)} className="w-full mt-1 p-2 border rounded text-sm">
                              <option value="a4">A4</option>
                              <option value="a3">A3</option>
                              <option value="letter">Letter</option>
                              <option value="legal">Legal</option>
                          </select>
                      </div>
                      <div>
                          <label className="text-xs font-semibold text-gray-500">Orientation</label>
                          <select value={orientation} onChange={e => setOrientation(e.target.value as any)} className="w-full mt-1 p-2 border rounded text-sm">
                              <option value="portrait">Portrait</option>
                              <option value="landscape">Landscape</option>
                          </select>
                      </div>
                  </div>
                  
                  <div>
                      <label className="text-xs font-semibold text-gray-500">Margin (mm): {margin}</label>
                      <input type="range" min="0" max="50" value={margin} onChange={e => setMargin(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-1"/>
                  </div>

                  <div className="flex items-center space-x-2">
                       <input type="checkbox" id="css-check" checked={customCss} onChange={e => setCustomCss(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500"/>
                       <label htmlFor="css-check" className="text-sm text-gray-700 font-medium cursor-pointer">Add Custom CSS</label>
                  </div>
                  
                  {customCss && (
                      <textarea 
                        className="w-full border border-gray-300 rounded p-2 h-24 font-mono text-xs"
                        placeholder="body { background: white; }"
                        value={cssCode}
                        onChange={e => setCssCode(e.target.value)}
                      ></textarea>
                  )}
              </div>

              <Button onClick={handleConvert} disabled={loading} className="w-full py-3 text-lg shadow-lg" loading={loading}>
                  Convert to PDF
              </Button>

              {error && (
                  <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
                      {error}
                  </div>
              )}
          </div>

          {/* Preview / Result Column */}
          <div className="lg:col-span-2 flex flex-col">
               <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-gray-700">Preview & Download</h3>
                   {processedFile && (
                       <Button onClick={downloadPdf} variant="primary" className="bg-green-600 hover:bg-green-700">
                           Download PDF
                       </Button>
                   )}
               </div>

               <div className="flex-grow bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden relative min-h-[500px] flex items-center justify-center">
                   {/* This div is used by html2pdf to grab content. We scale it down to act as preview */}
                   <div className="absolute inset-0 overflow-auto p-4 flex justify-center items-start">
                       <div 
                          ref={previewRef} 
                          className="bg-white shadow-2xl origin-top transition-transform"
                          style={{ 
                              width: orientation === 'portrait' ? '210mm' : '297mm', 
                              minHeight: orientation === 'portrait' ? '297mm' : '210mm',
                              padding: `${margin}mm`,
                              transform: 'scale(0.8)' // Scale for viewing
                          }}
                       >
                           {/* Content injected here */}
                           {!url && !rawHtml && <div className="text-center text-gray-400 mt-20">Preview area</div>}
                       </div>
                   </div>
                   
                   {loading && (
                       <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
                           <LoadingSpinner message="Rendering HTML to PDF..." />
                       </div>
                   )}
               </div>
          </div>
      </div>
    </div>
  );
};

export default HtmlToPdfTool;