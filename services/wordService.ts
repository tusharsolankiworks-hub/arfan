import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { AppFile, ProcessedFile } from '../types';
import { arrayBufferToDataURL } from '../utils/fileUtils';

// Helper function to create a ProcessedFile object
const createProcessedFile = async (
  buffer: Uint8Array,
  fileName: string,
  mimeType: string,
): Promise<ProcessedFile> => {
  const dataUrl = arrayBufferToDataURL(buffer.buffer, mimeType);
  const blob = new Blob([buffer], { type: mimeType });
  return {
    id: crypto.randomUUID(),
    name: fileName,
    mimeType: mimeType,
    dataUrl: dataUrl,
    size: blob.size,
  };
};

export class WordService {
  /**
   * Converts a .docx file to raw text using Mammoth.
   */
  public async extractText(file: AppFile): Promise<string> {
    if (!file.arrayBuffer) {
      throw new Error('File buffer is missing.');
    }
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ arrayBuffer: file.arrayBuffer });
    return result.value;
  }

  /**
   * Converts a .docx file to HTML for preview using Mammoth.
   */
  public async convertToHtml(file: AppFile): Promise<string> {
    if (!file.arrayBuffer) {
      throw new Error('File buffer is missing.');
    }
    const mammoth = await import('mammoth');
    const result = await mammoth.convertToHtml({ arrayBuffer: file.arrayBuffer });
    return result.value;
  }

  /**
   * Generates a PDF from text content.
   * This uses pdf-lib to manually write text to pages.
   * Note: This is a basic implementation that handles line wrapping but not advanced styling.
   */
  public async createPdfFromText(text: string): Promise<ProcessedFile> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 12;
    const lineHeight = fontSize * 1.2;
    const margin = 50;

    // Default A4 size
    let page = pdfDoc.addPage();
    let { width, height } = page.getSize();
    let y = height - margin;

    const lines = text.split(/\r?\n/);

    for (const line of lines) {
      // Handle empty lines (paragraphs)
      if (line.trim() === '') {
        y -= lineHeight;
        if (y < margin) {
          page = pdfDoc.addPage();
          y = height - margin;
        }
        continue;
      }

      // Word wrap logic
      const words = line.split(' ');
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const textWidth = font.widthOfTextAtSize(testLine, fontSize);
        const availableWidth = width - margin * 2;

        if (textWidth < availableWidth) {
          currentLine = testLine;
        } else {
          // Write the current line and start a new one
          page.drawText(currentLine, {
            x: margin,
            y: y,
            size: fontSize,
            font: font,
            color: rgb(0, 0, 0),
          });
          y -= lineHeight;
          currentLine = word;

          // Check for page break
          if (y < margin) {
            page = pdfDoc.addPage();
            y = height - margin;
          }
        }
      }

      // Draw remaining text in the paragraph
      if (currentLine) {
        page.drawText(currentLine, {
          x: margin,
          y: y,
          size: fontSize,
          font: font,
          color: rgb(0, 0, 0),
        });
        y -= lineHeight;
        
        // Check for page break after line
        if (y < margin) {
          page = pdfDoc.addPage();
          y = height - margin;
        }
      }
    }

    const pdfBytes = await pdfDoc.save();
    return createProcessedFile(pdfBytes, 'converted.pdf', 'application/pdf');
  }
}

export const wordService = new WordService();