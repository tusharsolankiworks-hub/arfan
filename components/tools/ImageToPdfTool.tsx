import React, { useState, useCallback, useRef } from 'react';
import { AppFile, ProcessedFile } from '../../types';
import Dropzone from '../Dropzone';
import Button from '../Button';
import LoadingSpinner from '../LoadingSpinner';
import FilePreviewCard from '../FilePreviewCard';
import { imageService } from '../../services/imageService';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface ImageToPdfToolProps {
  onUpload: (files: File[]) => void;
  uploadedFiles: AppFile[];
  onRemoveFile: (id: string) => void;
  onReorderFiles: (newOrder: AppFile[]) => void;
}

const ImageToPdfTool: React.FC<ImageToPdfToolProps> = ({
  onUpload,
  uploadedFiles,
  onRemoveFile,
  onReorderFiles,
}) => {
  const [loading, setLoading] = useState(false);
  const [processedFile, setProcessedFile] = useState<ProcessedFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConvertToPdf = useCallback(async () => {
    setError(null);
    setProcessedFile(null);
    if (uploadedFiles.length === 0) {
      setError('Please upload image files to convert to PDF.');
      return;
    }
    const nonImageFile = uploadedFiles.find(file => !file.type.startsWith('image/'));
    if (nonImageFile) {
      setError(`File "${nonImageFile.name}" is not an image. Please upload only image files.`);
      return;
    }

    // Ensure all files have their arrayBuffer loaded
    const filesWithoutBuffer = uploadedFiles.filter(file => !file.arrayBuffer);
    if (filesWithoutBuffer.length > 0) {
      setError(`Some files are still loading their content (${filesWithoutBuffer.map(f => f.name).join(', ')}). Please wait or re-upload.`);
      return;
    }

    setLoading(true);
    try {
      const result = await imageService.imagesToPdf(uploadedFiles);
      setProcessedFile(result);
    } catch (e) {
      console.error(e);
      setError(`Failed to convert images to PDF: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [uploadedFiles]);

  const handleDownload = useCallback(() => {
    if (processedFile) {
      const link = document.createElement('a');
      link.href = processedFile.dataUrl;
      link.download = processedFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [processedFile]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const items = Array.from(uploadedFiles);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onReorderFiles(items);
  };

  const acceptedFileTypes = ['image/jpeg', 'image/png', 'image/webp'];

  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Image to PDF</h2>
      <p className="text-gray-600 mb-6">
        Convert your JPG, PNG, or other image files into a single PDF document. Drag and drop to reorder images.
      </p>

      <Dropzone
        onFilesSelected={onUpload}
        acceptedFileTypes={acceptedFileTypes}
        multiple={true}
        label="Drag & drop images here, or click to select"
      />

      {uploadedFiles.length > 0 && (
        <div className="mt-6 border-t pt-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Uploaded Images ({uploadedFiles.length})</h3>
          <p className="text-sm text-gray-500 mb-4">Drag to reorder images within the PDF.</p>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="uploadedImages">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {uploadedFiles.map((file, index) => (
                    <Draggable key={file.id} draggableId={file.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`
                            relative transition-transform duration-200 ease-in-out
                            ${snapshot.isDragging ? 'rotate-1 scale-105 shadow-lg' : ''}
                          `}
                        >
                          <FilePreviewCard file={file} onRemove={onRemoveFile} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}

      <div className="mt-6 flex justify-center">
        <Button onClick={handleConvertToPdf} disabled={uploadedFiles.length === 0 || loading} loading={loading}>
          Convert to PDF
        </Button>
      </div>

      {loading && <LoadingSpinner message="Converting images to PDF..." />}

      {processedFile && (
        <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-inner text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">PDF Created!</h3>
          <p className="text-gray-700 mb-4">
            Your images have been successfully compiled into a PDF.
          </p>
          <Button onClick={handleDownload} variant="primary">
            Download PDF
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImageToPdfTool;