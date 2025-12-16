
import { AppFile, ProcessedFile } from '../types';
import { arrayBufferToDataURL } from '../utils/fileUtils';
import { pdfService, getPdfJs } from './pdfService';
import { PDFDocument, rgb } from 'pdf-lib';

// Helper function to create a ProcessedFile object
const createProcessedFile = async (
  blob: Blob,
  fileName: string,
  mimeType: string,
): Promise<ProcessedFile> => {
  const buffer = await blob.arrayBuffer();
  const dataUrl = arrayBufferToDataURL(buffer, mimeType);
  
  return {
    id: crypto.randomUUID(),
    name: fileName,
    mimeType: mimeType,
    dataUrl: dataUrl,
    size: blob.size,
  };
};

export interface WordStructureItem {
  type: 'title' | 'heading1' | 'heading2' | 'bullet' | 'paragraph';
  content: string;
}

export class PdfToWordService {
  /**
   * Extracts text from a PDF using pdf.js.
   */
  public async extractText(file: AppFile): Promise<string> {
    if (!file.arrayBuffer) throw new Error('File buffer missing');
    
    const pdfjs = await getPdfJs();
    
    const loadingTask = pdfjs.getDocument(file.arrayBuffer.slice(0));
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const tokenizedText = await page.getTextContent();
      const pageText = tokenizedText.items.map((token: any) => token.str).join(' ');
      fullText += pageText + '\n\n';
    }
    
    return fullText.trim();
  }

  /**
   * Extracts text using Tesseract.js OCR by rendering PDF pages to images.
   */
  public async extractTextWithOcr(file: AppFile): Promise<string> {
    if (!file.arrayBuffer) throw new Error('File buffer missing');
    
    const pageCount = await pdfService.getPageCount(file);
    let fullText = '';

    // Dynamically import Tesseract with robust default handling
    const TesseractModule = await import('tesseract.js');
    const Tesseract = TesseractModule.default || TesseractModule;
    
    // Create a worker once to reuse
    const worker = await Tesseract.createWorker('eng');
    
    try {
      for (let i = 0; i < pageCount; i++) {
        // Render page to high-quality image
        const dataUrl = await pdfService.renderPage(file, i, 2.0);
        const result = await worker.recognize(dataUrl);
        fullText += (result.data.text || '') + '\n\n';
      }
    } finally {
      await worker.terminate();
    }

    return fullText.trim();
  }

  /**
   * Generates a Searchable PDF (sandwich PDF) where text is overlaid invisibly on the image.
   */
  public async generateSearchablePdf(file: AppFile, onProgress?: (percent: number) => void): Promise<ProcessedFile> {
    if (!file.arrayBuffer) throw new Error('File buffer missing');

    const pageCount = await pdfService.getPageCount(file);
    const pdfDoc = await PDFDocument.create();
    
    const TesseractModule = await import('tesseract.js');
    const Tesseract = TesseractModule.default || TesseractModule;
    const worker = await Tesseract.createWorker('eng');

    try {
        for (let i = 0; i < pageCount; i++) {
            if (onProgress) onProgress(Math.round((i / pageCount) * 100));

            // 1. Render page to image
            const dataUrl = await pdfService.renderPage(file, i, 2.0); // Scale 2.0 for better OCR
            const imgBytes = await fetch(dataUrl).then(res => res.arrayBuffer());
            
            // 2. Recognize text with bounds
            const result = await worker.recognize(dataUrl);
            const data = result.data || {};
            // Strict check to prevent "words is not iterable" error
            const words = Array.isArray(data.words) ? data.words : [];

            // 3. Embed image into new PDF page
            const embeddedImage = await pdfDoc.embedJpg(imgBytes); // renderPage usually returns jpeg
            const { width, height } = embeddedImage;
            
            const page = pdfDoc.addPage([width, height]);
            page.drawImage(embeddedImage, {
                x: 0, y: 0, width, height
            });

            // 4. Draw invisible text
            // Tesseract bbox is {x0, y0, x1, y1} from top-left in pixels
            // PDF coords are from bottom-left
            // Image was rendered at scale 2.0 via renderPage, so width/height match the image dims.
            // But we need to ensure coordinate systems align.
            // pdf-lib page size is set to image size, so direct mapping works if we flip Y.

            for (const word of words) {
                const { text, bbox } = word;
                const fontSize = bbox.y1 - bbox.y0;
                
                // Avoid tiny text errors
                if (fontSize < 2) continue;

                // PDF Y = PageHeight - BBoxY - Height (roughly, specifically baseline)
                // Use y1 (bottom of word) for baseline approx
                const pdfX = bbox.x0;
                const pdfY = height - bbox.y1;

                page.drawText(text, {
                    x: pdfX,
                    y: pdfY,
                    size: fontSize,
                    color: rgb(0, 0, 0),
                    opacity: 0, // Invisible
                });
            }
        }
    } finally {
        await worker.terminate();
    }

    if (onProgress) onProgress(100);

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return createProcessedFile(blob, `searchable_${file.name}`, 'application/pdf');
  }

  /**
   * Generates a .docx file from either raw text or structured JSON data.
   */
  public async generateDocx(data: string | WordStructureItem[], fileName: string): Promise<ProcessedFile> {
    const docx = await import('docx');
    let children: any[] = []; // (docx.Paragraph | docx.Table | docx.ImageRun)[]

    if (typeof data === 'string') {
      // Simple text conversion
      children = data.split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed) return new docx.Paragraph({ text: "" }); // Empty line
        return new docx.Paragraph({
            children: [new docx.TextRun({ text: trimmed })],
            spacing: { after: 200 }
        });
      });
    } else {
      // Structured conversion from AI
      children = data.map(item => {
        let heading = undefined;
        let bullet = undefined;
        let text = item.content;

        switch (item.type) {
            case 'title':
                heading = docx.HeadingLevel.TITLE;
                break;
            case 'heading1':
                heading = docx.HeadingLevel.HEADING_1;
                break;
            case 'heading2':
                heading = docx.HeadingLevel.HEADING_2;
                break;
            case 'bullet':
                bullet = { level: 0 };
                break;
            default: // paragraph
                break;
        }

        return new docx.Paragraph({
            text: text,
            heading: heading,
            bullet: bullet,
            spacing: { after: 200 }
        });
      });
    }

    const doc = new docx.Document({
      sections: [{
        properties: {},
        children: children,
      }],
    });

    const blob = await docx.Packer.toBlob(doc);
    const newName = fileName.replace('.pdf', '.docx');
    return createProcessedFile(blob, newName, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  }
}

export const pdfToWordService = new PdfToWordService();
