import React, { useCallback, useState } from 'react';

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  acceptedFileTypes?: string[];
  label?: string;
  multiple?: boolean;
}

const Dropzone: React.FC<DropzoneProps> = ({
  onFilesSelected,
  acceptedFileTypes,
  label = 'Drag & drop files here, or click to select',
  multiple = true,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragOver(false);
      const files = Array.from(event.dataTransfer.files);
      if (files.length > 0) {
        onFilesSelected(files);
      }
    },
    [onFilesSelected],
  );

  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length > 0) {
        onFilesSelected(files);
      }
      // Clear the input value so the same file can be selected again
      event.target.value = '';
    },
    [onFilesSelected],
  );

  const acceptedFiles = acceptedFileTypes ? acceptedFileTypes.join(',') : undefined;

  return (
    <div
      className={`
        border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-200
        ${isDragOver ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 bg-gray-50 text-gray-600 hover:border-blue-400 hover:bg-blue-25'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('fileInput')?.click()}
    >
      <input
        id="fileInput"
        type="file"
        multiple={multiple}
        accept={acceptedFiles}
        onChange={handleFileInputChange}
        className="hidden"
      />
      <div className="flex flex-col items-center justify-center space-y-2">
        <svg className="w-10 h-10 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
        </svg>
        <p className="text-lg font-semibold">{label}</p>
        {acceptedFileTypes && (
          <p className="text-sm text-gray-500">Accepted: {acceptedFileTypes.map(type => type.split('/')[1] || type).join(', ').toUpperCase()}</p>
        )}
      </div>
    </div>
  );
};

export default Dropzone;
