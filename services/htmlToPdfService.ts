
import { ProcessedFile } from '../types';
import { arrayBufferToDataURL } from '../utils/fileUtils';

declare const html2pdf: any;

export interface HtmlToPdfOptions {
  margin: number | number[];
  filename: string;
  image: { type: string; quality: number };
  html2canvas: { 
    scale: number; 
    useCORS: boolean; 
    scrollY?: number; 
    scrollX?: number;
    letterRendering?: boolean;
    windowWidth?: number; // Crucial for responsive design simulation
  };
  jsPDF: { unit: string; format: string; orientation: string };
}

class HtmlToPdfService {
  /**
   * Converts HTML content to PDF
   */
  public async convertHtmlToPdf(element: HTMLElement, options: HtmlToPdfOptions): Promise<ProcessedFile> {
    if (typeof html2pdf === 'undefined') {
      throw new Error('html2pdf library not loaded.');
    }

    // Generate the PDF as a Blob
    const pdfBlob = await html2pdf().from(element).set(options).output('blob');
    
    // Convert Blob to ArrayBuffer for ProcessedFile
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const dataUrl = arrayBufferToDataURL(arrayBuffer, 'application/pdf');

    return {
      id: crypto.randomUUID(),
      name: options.filename,
      mimeType: 'application/pdf',
      dataUrl: dataUrl,
      size: pdfBlob.size
    };
  }
}

export const htmlToPdfService = new HtmlToPdfService();
