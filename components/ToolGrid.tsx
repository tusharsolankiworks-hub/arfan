
import React, { useState } from 'react';
import { ToolType } from '../types';
import { TOOLS } from '../constants';

interface ToolGridProps {
  onToolSelect: (tool: ToolType) => void;
}

// Map tools to categories as requested
export const CATEGORIES = [
  {
    id: 'convert-to',
    title: 'CONVERT TO PDF',
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: 'Convert standard files to PDF',
    tools: [
      ToolType.WORD_TO_PDF,
      ToolType.IMAGE_TO_PDF,
      ToolType.HTML_TO_PDF,
      ToolType.IMAGE_MERGE, 
    ]
  },
  {
    id: 'convert-from',
    title: 'CONVERT FROM PDF',
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50',
    description: 'Convert PDFs to other formats',
    tools: [
      ToolType.PDF_TO_WORD,
      ToolType.PDF_TO_IMAGE,
      ToolType.PDF_TO_EXCEL,
      ToolType.PDF_TO_PPT,
      ToolType.PDF_OCR,
      ToolType.AI_PDF_SUMMARY,
    ]
  },
  {
    id: 'merge-split',
    title: 'MERGE AND SPLIT',
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-50',
    description: 'Manage page organization',
    tools: [
      ToolType.PDF_MERGE,
      ToolType.PDF_SPLIT,
      ToolType.PDF_RESIZE, 
    ]
  },
  {
    id: 'security',
    title: 'PDF SECURITY',
    iconColor: 'text-red-600',
    bgColor: 'bg-red-50',
    description: 'Encrypt and recover documents',
    tools: [
      ToolType.UNLOCK_PDF,
      ToolType.REPAIR_PDF,
    ]
  },
  {
    id: 'pdf-tools',
    title: 'PDF TOOLS',
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-50',
    description: 'Edit and enhance PDFs',
    tools: [
      ToolType.PDF_COMPRESS,
      ToolType.PDF_EDITOR,
      ToolType.ADD_WATERMARK,
      ToolType.QR_CODE_GENERATOR,
      ToolType.BATCH_PROCESSING,
    ]
  },
  {
    id: 'image-tools',
    title: 'IMAGE TOOLS',
    iconColor: 'text-pink-600',
    bgColor: 'bg-pink-50',
    description: 'Professional photo editing tools',
    tools: [
      ToolType.PHOTO_EDITOR,
      ToolType.IMAGE_COMPRESS,
      ToolType.IMAGE_RESIZE, // Added
      ToolType.IMAGE_ENHANCER,
      ToolType.IMAGE_MERGE, 
      ToolType.IMAGE_CONVERT,
      ToolType.PHOTO_SIGN_RESIZER
    ]
  }
];

// Helper to get icon for specific tool type
export const getToolIcon = (type: ToolType) => {
  switch (type) {
    case ToolType.WORD_TO_PDF: return <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>;
    case ToolType.PDF_TO_WORD: return <><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>; 
    case ToolType.PDF_TO_EXCEL: return <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/><line x1="12" y1="9" x2="12" y2="9"/><line x1="16" y1="9" x2="14" y2="9"/></>; 
    case ToolType.PDF_TO_PPT: return <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>; 
    case ToolType.IMAGE_TO_PDF: return <><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>; 
    case ToolType.PDF_TO_IMAGE: return <><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>;
    case ToolType.PDF_MERGE: return <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>; 
    case ToolType.PDF_SPLIT: return <path d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"/>; 
    case ToolType.PDF_RESIZE: return <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"/>;
    case ToolType.IMAGE_RESIZE: return <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>;
    case ToolType.PDF_COMPRESS: return <path d="M4 14h6m-6 4h6m6-10h6m-6 4h6m-6 4h6M4 6h16"/>; 
    case ToolType.PDF_EDITOR: return <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>; 
    case ToolType.UNLOCK_PDF: return <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></>; 
    case ToolType.QR_CODE_GENERATOR: return <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h7v7h-7z"/></>;
    case ToolType.REPAIR_PDF: return <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>; 
    case ToolType.ADD_WATERMARK: return <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>; 
    case ToolType.HTML_TO_PDF: return <><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></>; 
    case ToolType.PDF_OCR: return <path d="M4 7V4h16v3M9 20h6M12 4v16"/>; 
    case ToolType.AI_PDF_SUMMARY: return <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>; 
    case ToolType.PHOTO_EDITOR: return <><circle cx="12" cy="12" r="10"/><path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83M16.62 12l-5.74 9.94"/></>; 
    case ToolType.IMAGE_COMPRESS: return <path d="M4 14h6m-6 4h6m6-10h6m-6 4h6m-6 4h6M4 6h16"/>; 
    case ToolType.IMAGE_ENHANCER: return <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>; 
    case ToolType.BATCH_PROCESSING: return <><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></>;
    case ToolType.IMAGE_MERGE: return <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>;
    case ToolType.IMAGE_CONVERT: return <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>;
    case ToolType.PHOTO_SIGN_RESIZER: return <><path d="M4 8V4h4"/><path d="M20 8V4h-4"/><path d="M4 16v4h4"/><path d="M20 16v4h-4"/><rect x="8" y="8" width="8" height="8" rx="1"/></>;
    default: return <circle cx="12" cy="12" r="10"/>;
  }
}

