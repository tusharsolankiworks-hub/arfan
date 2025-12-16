
import { PDFDocument } from 'pdf-lib';
import { AppFile, ProcessedFile } from '../types';
import { arrayBufferToDataURL } from '../utils/fileUtils';
import JSZip from 'jszip';

// Access global pdfjsLib loaded via script tag in index.html
// Robust loader with retry mechanism to ensure library is available
export const getPdfJs = async () => {
  const version = '3.11.174';
  
  // List of CDNs to try in order for the main library
  const cdnUrls = [
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.min.js`,
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.min.js`,
    `https://unpkg.com/pdfjs-dist@${version}/build/pdf.min.js`
  ];
  
  // Independent list of worker URLs to try
  const workerUrls = [
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`,
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.js`,
    `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.js`
  ];

  const checkGlobal = () => (window as any).pdfjsLib;

  // Helper to load worker code as a blob to bypass CORS/importScripts issues
  const setupWorker = async (lib: any) => {
      // If workerSrc is already set and looks like a blob, we're good
      if (lib.GlobalWorkerOptions.workerSrc && lib.GlobalWorkerOptions.workerSrc.startsWith('blob:')) {
          return;
      }

      // Try to fetch worker script from any available CDN
      for (const url of workerUrls) {
          try {
              const response = await fetch(url);
              if (response.ok) {
                  const workerScript = await response.text();
                  const blob = new Blob([workerScript], { type: "text/javascript" });
                  lib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
                  console.log(`PDF Worker loaded from Blob (${url})`);
                  return;
              }
          } catch (e) {
              console.warn(`Failed to fetch PDF worker from ${url}:`, e);
          }
      }
      
      // Fallback to direct URL if blob creation fails for all
      console.warn("All PDF worker fetches failed. Falling back to direct URL.");
      if (!lib.GlobalWorkerOptions.workerSrc) {
          lib.GlobalWorkerOptions.workerSrc = workerUrls[0];
      }
  };

  // 1. Immediate check
  const existingLib = checkGlobal();
  if (existingLib) {
      await setupWorker(existingLib);
      return existingLib;
  }

  // 2. Check for existing script tag (from index.html)
  const existingScript = document.querySelector('script[src*="pdf.min.js"]');
  if (existingScript) {
      // Wait a short duration to see if it initializes
      for (let i = 0; i < 30; i++) { // 3 seconds
          await new Promise(r => setTimeout(r, 100));
          const lib = checkGlobal();
          if (lib) {
              await setupWorker(lib);
              return lib;
          }
      }
      console.warn("PDF.js script detected but not loaded in time. Attempting dynamic injection...");
  }

  // 3. Dynamic injection with fallbacks
  for (let i = 0; i < cdnUrls.length; i++) {
      try {
          const url = cdnUrls[i];
          await new Promise<void>((resolve, reject) => {
              const script = document.createElement('script');
              script.src = url;
              script.async = true;
              script.onload = () => resolve();
              script.onerror = () => reject(new Error(`Failed to load ${url}`));
              document.head.appendChild(script);
          });
          
          const lib = checkGlobal();
          if (lib) {
              await setupWorker(lib);
              return lib;
          }
      } catch (e) {
          console.warn(`CDN ${i} failed:`, e);
          // Continue to next CDN
      }
  }

  throw new Error('PDF.js library could not be loaded. Please check your internet connection or try disabling ad blockers.');
};

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

