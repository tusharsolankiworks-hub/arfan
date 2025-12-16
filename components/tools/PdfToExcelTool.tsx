
import React, { useState } from 'react';
import { AppFile, ProcessedFile } from '../../types';
import Dropzone from '../Dropzone';
import Button from '../Button';
import LoadingSpinner from '../LoadingSpinner';
import FilePreviewCard from '../FilePreviewCard';
import { pdfService } from '../../services/pdfService';
import { geminiService } from '../../services/geminiService';
import { excelService } from '../../services/excelService';

interface PdfToExcelToolProps {
  onUpload: (files: File[]) => void;
  uploadedFiles: AppFile[];
  onRemoveFile: (id: string) => void;
}

const PdfToExcelTool: React.FC<PdfToExcelToolProps> = ({ onUpload, uploadedFiles, onRemoveFile }) => {
  const [loading, setLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [progressValue, setProgressValue] = useState(0);
  const [processedFile, setProcessedFile] = useState<ProcessedFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConvert = async () => {
    if (uploadedFiles.length === 0) return;
    setLoading(true);
    setProcessedFile(null);
    setError(null);
    setProgressValue(0);

    try {
        const pdfFile = uploadedFiles[0];
        setProgressMessage('Converting PDF pages to images...');
        
        // 1. Convert PDF pages to images
        const images = await pdfService.pdfToImages(pdfFile);
        const totalPages = images.length;
        const excelData = [];

        // 2. Process each page with Gemini
        for (let i = 0; i < totalPages; i++) {
            setProgressMessage(`Analyzing page ${i + 1} of ${totalPages} with AI...`);
            setProgressValue(Math.round(((i) / totalPages) * 100));
            
            const image = images[i];
            const result = await geminiService.extractTableData(image.dataUrl);
            
            if (result.rows && result.rows.length > 0) {
                excelData.push({
                    name: `Page ${i + 1}`,
                    rows: result.rows
                });
            } else {
                // If no table found, we might skip or add empty sheet
                excelData.push({ name: `Page ${i + 1}`, rows: [['(No tabular data detected)']] });
            }
        }

        setProgressMessage('Generating Excel file...');
        const resultFile = await excelService.generateExcel(excelData, pdfFile.name);
        setProcessedFile(resultFile);
        setProgressValue(100);

    } catch (e) {
        console.error(e);
        setError("Conversion failed: " + (e as Error).message);
    } finally {
        setLoading(false);
    }
  };

  const handleDownload = () => {
      if (!processedFile) return;
      const link = document.createElement('a');
      link.href = processedFile.dataUrl;
      link.download = processedFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto min-h-[600px] flex flex-col">
      <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center">
            <span className="bg-green-100 text-green-600 p-2 rounded-lg mr-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </span>
            PDF to Excel
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto">Convert PDF tables into editable Excel spreadsheets. Uses advanced AI to recognize rows, columns, and headers.</p>
      </div>

      {uploadedFiles.length === 0 ? (
          <div className="flex-grow flex flex-col justify-center">
              <Dropzone onFilesSelected={onUpload} acceptedFileTypes={['application/pdf']} multiple={false} label="Drag & drop PDF with tables here" />
          </div>
      ) : (
          <div className="flex-grow">
              <div className="mb-6">
                  <h3 className="font-bold text-gray-700 mb-4">Selected File</h3>
                  <FilePreviewCard file={uploadedFiles[0]} onRemove={onRemoveFile} />
              </div>

              {!loading && !processedFile && (
                  <div className="text-center mt-8">
                      <Button onClick={handleConvert} className="bg-green-600 hover:bg-green-700 px-12 py-4 text-lg shadow-lg">
                          Convert to Excel
                      </Button>
                      <p className="text-xs text-gray-400 mt-4">Note: AI processing may take a few seconds per page.</p>
                  </div>
              )}

              {loading && (
                  <div className="flex flex-col items-center justify-center h-64">
                      <LoadingSpinner message={progressMessage} />
                      <div className="w-64 h-2 bg-gray-200 rounded-full mt-4 overflow-hidden">
                          <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${progressValue}%` }}></div>
                      </div>
                  </div>
              )}

              {processedFile && (
                  <div className="mt-8 p-8 bg-green-50 border border-green-200 rounded-xl text-center animate-fade-in">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">Conversion Successful!</h3>
                      <p className="text-gray-600 mb-6">Your Excel file is ready.</p>
                      
                      <Button onClick={handleDownload} className="bg-green-600 hover:bg-green-700 px-10 py-3 text-lg shadow-md">
                          Download .XLSX
                      </Button>
                      <button onClick={() => { setProcessedFile(null); onUpload([]); }} className="block mx-auto mt-4 text-sm text-gray-500 hover:text-gray-700 underline">
                          Convert Another
                      </button>
                  </div>
              )}

              {error && (
                  <div className="mt-6 p-4 bg-red-100 text-red-700 rounded-lg text-center border border-red-200">
                      <p className="font-bold">Error:</p>
                      <p>{error}</p>
                      <Button variant="secondary" size="sm" className="mt-4" onClick={() => { setError(null); setLoading(false); }}>Try Again</Button>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};

export default PdfToExcelTool;