// Revised to provide more vibrant/solid backgrounds
export const getCustomIconColor = (toolType: ToolType, defaultCategoryColor: string) => {
    const baseColor = defaultCategoryColor.match(/text-(\w+)-/)?.[1] || 'blue';

    if (toolType === ToolType.PDF_TO_EXCEL) return 'text-green-600 bg-green-100';
    if (toolType === ToolType.PDF_TO_PPT) return 'text-orange-600 bg-orange-100';
    if (toolType === ToolType.PDF_TO_WORD) return 'text-blue-600 bg-blue-100';
    if (toolType === ToolType.WORD_TO_PDF) return 'text-indigo-600 bg-indigo-100';
    if (toolType === ToolType.IMAGE_TO_PDF) return 'text-pink-600 bg-pink-100';
    if (toolType === ToolType.PDF_TO_IMAGE) return 'text-purple-600 bg-purple-100';
    if (toolType === ToolType.PDF_EDITOR) return 'text-red-600 bg-red-100';
    if (toolType === ToolType.PDF_MERGE) return 'text-violet-600 bg-violet-100';
    if (toolType === ToolType.PDF_RESIZE) return 'text-cyan-600 bg-cyan-100';
    if (toolType === ToolType.IMAGE_RESIZE) return 'text-fuchsia-600 bg-fuchsia-100';
    
    return `text-${baseColor}-600 bg-${baseColor}-100`;
};

const ToolGrid: React.FC<ToolGridProps> = ({ onToolSelect }) => {
  return (
    <div className="bg-white min-h-screen">
      {/* Main Grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8 items-start">
          {CATEGORIES.map((category) => (
            <div 
              key={category.id} 
              id={category.id}
              className="flex flex-col space-y-4 scroll-mt-40 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
                <div className={`w-1.5 h-8 rounded-full ${category.bgColor.replace('50', '500')}`}></div>
                <div>
                    <h3 className={`text-lg font-black tracking-wide uppercase ${category.iconColor.replace('text-', 'text-opacity-90 text-')}`}>
                    {category.title}
                    </h3>
                    <p className="text-xs text-gray-400 font-medium">{category.description}</p>
                </div>
              </div>

              <div className="space-y-4">
                {category.tools.map((toolType) => {
                  const toolInfo = TOOLS.find(t => t.type === toolType);
                  if (!toolInfo) return null;
                  
                  const iconStyle = getCustomIconColor(toolType, category.iconColor);

                  return (
                    <div 
                      key={`${category.id}-${toolType}`}
                      onClick={() => onToolSelect(toolType)}
                      className="group flex items-center p-4 rounded-2xl bg-white border border-gray-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden"
                    >
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${iconStyle.split(' ')[1]} ${iconStyle.split(' ')[0]} group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9">
                          {getToolIcon(toolType)}
                        </svg>
                      </div>
                      <div className="ml-5 flex-grow">
                        <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                          {toolInfo.label}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-1 font-medium">
                          {toolInfo.description}
                        </p>
                      </div>
                      <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400 transform translate-x-2 group-hover:translate-x-0 duration-300">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ToolGrid;
