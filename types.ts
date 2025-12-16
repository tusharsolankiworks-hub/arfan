export enum ToolType {
  PDF_MERGE = 'PDF_MERGE',
  PDF_TO_IMAGE = 'PDF_TO_IMAGE',
  PDF_COMPRESS = 'PDF_COMPRESS',
  PDF_SPLIT = 'PDF_SPLIT',
  PDF_RESIZE = 'PDF_RESIZE', // New
  WORD_TO_PDF = 'WORD_TO_PDF',
  PDF_TO_WORD = 'PDF_TO_WORD',
  PDF_TO_EXCEL = 'PDF_TO_EXCEL', 
  PDF_TO_PPT = 'PDF_TO_PPT', 
  IMAGE_TO_PDF = 'IMAGE_TO_PDF',
  IMAGE_COMPRESS = 'IMAGE_COMPRESS',
  IMAGE_RESIZE = 'IMAGE_RESIZE', // New Generic Resizer
  IMAGE_CONVERT = 'IMAGE_CONVERT',
  IMAGE_ENHANCER = 'IMAGE_ENHANCER',
  IMAGE_MERGE = 'IMAGE_MERGE',
  PHOTO_EDITOR = 'PHOTO_EDITOR',
  AI_PDF_SUMMARY = 'AI_PDF_SUMMARY',
  PDF_OCR = 'PDF_OCR',
  PHOTO_SIGN_RESIZER = 'PHOTO_SIGN_RESIZER',
  PDF_EDITOR = 'PDF_EDITOR',
  ADD_WATERMARK = 'ADD_WATERMARK',
  REPAIR_PDF = 'REPAIR_PDF',
  UNLOCK_PDF = 'UNLOCK_PDF', 
  BATCH_PROCESSING = 'BATCH_PROCESSING', 
  HTML_TO_PDF = 'HTML_TO_PDF', 
  QR_CODE_GENERATOR = 'QR_CODE_GENERATOR', 
  ABOUT_US = 'ABOUT_US',
  PRIVACY_POLICY = 'PRIVACY_POLICY',
}

export interface AppFile {
  id: string;
  file: File;
  name: string;
  type: string;
  size: number;
  objectURL: string; // URL for preview
  arrayBuffer?: ArrayBuffer; // Stored after reading
  thumbnail?: string; // For PDF pages or image previews
}

export interface ProcessedFile {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string; // Base64 data URL for download/display
  size: number;
}