
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { AppFile, ProcessedFile } from '../types';
import { arrayBufferToDataURL } from '../utils/fileUtils';

class SecurityService {
  
  /**
   * Unlocks a password-protected PDF.
   * Note: The user must provide the correct password to open the document first.
   * Once opened, we save it without encryption.
   */
  public async unlockPdf(file: AppFile, password?: string): Promise<ProcessedFile> {
    if (!file.arrayBuffer) throw new Error("File buffer missing");

    try {
      // Attempt to load. If it's encrypted and no password or wrong password, this will throw.
      // If it's not encrypted, password arg is ignored.
      const pdfDoc = await PDFDocument.load(file.arrayBuffer, { password } as any);
      
      // Save without encryption
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const dataUrl = arrayBufferToDataURL(pdfBytes.buffer, 'application/pdf');

      return {
        id: crypto.randomUUID(),
        name: `unlocked_${file.name}`,
        mimeType: 'application/pdf',
        dataUrl,
        size: blob.size
      };
    } catch (e) {
      if ((e as Error).message.includes('password')) {
        throw new Error("Incorrect password or file is encrypted.");
      }
      throw e;
    }
  }
}

export const securityService = new SecurityService();