export class PdfService {
  /**
   * Merges multiple PDF files into a single PDF.
   * @param files An array of AppFile objects, each containing a PDF.
   * @returns A Promise that resolves with a ProcessedFile object of the merged PDF.
   */
  public async mergePdfs(files: AppFile[]): Promise<ProcessedFile> {
    const mergedPdf = await PDFDocument.create();
    for (const appFile of files) {
      if (appFile.arrayBuffer) {
        const pdfDoc = await PDFDocument.load(appFile.arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
    }
    const mergedPdfBytes = await mergedPdf.save();
    return createProcessedFile(mergedPdfBytes, 'merged.pdf', 'application/pdf');
  }

  /**
   * Gets the total number of pages in a PDF.
   */
  public async getPageCount(file: AppFile): Promise<number> {
    if (!file.arrayBuffer) throw new Error('File buffer missing');
    const pdfDoc = await PDFDocument.load(file.arrayBuffer);
    return pdfDoc.getPageCount();
  }

  /**
   * Renders a specific page of a PDF to a Data URL (image).
   * Used for UI previews.
   */
  public async renderPage(file: AppFile, pageIndex: number, scale: number = 0.5): Promise<string> {
    if (!file.arrayBuffer) throw new Error('File buffer missing');
    
    const pdfjs = await getPdfJs();

    const pdfBufferCopy = file.arrayBuffer.slice(0);
    
    try {
        const loadingTask = pdfjs.getDocument(pdfBufferCopy);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(pageIndex + 1); // pdfjs uses 1-based indexing

        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas context missing');

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;
        return canvas.toDataURL('image/jpeg');
    } catch (e) {
        console.error("PDF Render Error:", e);
        throw new Error("Failed to render PDF page. The file might be corrupted or encrypted.");
    }
  }

  /**
   * Splits a PDF based on defined ranges.
   * @param file The source PDF.
   * @param ranges Array of strings or objects defining ranges (e.g. "1-2", "3").
   * @param labels Optional labels for filenames.
   * @returns ProcessedFile (either a single PDF or a ZIP file).
   */
  public async splitPdf(
    file: AppFile, 
    ranges: { start: number; end: number; label?: string }[]
  ): Promise<ProcessedFile> {
    if (!file.arrayBuffer) throw new Error('File buffer missing');

    // Create a safe copy of the buffer to prevent detachment issues
    const srcDoc = await PDFDocument.load(file.arrayBuffer.slice(0), { ignoreEncryption: true });
    const generatedFiles: { name: string; data: Uint8Array }[] = [];

    for (let i = 0; i < ranges.length; i++) {
      const range = ranges[i];
      // Validate range
      if (range.start < 1 || range.end > srcDoc.getPageCount() || range.start > range.end) {
        console.warn(`Invalid range ignored: ${range.start}-${range.end}`);
        continue;
      }

      const newPdf = await PDFDocument.create();
      // Convert 1-based range to 0-based indices
      const pageIndices: number[] = [];
      for (let p = range.start; p <= range.end; p++) {
        pageIndices.push(p - 1);
      }

      const copiedPages = await newPdf.copyPages(srcDoc, pageIndices);
      copiedPages.forEach((page) => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      
      // Construct filename
      let filename = `split_${i + 1}.pdf`;
      if (range.label) {
        // Sanitize label for filename
        const safeLabel = range.label.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        filename = `${safeLabel}.pdf`;
      }

      generatedFiles.push({ name: filename, data: pdfBytes });
    }

    if (generatedFiles.length === 0) {
      throw new Error("No valid ranges were processed.");
    }

    // If only one file generated, return it directly
    if (generatedFiles.length === 1) {
      return createProcessedFile(generatedFiles[0].data, generatedFiles[0].name, 'application/pdf');
    }

    // If multiple, Zip them
    const zip = new JSZip();
    generatedFiles.forEach(f => zip.file(f.name, f.data));
    const zipContent = await zip.generateAsync({ type: 'uint8array' });
    
    return createProcessedFile(
      zipContent, 
      `${file.name.replace('.pdf', '')}_split.zip`, 
      'application/zip'
    );
  }

  /**
   * Compresses a PDF file by converting each page to a JPEG image with specified quality.
   */
  public async compressPdf(file: AppFile, compressionStrength: number): Promise<ProcessedFile> {
    if (!file.arrayBuffer) {
      throw new Error('File buffer is missing for compression.');
    }

    const pdfjs = await getPdfJs();

    // Create a copy of the ArrayBuffer as pdfjs.getDocument may detach it
    const pdfBufferCopy = file.arrayBuffer.slice(0);
    
    // NOTE: We do not pass CMap options here as it requires external file loading which can be brittle.
    // Basic rendering usually works without it for standard fonts.
    const loadingTask = pdfjs.getDocument({
        data: pdfBufferCopy,
        disableRange: true,
        disableStream: true
    });
    
    const pdf = await loadingTask.promise;
    const newPdfDoc = await PDFDocument.create();

    // Map compressionStrength (0-100 where 100 is max compression) to JPEG quality (0.0-1.0 where 0.0 is lowest quality/most compression)
    const jpegQuality = Math.max(0.1, (100 - compressionStrength) / 100);

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      
      // Use 1.5 scale for balance between quality and performance. 
      // Higher scale = better text clarity but larger intermediate images.
      const viewport = page.getViewport({ scale: 1.5 }); 

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Could not get 2D context from canvas.');
      }
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport: viewport }).promise;

      // Convert canvas to JPEG with specified quality
      const imageDataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
      const imageBytes = await fetch(imageDataUrl).then(res => res.arrayBuffer());

      const embeddedImage = await newPdfDoc.embedJpg(imageBytes);
      const { width, height } = embeddedImage;

      const newPage = newPdfDoc.addPage([width, height]);
      newPage.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: width,
        height: height,
      });
    }

    const compressedPdfBytes = await newPdfDoc.save();

    const originalSize = new Blob([file.arrayBuffer]).size;
    const compressedSize = new Blob([compressedPdfBytes]).size;
    console.log(`Original PDF size: ${originalSize} bytes, Compressed PDF size: ${compressedSize} bytes`);

    return createProcessedFile(compressedPdfBytes, `compressed_${file.name}`, 'application/pdf');
  }


  /**
   * Converts a PDF file into an array of image files (JPG).
   */
  public async pdfToImages(file: AppFile): Promise<ProcessedFile[]> {
    if (!file.arrayBuffer) {
      throw new Error('File buffer is missing for PDF to image conversion.');
    }

    const pdfjs = await getPdfJs();

    // Create a copy of the ArrayBuffer as pdfjs.getDocument may detach it
    const pdfBufferCopy = file.arrayBuffer.slice(0);
    const loadingTask = pdfjs.getDocument({ data: pdfBufferCopy });
    const pdf = await loadingTask.promise;
    const images: ProcessedFile[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 }); // Adjust scale for desired image resolution

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Could not get 2D context from canvas.');
      }
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport: viewport }).promise;

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));

      if (blob) {
        const arrayBuffer = await blob.arrayBuffer();
        images.push(
          await createProcessedFile(
            new Uint8Array(arrayBuffer),
            `${file.name}_page_${i}.jpg`,
            'image/jpeg',
          ),
        );
      }
    }
    return images;
  }

  /**
   * Resizes PDF pages to a standard or custom size.
   */
  public async resizePdf(file: AppFile, targetSize: 'a4' | 'a3' | 'letter' | 'custom', customW?: number, customH?: number): Promise<ProcessedFile> {
    if (!file.arrayBuffer) throw new Error('File buffer missing');
    const srcPdf = await PDFDocument.load(file.arrayBuffer);
    const newPdf = await PDFDocument.create();

    // Size definitions (Points)
    const sizes: Record<string, [number, number]> = {
        'a4': [595.28, 841.89],
        'a3': [841.89, 1190.55],
        'letter': [612, 792]
    };

    let targetW: number, targetH: number;
    if (targetSize === 'custom' && customW && customH) {
        targetW = customW;
        targetH = customH;
    } else {
        [targetW, targetH] = sizes[targetSize] || sizes['a4'];
    }

    // Embed all pages from source to scale them
    const embeddedPages = await newPdf.embedPdf(srcPdf);
    
    for (let i = 0; i < embeddedPages.length; i++) {
        const embeddedPage = embeddedPages[i];
        const { width: srcW, height: srcH } = embeddedPage;
        
        // Scale to fit target, maintaining aspect ratio
        const scale = Math.min(targetW / srcW, targetH / srcH);
        const scaledW = srcW * scale;
        const scaledH = srcH * scale;
        
        const newPage = newPdf.addPage([targetW, targetH]);
        newPage.drawPage(embeddedPage, {
            x: (targetW - scaledW) / 2,
            y: (targetH - scaledH) / 2,
            width: scaledW,
            height: scaledH
        });
    }

    const bytes = await newPdf.save();
    return createProcessedFile(bytes, `resized_${file.name}`, 'application/pdf');
  }
}

export const pdfService = new PdfService();