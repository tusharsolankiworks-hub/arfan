
import { ProcessedFile } from '../types';
import { arrayBufferToDataURL } from '../utils/fileUtils';
import * as XLSX from 'xlsx';

class ExcelService {
  /**
   * Generates an Excel (.xlsx) file from a list of page data (2D arrays).
   * @param pagesData Array of objects containing sheet names and row data.
   * @param filename Output filename.
   */
  public async generateExcel(pagesData: { name: string, rows: string[][] }[], filename: string): Promise<ProcessedFile> {
    // Robust check for library availability
    if (!XLSX || (!XLSX.utils && !(XLSX as any).default?.utils)) {
      console.error("XLSX Library Object:", XLSX);
      throw new Error('XLSX library failed to load. Please check your internet connection or try refreshing the page.');
    }

    // Handle potential ESM default export wrapper
    const utils = XLSX.utils || (XLSX as any).default?.utils;
    const write = XLSX.write || (XLSX as any).default?.write;

    if (!utils || !write) {
         throw new Error("XLSX utilities not found.");
    }

    const workbook = utils.book_new();

    pagesData.forEach((page, index) => {
      // Handle empty rows gracefully
      const safeRows = page.rows && Array.isArray(page.rows) ? page.rows : [['']];
      const worksheet = utils.aoa_to_sheet(safeRows);
      
      // Sheet names must be unique and < 31 chars
      let sheetName = page.name || `Page ${index + 1}`;
      sheetName = sheetName.substring(0, 30).replace(/[:\\\/?*\[\]]/g, ""); // Remove invalid chars
      
      // Ensure uniqueness
      if (workbook.SheetNames.includes(sheetName)) {
          sheetName = `${sheetName} (${index})`;
      }

      utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    // Write to array buffer
    const excelBuffer = write(workbook, { bookType: 'xlsx', type: 'array' });
    
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const dataUrl = arrayBufferToDataURL(excelBuffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    return {
      id: crypto.randomUUID(),
      name: filename.replace('.pdf', '.xlsx'),
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dataUrl: dataUrl,
      size: blob.size
    };
  }
}

export const excelService = new ExcelService();
