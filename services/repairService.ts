
import { PDFDocument } from 'pdf-lib';
import { AppFile, ProcessedFile } from '../types';
import { arrayBufferToDataURL } from '../utils/fileUtils';

export interface RepairResult {
  file: ProcessedFile;
  status: 'fully' | 'partially';
  originalPageCount: number;
  repairedPageCount: number;
  originalSize: number;
  repairedSize: number;
  message: string;
}

class RepairService {
  /**
   * Attempts to repair a PDF file by rebuilding its structure.
   * It loads the corrupted file (ignoring encryption if possible) and copies pages to a clean document.
   */
  public async repairPdf(file: AppFile): Promise<RepairResult> {
    if (!file.arrayBuffer) throw new Error("File buffer missing");

    try {
      // 1. Attempt to load the document with loose settings
      const srcDoc = await PDFDocument.load(file.arrayBuffer, { 
        ignoreEncryption: true,
        throwOnInvalidObject: false 
      });
      
      const originalPageCount = srcDoc.getPageCount();
      const originalSize = file.size;

      // 2. Create a fresh document to copy valid pages into
      // This process often strips out corrupted objects referenced in the old XRef table but not used in pages
      const newDoc = await PDFDocument.create();
      
      const pageIndices = srcDoc.getPageIndices();
      let copiedPagesCount = 0;

      // Copy pages in chunks or individually to isolate errors?
      // pdf-lib copyPages is robust, but if a specific page object is corrupt, it might throw.
      // We try to copy all at once first for speed.
      try {
          const copiedPages = await newDoc.copyPages(srcDoc, pageIndices);
          copiedPages.forEach(page => newDoc.addPage(page));
          copiedPagesCount = copiedPages.length;
      } catch (copyError) {
          console.warn("Bulk copy failed, trying page-by-page recovery...", copyError);
          // Fallback: Page-by-page recovery
          for (const index of pageIndices) {
              try {
                  const [page] = await newDoc.copyPages(srcDoc, [index]);
                  newDoc.addPage(page);
                  copiedPagesCount++;
              } catch (e) {
                  console.error(`Failed to recover page ${index + 1}`, e);
              }
          }
      }

      if (copiedPagesCount === 0) {
          throw new Error("Could not recover any readable pages from this document.");
      }

      // 3. Save the new clean document
      const pdfBytes = await newDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const dataUrl = arrayBufferToDataURL(pdfBytes.buffer, 'application/pdf');

      const status = copiedPagesCount === originalPageCount ? 'fully' : 'partially';
      const message = status === 'fully' 
        ? "Document structure rebuilt successfully." 
        : `Recovered ${copiedPagesCount} out of ${originalPageCount} pages. Some corrupted data was lost.`;

      return {
        file: {
            id: crypto.randomUUID(),
            name: `repaired_${file.name}`,
            mimeType: 'application/pdf',
            dataUrl: dataUrl,
            size: blob.size
        },
        status,
        originalPageCount,
        repairedPageCount: copiedPagesCount,
        originalSize,
        repairedSize: blob.size,
        message
      };

    } catch (e) {
      console.error("Repair failed:", e);
      throw new Error("This PDF is too severely damaged to be repaired by our automated tool. Please try opening it in a browser to see if it renders partially.");
    }
  }
}

export const repairService = new RepairService();
