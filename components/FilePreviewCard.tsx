import React from 'react';
import { AppFile } from '../types';
import Button from './Button';

interface FilePreviewCardProps {
  file: AppFile;
  onRemove: (id: string) => void;
}

const FilePreviewCard: React.FC<FilePreviewCardProps> = ({ file, onRemove }) => {
  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf';

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="relative flex items-center p-4 bg-white shadow-sm rounded-lg border border-gray-200">
      {isImage && (
        <img src={file.objectURL} alt={file.name} className="w-16 h-16 object-cover rounded-md mr-4" />
      )}
      {isPdf && (
        <div className="w-16 h-16 bg-red-100 flex items-center justify-center rounded-md mr-4 text-red-600 text-xl font-bold">
          PDF
        </div>
      )}
      {!isImage && !isPdf && (
        <div className="w-16 h-16 bg-gray-100 flex items-center justify-center rounded-md mr-4 text-gray-600 text-sm">
          FILE
        </div>
      )}
      <div className="flex-grow">
        <p className="text-sm font-medium text-gray-800 break-words">{file.name}</p>
        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
      </div>
      <Button
        type="button"
        variant="danger"
        size="sm"
        onClick={() => onRemove(file.id)}
        className="ml-4"
        title="Remove file"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 000-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 11-2 0v6a1 1 0 112 0V8z" clipRule="evenodd"></path>
        </svg>
      </Button>
    </div>
  );
};

export default FilePreviewCard;
