
import React, { useState, useEffect, useRef } from 'react';
import { ToolType } from '../types';
import { TOOLS } from '../constants';
import { createRoot } from 'react-dom/client';
import UserGuideTemplate from './UserGuideTemplate';
import { htmlToPdfService } from '../services/htmlToPdfService';

interface HeaderProps {
  onToolSelect: (tool: ToolType | null) => void;
  activeTool: ToolType | null;
}

const Header: React.FC<HeaderProps> = ({ onToolSelect, activeTool }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus input when search opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredTools = searchQuery.trim() === '' 
    ? [] 
    : TOOLS.filter(t => 
        t.type !== ToolType.ABOUT_US && 
        t.type !== ToolType.PRIVACY_POLICY &&
        (t.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
         t.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );

  const handleToolClick = (toolType: ToolType | null) => {
      onToolSelect(toolType);
      setIsSearchOpen(false);
      setSearchQuery('');
  };

  const scrollToSection = (id: string) => {
      const element = document.getElementById(id);
      if (element) {
          const headerOffset = 100;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
  };

  const handleDownloadGuide = async () => {
      if (isGeneratingGuide) return;
      setIsGeneratingGuide(true);

      try {
          // Create a temporary container for the PDF generation
          // Position it absolutely but make it invisible via z-index, so it renders in the DOM
          // This ensures Tailwind styles are applied and fonts are loaded by the browser.
          const tempDiv = document.createElement('div');
          tempDiv.id = 'pdf-gen-container';
          tempDiv.style.position = 'absolute';
          tempDiv.style.left = '0';
          tempDiv.style.top = '0';
          tempDiv.style.zIndex = '-9999'; // Hide behind everything
          tempDiv.style.width = '210mm'; // Match A4 width
          tempDiv.style.backgroundColor = '#ffffff'; 
          
          document.body.appendChild(tempDiv);

          // Render the User Guide Template into the container
          const root = createRoot(tempDiv);
          root.render(<UserGuideTemplate />);

          // Wait for React to render and Styles to apply
          // 2 seconds is usually safe for Tailwind CDN to process new DOM elements
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Convert to PDF
          const processed = await htmlToPdfService.convertHtmlToPdf(tempDiv, {
              filename: 'SMART_PDF_User_Guide.pdf',
              margin: [0, 0, 0, 0], 
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { 
                  scale: 2, 
                  useCORS: true, 
                  scrollY: 0, 
                  scrollX: 0, 
                  letterRendering: true,
                  windowWidth: 1200 // Simulate desktop width
              },
              jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
          });

          // Open in new tab
          const response = await fetch(processed.dataUrl);
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');

          // Cleanup
          root.unmount();
          if (document.body.contains(tempDiv)) {
            document.body.removeChild(tempDiv);
          }
          
          setTimeout(() => URL.revokeObjectURL(url), 60000);

      } catch (e) {
          console.error("Failed to generate guide", e);
          alert("Could not generate User Guide. Please try again.");
          // Ensure cleanup
          const tempDiv = document.getElementById('pdf-gen-container');
          if (tempDiv && document.body.contains(tempDiv)) {
              document.body.removeChild(tempDiv);
          }
      } finally {
          setIsGeneratingGuide(false);
      }
  };

  return (
    <>
    <header className="bg-white text-gray-800 shadow-sm sticky top-0 z-50 border-b border-gray-100 bg-opacity-95 backdrop-blur-md">
      <div className="container mx-auto px-4 py-3">
        
        {/* Top Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 md:gap-6">
            
            {/* Logo Section */}
            <div 
                className="flex items-center gap-2 cursor-pointer group shrink-0 select-none"
                onClick={() => onToolSelect(null)}
            >
                {/* Icon */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-lg shadow-md text-white">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                </div>
                
                {/* Text */}
                <div className="flex flex-col leading-tight">
                    <h1 className="text-xl font-black tracking-tight text-gray-800 font-sans flex items-center">
                        SMART<span className="text-teal-600">PDF</span>
                    </h1>
                    <span className="text-[9px] font-bold text-gray-400 tracking-wider uppercase">AI Tools</span>
                </div>
            </div>

            {/* Navigation Pills */}
            <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-linear-fade flex-1 justify-start md:justify-center py-1">
                <button 
                    onClick={() => onToolSelect(ToolType.PDF_EDITOR)} 
                    className="px-5 py-2.5 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-100 hover:text-teal-600 transition-all whitespace-nowrap"
                >
                    PDF Editor
                </button>
                <button 
                    onClick={() => onToolSelect(ToolType.BATCH_PROCESSING)} 
                    className="px-5 py-2.5 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-100 hover:text-teal-600 transition-all whitespace-nowrap"
                >
                    Batch Processing
                </button>
                <button 
                    onClick={() => onToolSelect(ToolType.PHOTO_EDITOR)} 
                    className="px-5 py-2.5 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-100 hover:text-teal-600 transition-all whitespace-nowrap"
                >
                    Photo Editor
                </button>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2 shrink-0">
                <button 
                    onClick={handleDownloadGuide}
                    disabled={isGeneratingGuide}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white hover:from-orange-600 hover:to-rose-600 rounded-full shadow-md hover:shadow-lg transition-all text-sm font-bold transform hover:-translate-y-0.5"
                    title="View User Guide PDF"
                >
                    {isGeneratingGuide ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                    )}
                    <span className="hidden md:inline">User Guide</span>
                </button>

                <div className="w-px h-6 bg-gray-200 mx-1"></div>

                <button 
                    onClick={() => setIsSearchOpen(true)} 
                    className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all text-sm font-medium"
                    title="Search Tools"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    <span className="hidden md:inline">Search</span>
                </button>
            </div>
        </div>

        {/* Hero Banner (Only visible on Home) */}
        {!activeTool && (
            <div className="mt-8 mb-6 text-center animate-fade-in">
                <h2 className="text-3xl md:text-4xl font-black text-gray-800 mb-3 tracking-tight">
                    Handle All your <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-600">PDF Tasks</span> Smarter, Faster, And Completely Free
                </h2>
                <p className="text-gray-500 max-w-xl mx-auto mb-6 text-sm md:text-base font-medium">
                    Easy to use, productive PDF tools. 100% free and secure. Process files locally on your device.
                </p>
                
                <div className="flex flex-wrap justify-center gap-3">
                    <button 
                        onClick={() => scrollToSection('convert-to')} 
                        className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-green-200 transition-all hover:-translate-y-0.5"
                    >
                        Start Converting
                    </button>
                    <button 
                        onClick={() => scrollToSection('pdf-tools')} 
                        className="px-6 py-2.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 rounded-lg text-sm font-bold shadow-sm transition-all hover:-translate-y-0.5"
                    >
                        Explore All Tools
                    </button>
                </div>
            </div>
        )}
      </div>
    </header>

    {/* Search Modal */}
    {isSearchOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsSearchOpen(false)}></div>
            <div className="flex min-h-full items-start justify-center p-4 pt-20 text-center">
                <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all border border-gray-200 animate-scale-in">
                    <div className="relative flex items-center border-b border-gray-100 p-4">
                        <svg className="pointer-events-none absolute left-6 top-5 h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            ref={searchInputRef}
                            type="text"
                            className="h-10 w-full bg-transparent pl-12 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none text-lg"
                            placeholder="Search tools (e.g. 'Resize', 'Excel', 'Edit')..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button onClick={() => setIsSearchOpen(false)} className="absolute right-4 rounded-full p-1 hover:bg-gray-100 text-gray-400">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto bg-gray-50/50">
                        {searchQuery.trim() === '' ? (
                            <div className="p-10 text-center text-gray-500 text-sm">
                                <p>Try searching for "Resize", "PPT", or "Convert"</p>
                            </div>
                        ) : filteredTools.length > 0 ? (
                            <ul className="divide-y divide-gray-100">
                                {filteredTools.map((tool) => (
                                    <li 
                                        key={tool.type} 
                                        onClick={() => handleToolClick(tool.type)}
                                        className="group flex cursor-pointer items-center p-4 hover:bg-green-50/50 transition-colors"
                                    >
                                        <div className="flex-1 ml-4">
                                            <p className="font-semibold text-gray-900 group-hover:text-green-700">{tool.label}</p>
                                            <p className="text-sm text-gray-500">{tool.description}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="p-12 text-center text-gray-500">No tools found.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )}
    </>
  );
};

export default Header;
