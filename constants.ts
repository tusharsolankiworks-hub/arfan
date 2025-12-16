import { ToolType } from './types';

export const GEMINI_MODEL_TEXT = 'gemini-2.5-flash';

export const TOOLS = [
  { type: ToolType.BATCH_PROCESSING, label: 'Batch Processing', description: 'Process multiple files at once. Compress, Convert, or Watermark up to 20 files simultaneously.' },
  { type: ToolType.PDF_EDITOR, label: 'PDF Editor', description: 'Edit PDF files for free. Add text, images, signatures, and shapes. Fill forms.' },
  { type: ToolType.QR_CODE_GENERATOR, label: 'QR Code Generator', description: 'Create custom QR codes for URLs, WiFi, Contact Cards, SMS, and more.' },
  { type: ToolType.UNLOCK_PDF, label: 'Unlock PDF', description: 'Remove passwords from PDF files. Decrypt documents instantly.' },
  { type: ToolType.REPAIR_PDF, label: 'Repair PDF', description: 'Recover damaged or corrupted PDF files. Rebuilds document structure to fix errors.' },
  { type: ToolType.HTML_TO_PDF, label: 'HTML to PDF', description: 'Convert webpages or raw HTML code into high-quality PDF documents.' },
  { type: ToolType.PHOTO_EDITOR, label: 'Photo Editor', description: 'Professional AI-powered photo editing. Layers, filters, background removal, and smart enhancements.' },
  { type: ToolType.PDF_MERGE, label: 'Merge PDF', description: 'Combine multiple PDFs into one single document.' },
  { type: ToolType.PDF_SPLIT, label: 'Split PDF', description: 'Extract pages, split documents, and auto-tag content with AI.' },
  { type: ToolType.PDF_RESIZE, label: 'Resize PDF', description: 'Change PDF page size to A4, Letter, A3 or custom dimensions. Scales content to fit.' },
  { type: ToolType.IMAGE_MERGE, label: 'Image Merge', description: 'Combine front/back cards or multiple photos side-by-side or stacked. AI Layout suggestions.' },
  { type: ToolType.ADD_WATERMARK, label: 'Add Watermark', description: 'Stamp text or images over your PDF pages. Supports transparency, tiling, and batch processing.' },
  { type: ToolType.WORD_TO_PDF, label: 'Word to PDF', description: 'Convert .docx to PDF with AI-powered proofreading.' },
  { type: ToolType.PDF_TO_WORD, label: 'PDF to Word', description: 'Convert PDF to editable Word (.docx) with AI reformatting and OCR.' },
  { type: ToolType.PDF_TO_EXCEL, label: 'PDF to Excel', description: 'Convert PDF tables to Excel (.xlsx) spreadsheets using AI OCR.' },
  { type: ToolType.PDF_TO_PPT, label: 'PDF to PowerPoint', description: 'Convert PDF pages to editable PowerPoint (.pptx) slides.' },
  { type: ToolType.IMAGE_ENHANCER, label: 'Image Enhancer', description: 'Upscale to HD, sharpen details, and optimize images for web.' },
  { type: ToolType.PDF_TO_IMAGE, label: 'PDF to JPG', description: 'Convert each page of a PDF into a JPG image.' },
  { type: ToolType.PDF_COMPRESS, label: 'Compress PDF', description: 'Reduce the file size of your PDF documents.' },
  { type: ToolType.IMAGE_TO_PDF, label: 'JPG/PNG to PDF', description: 'Convert JPG, PNG and other images to a PDF file.' },
  { type: ToolType.IMAGE_COMPRESS, label: 'Compress Image', description: 'Reduce the file size of JPG and PNG images.' },
  { type: ToolType.IMAGE_RESIZE, label: 'Resize Image', description: 'Resize JPG, PNG or WebP images. Define pixel dimensions or percentage scaling.' },
  { type: ToolType.IMAGE_CONVERT, label: 'Convert Image', description: 'Change the format of an image (e.g. PNG to JPG).' },
  { type: ToolType.AI_PDF_SUMMARY, label: 'AI PDF Summary', description: 'Get a quick summary of a PDF using AI.' },
  { type: ToolType.PDF_OCR, label: 'PDF OCR', description: 'Extract text or create searchable PDFs from scanned documents.' },
  { type: ToolType.PHOTO_SIGN_RESIZER, label: 'Photo Sign Resizer', description: 'Resize photos and signatures to specific dimensions for forms.' },
];