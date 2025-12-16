
import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import { ToolType, AppFile } from './types';
import { fileToArrayBuffer } from './utils/fileUtils';
import PdfMergeTool from './components/tools/PdfMergeTool';
import PdfToImageTool from './components/tools/PdfToImageTool';
import PdfCompressTool from './components/tools/PdfCompressTool';
import PdfSplitTool from './components/tools/PdfSplitTool';
import PdfResizeTool from './components/tools/PdfResizeTool'; 
import WordToPdfTool from './components/tools/WordToPdfTool';
import PdfToWordTool from './components/tools/PdfToWordTool';
import PdfToExcelTool from './components/tools/PdfToExcelTool'; 
import PdfToPptTool from './components/tools/PdfToPptTool'; 
import ImageToPdfTool from './components/tools/ImageToPdfTool';
import ImageCompressTool from './components/tools/ImageCompressTool';
import ImageResizeTool from './components/tools/ImageResizeTool'; // New
import ImageConvertTool from './components/tools/ImageConvertTool';
import ImageEnhancerTool from './components/tools/ImageEnhancerTool'; 
import ImageMergeTool from './components/tools/ImageMergeTool'; 
import PhotoEditorTool from './components/tools/PhotoEditorTool'; 
import AiPdfSummaryTool from './components/tools/AiPdfSummaryTool';
import PdfOcrTool from './components/tools/PdfOcrTool';
import PhotoSignResizerTool from './components/tools/PhotoSignResizerTool';
import PdfEditorTool from './components/tools/PdfEditorTool'; 
import AddWatermarkTool from './components/tools/AddWatermarkTool'; 
import BatchProcessingTool from './components/tools/BatchProcessingTool'; 
import HtmlToPdfTool from './components/tools/HtmlToPdfTool'; 
import RepairPdfTool from './components/tools/RepairPdfTool';
import UnlockPdfTool from './components/tools/UnlockPdfTool'; 
import QrCodeGeneratorTool from './components/tools/QrCodeGeneratorTool'; 
import AboutUs from './components/AboutUs';
import PrivacyPolicy from './components/PrivacyPolicy';
import ToolGrid from './components/ToolGrid'; 

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolType | null>(null); 
  const [uploadedFiles, setUploadedFiles] = useState<AppFile[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const handleToolSelect = useCallback((tool: ToolType | null) => {
    setActiveTool(tool);
    setUploadedFiles([]); 
    setGlobalError(null);
    window.scrollTo(0, 0); 
  }, []);

  const handleFilesSelected = useCallback(async (newFiles: File[]) => {
    setGlobalError(null);
    const filesToUpload: AppFile[] = [];
    const existingFileNames = new Set(uploadedFiles.map(f => f.name));

    for (const file of newFiles) {
      if (existingFileNames.has(file.name)) {
        console.warn(`Skipping duplicate file: ${file.name}`);
        continue;
      }
      filesToUpload.push({
        id: crypto.randomUUID(),
        file: file,
        name: file.name,
        type: file.type,
        size: file.size,
        objectURL: URL.createObjectURL(file),
      });
    }

    setUploadedFiles((prevFiles) => [...prevFiles, ...filesToUpload]);

    Promise.all(filesToUpload.map(async (appFile) => {
      try {
        const arrayBuffer = await fileToArrayBuffer(appFile.file);
        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === appFile.id ? { ...f, arrayBuffer } : f))
        );
      } catch (e) {
        console.error(`Failed to load ArrayBuffer for ${appFile.name}:`, e);
        setGlobalError(`Failed to load content for ${appFile.name}. Please try again.`);
        setUploadedFiles((prev) => prev.filter((f) => f.id !== appFile.id));
      }
    }));
  }, [uploadedFiles]);

  const handleRemoveFile = useCallback((id: string) => {
    setUploadedFiles((prevFiles) => {
      const fileToRemove = prevFiles.find(file => file.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.objectURL); 
      }
      return prevFiles.filter((file) => file.id !== id);
    });
    setGlobalError(null);
  }, []);

  const handleReorderFiles = useCallback((newOrder: AppFile[]) => {
    setUploadedFiles(newOrder);
  }, []);

  useEffect(() => {
    return () => {
      uploadedFiles.forEach(file => URL.revokeObjectURL(file.objectURL));
    };
  }, [uploadedFiles]);

  const renderTool = () => {
    if (!activeTool) {
      return <ToolGrid onToolSelect={handleToolSelect} />;
    }

    switch (activeTool) {
      case ToolType.ABOUT_US:
        return <AboutUs />;
      case ToolType.PRIVACY_POLICY:
        return <PrivacyPolicy />;
      case ToolType.PDF_EDITOR:
        return (
          <PdfEditorTool
            onUpload={handleFilesSelected}
            uploadedFiles={uploadedFiles}
            onRemoveFile={handleRemoveFile}
          />
        );
      case ToolType.PHOTO_EDITOR: 
        return (
          <PhotoEditorTool
            onUpload={handleFilesSelected}
            uploadedFiles={uploadedFiles}
            onRemoveFile={handleRemoveFile}
          />
        );
      case ToolType.QR_CODE_GENERATOR:
        return <QrCodeGeneratorTool />;
      case ToolType.PDF_MERGE:
        return (
          <PdfMergeTool
            onUpload={handleFilesSelected}
            uploadedFiles={uploadedFiles}
            onRemoveFile={handleRemoveFile}
            onReorderFiles={handleReorderFiles}
          />
        );
      case ToolType.PDF_SPLIT:
        return (
          <PdfSplitTool
            onUpload={handleFilesSelected}
            uploadedFiles={uploadedFiles}
            onRemoveFile={handleRemoveFile}
          />
        );
      case ToolType.PDF_RESIZE:
        return (
          <PdfResizeTool
            onUpload={handleFilesSelected}
            uploadedFiles={uploadedFiles}
            onRemoveFile={handleRemoveFile}
          />
        );
      case ToolType.IMAGE_MERGE: 
        return (
          <ImageMergeTool
            onUpload={handleFilesSelected}
            uploadedFiles={uploadedFiles}
            onRemoveFile={handleRemoveFile}
            onReorderFiles={handleReorderFiles}
          />
        );
      case ToolType.ADD_WATERMARK: 
        return (
          <AddWatermarkTool
            onUpload={handleFilesSelected}
            uploadedFiles={uploadedFiles}
            onRemoveFile={handleRemoveFile}
          />
        );
      case ToolType.REPAIR_PDF:
        return (
          <RepairPdfTool
            onUpload={handleFilesSelected}
            uploadedFiles={uploadedFiles}
            onRemoveFile={handleRemoveFile}
          />
        );
      case ToolType.UNLOCK_PDF: 
        return (
          <UnlockPdfTool
            onUpload={handleFilesSelected}
            uploadedFiles={uploadedFiles}
            onRemoveFile={handleRemoveFile}
          />
        );
      case ToolType.BATCH_PROCESSING:
        return (
          <BatchProcessingTool
            onUpload={handleFilesSelected}
            uploadedFiles={uploadedFiles}
            onRemoveFile={handleRemoveFile}
          />
        );
      case ToolType.HTML_TO_PDF:
        return <HtmlToPdfTool />;
      case ToolType.WORD_TO_PDF:
        return (
          <WordToPdfTool
            onUpload={handleFilesSelected}
            uploadedFiles={uploadedFiles}
            onRemoveFile={handleRemoveFile}
            />
        );
      case ToolType.PDF_TO_WORD:
        return (
          <PdfToWordTool
            onUpload={handleFilesSelected}
            uploadedFiles={uploadedFiles}
            onRemoveFile={handleRemoveFile}
          />
        );
      case ToolType.PDF_TO_EXCEL: 
        return (
          <PdfToExcelTool
            onUpload={handleFilesSelected}
            uploadedFiles={uploadedFiles}
            onRemoveFile={handleRemoveFile}
          />
        );
      case ToolType.PDF_TO_PPT: 
        return (
          <PdfToPptTool
            onUpload={handleFilesSelected}
            uploadedFiles={uploadedFiles}
            onRemoveFile={handleRemoveFile}
          />
        );
      case ToolType.PDF_TO_IMAGE:
        return (
          <PdfToImageTool
            onUpload={handleFilesSelected}
            uploadedFiles={uploadedFiles}
            onRemoveFile={handleRemoveFile}
          />
        );
      case ToolType.PDF_COMPRESS:
        return (
          <PdfCompressTool
            onUpload={handleFilesSelected}
            uploadedFiles={uploadedFiles}
            onRemoveFile={handleRemoveFile}
          />
        );
      case ToolType.IMAGE_TO_PDF:
        return (
          <ImageToPdfTool
            onUpload={handleFilesSelected}
            uploadedFiles={uploadedFiles}
            onRemoveFile={handleRemoveFile}
            onReorderFiles={handleReorderFiles}
          />
        );
      case ToolType.IMAGE_COMPRESS:
        return (
          <ImageCompressTool
            onUpload={handleFilesSelected}
            uploadedFiles={uploadedFiles}
            onRemoveFile={handleRemoveFile}
          />
        );
      case ToolType.IMAGE_RESIZE:
        return (
          <ImageResizeTool
            onUpload={handleFilesSelected}
            uploadedFiles={uploadedFiles}
            onRemoveFile={handleRemoveFile}
          />
        );
      case ToolType.IMAGE_CONVERT:
        return (
          <ImageConvertTool
            onUpload={handleFilesSelected}
            uploadedFiles={uploadedFiles}
            onRemoveFile={handleRemoveFile}
          />
        );
      case ToolType.IMAGE_ENHANCER: 
        return (
          <ImageEnhancerTool
            onUpload={handleFilesSelected}
            uploadedFiles={uploadedFiles}
            onRemoveFile={handleRemoveFile}
            />
        );
      case ToolType.AI_PDF_SUMMARY:
        return (
          <AiPdfSummaryTool
            onUpload={handleFilesSelected}
            uploadedFiles={uploadedFiles}
            onRemoveFile={handleRemoveFile}
          />
        );
      case ToolType.PDF_OCR:
        return (
          <PdfOcrTool
            onUpload={handleFilesSelected}
            uploadedFiles={uploadedFiles}
            onRemoveFile={handleRemoveFile}
            />
        );
      case ToolType.PHOTO_SIGN_RESIZER:
        return <PhotoSignResizerTool />;
      default:
        return <ToolGrid onToolSelect={handleToolSelect} />;
    }
  };

  const isFullWidthTool = activeTool === ToolType.PDF_EDITOR || activeTool === ToolType.PHOTO_EDITOR || activeTool === ToolType.ADD_WATERMARK;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Header onToolSelect={handleToolSelect} activeTool={activeTool} />
      {/* Use full width for PDF/Photo Editor/Watermark to maximize viewport space, otherwise use standard container */}
      <main className={`flex-grow ${isFullWidthTool ? 'w-full bg-gray-900' : 'container mx-auto p-4 sm:p-6 lg:p-8'}`}>
        {globalError && (
          <div className={`${isFullWidthTool ? 'mx-4 mt-4' : ''} mb-6 p-4 bg-red-100 text-red-700 rounded-md border border-red-200 shadow-sm`}>
            <p className="font-bold">Application Error:</p>
            <p>{globalError}</p>
          </div>
        )}
        {renderTool()}
      </main>
      
      {!isFullWidthTool && (
        <footer className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-8 mt-12">
            <div className="container mx-auto px-4">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white tracking-wide cursor-pointer" onClick={() => handleToolSelect(null)}>SMART<span className="text-white/90">PDF</span></h2>
                <p className="text-white/80 text-sm">Intelligent Document Tools</p>
            </div>
            
            <div className="flex justify-center space-x-8 mb-6 text-sm">
                <button 
                    onClick={() => handleToolSelect(ToolType.ABOUT_US)}
                    className="font-bold text-white hover:text-white/80 transition-opacity"
                >
                About Us
                </button>
                <button 
                    onClick={() => handleToolSelect(ToolType.PRIVACY_POLICY)}
                    className="font-bold text-white hover:text-white/80 transition-opacity"
                >
                Privacy Policy
                </button>
                <a href="mailto:support@smartpdfai.com" className="font-bold text-white hover:text-white/80 transition-opacity">Contact</a>
            </div>

            <div className="border-t border-white/20 pt-6">
                <p className="font-medium text-white/60">&copy; {new Date().getFullYear()} SMART PDF (AI). All rights reserved.</p>
            </div>
            </div>
        </footer>
      )}
    </div>
  );
};

export default App;
