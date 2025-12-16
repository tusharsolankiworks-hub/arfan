
import * as JimpNamespace from 'jimp';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { AppFile, ProcessedFile } from '../types';
import { arrayBufferToDataURL, base64ToArrayBuffer, dataURLtoBlob } from '../utils/fileUtils';

// This handles the case where the module might be CJS wrapped in ESM or a named export.
// It prioritizes a named 'Jimp' export, falls back to a default export,
// and finally uses the namespace object itself. This robustly handles various module formats.
const Jimp = (JimpNamespace as any).Jimp || (JimpNamespace as any).default || JimpNamespace;

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

// Helper function to load an image from a data URL with strict validation
const loadImageFromDataUrl = (dataUrl: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        if (!dataUrl) {
            reject(new Error('Image URL is empty.'));
            return;
        }
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Ensure cross-origin loading if needed
        img.onload = () => {
            // CRITICAL FIX: Check dimensions. Broken images often load but have 0x0 size.
            if (img.naturalWidth === 0 || img.naturalHeight === 0) {
                reject(new Error('Image loaded but has 0 dimensions (corrupted data).'));
                return;
            }
            resolve(img);
        };
        img.onerror = () => reject(new Error('Failed to load image. It might be corrupted or in an unsupported format.'));
        img.src = dataUrl;
    });
};

export class ImageService {
  /**
   * Converts multiple image files into a single PDF document.
   */
  public async imagesToPdf(files: AppFile[]): Promise<ProcessedFile> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    for (const appFile of files) {
      if (!appFile.arrayBuffer) {
        console.warn(`Skipping image ${appFile.name} because its content (ArrayBuffer) is missing.`);
        continue;
      }
      
      const blob = new Blob([appFile.arrayBuffer], { type: appFile.type });
      const tempObjectURL = URL.createObjectURL(blob);
      
      try {
        const img = await loadImageFromDataUrl(tempObjectURL);

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Could not get 2D rendering context from canvas.');
        }
        ctx.drawImage(img, 0, 0);

        let embeddedImage;

        if (appFile.type === 'image/jpeg' || appFile.type === 'image/jpg') {
          const jpgDataUrl = canvas.toDataURL('image/jpeg', 0.92);
          const base64 = jpgDataUrl.split(',')[1];
          if (!base64) throw new Error('Invalid Data URL');
          const jpgBytes = base64ToArrayBuffer(base64);
          embeddedImage = await pdfDoc.embedJpg(jpgBytes);
        } else {
          const pngDataUrl = canvas.toDataURL('image/png');
          const base64 = pngDataUrl.split(',')[1];
          if (!base64) throw new Error('Invalid Data URL');
          const pngBytes = base64ToArrayBuffer(base64);
          embeddedImage = await pdfDoc.embedPng(pngBytes);
        }

        const { width, height } = embeddedImage;
        const page = pdfDoc.addPage([width, height]);
        page.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: width,
          height: height,
        });

        page.drawText(appFile.name, {
            x: 5,
            y: 5,
            font,
            size: 10,
            color: rgb(0.9, 0.9, 0.9),
            opacity: 0.75,
        });

      } catch (error) {
        console.error(`Error processing image ${appFile.name}:`, error);
        throw new Error(`Could not process image "${appFile.name}". It might be corrupted or in an unsupported format.`);
      } finally {
        URL.revokeObjectURL(tempObjectURL);
      }
    }

    const pdfBytes = await pdfDoc.save();
    return createProcessedFile(pdfBytes, 'images_to_pdf.pdf', 'application/pdf');
  }

  /**
   * Compresses an image file by re-encoding it as a JPEG using the browser's Canvas API.
   */
  public async compressImage(file: AppFile, compressionStrength: number = 75): Promise<ProcessedFile> {
    if (!file.arrayBuffer) {
        throw new Error('File buffer is missing for image compression.');
    }

    const dataUrl = arrayBufferToDataURL(file.arrayBuffer, file.type);
    const img = await loadImageFromDataUrl(dataUrl);
    
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Could not get 2D context from canvas.');
    }
    ctx.drawImage(img, 0, 0);

    const mimeType = 'image/jpeg';
    const jpegQuality = (100 - compressionStrength) / 100;
    const compressedDataUrl = canvas.toDataURL(mimeType, jpegQuality);
    
    const blob = await dataURLtoBlob(compressedDataUrl);
    const buffer = await blob.arrayBuffer();

    const newFileName = `${file.name.split('.').slice(0, -1).join('.')}_compressed.jpg`;
    
    return createProcessedFile(new Uint8Array(buffer), newFileName, mimeType);
  }

  /**
   * Converts an image file from one format to another.
   */
  public async convertImage(file: AppFile, targetMimeType: string): Promise<ProcessedFile> {
    if (!file.arrayBuffer) {
      throw new Error('File buffer is missing for image conversion.');
    }
    
    const dataUrl = arrayBufferToDataURL(file.arrayBuffer, file.type);
    let convertedBuffer: Uint8Array;
    let outputExtension: string;
    
    if (targetMimeType === 'image/jpeg' || targetMimeType === 'image/png') {
        const img = await loadImageFromDataUrl(dataUrl);
        
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get 2D context from canvas.');
        }
        ctx.drawImage(img, 0, 0);

        const convertedDataUrl = canvas.toDataURL(targetMimeType, 0.92);
        const blob = await dataURLtoBlob(convertedDataUrl);
        convertedBuffer = new Uint8Array(await blob.arrayBuffer());
        outputExtension = targetMimeType.split('/')[1];

    } else if (targetMimeType === 'image/bmp') {
        const jimpImage = await Jimp.read(dataUrl);
        convertedBuffer = await jimpImage.getBufferAsync(Jimp.MIME_BMP);
        outputExtension = 'bmp';
    } else {
        throw new Error(`Unsupported target MIME type for image conversion: ${targetMimeType}`);
    }
    
    const newFileName = `${file.name.split('.').slice(0, -1).join('.')}.${outputExtension}`;
    return createProcessedFile(convertedBuffer, newFileName, targetMimeType);
  }

  /**
   * Resizes an image to the specified width and height.
   */
  public async resizeImage(file: AppFile, width: number, height: number): Promise<ProcessedFile> {
    if (!file.arrayBuffer) {
      throw new Error('File buffer is missing for image resizing.');
    }
    
    const dataUrl = arrayBufferToDataURL(file.arrayBuffer, file.type);
    const img = await loadImageFromDataUrl(dataUrl);
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get 2D context from canvas for resizing.');
    }

    ctx.drawImage(img, 0, 0, width, height);

    const resizedDataUrl = canvas.toDataURL(file.type);
    const blob = await dataURLtoBlob(resizedDataUrl);
    const buffer = await blob.arrayBuffer();

    return createProcessedFile(
      new Uint8Array(buffer),
      `resized_${file.name}`,
      file.type,
    );
  }

  /**
   * Merges multiple images into a single image horizontally or vertically.
   */
  public async mergeImages(
    files: AppFile[],
    direction: 'vertical' | 'horizontal',
    gap: number = 0,
    backgroundColor: string = '#ffffff',
    quality: number = 0.92
  ): Promise<ProcessedFile> {
    if (files.length === 0) throw new Error("No images to merge");

    // Load all images
    const images = await Promise.all(files.map(f => {
      if (!f.arrayBuffer) throw new Error(`Buffer missing for ${f.name}`);
      const url = arrayBufferToDataURL(f.arrayBuffer, f.type);
      return loadImageFromDataUrl(url);
    }));

    // Calculate dimensions
    let canvasWidth = 0;
    let canvasHeight = 0;

    if (direction === 'vertical') {
      canvasWidth = Math.max(...images.map(i => i.naturalWidth));
      canvasHeight = images.reduce((sum, img) => sum + img.naturalHeight, 0) + (gap * (images.length - 1));
    } else {
      canvasWidth = images.reduce((sum, img) => sum + img.naturalWidth, 0) + (gap * (images.length - 1));
      canvasHeight = Math.max(...images.map(i => i.naturalHeight));
    }

    // Guard against 0 dimensions
    if (canvasWidth === 0 || canvasHeight === 0) {
       throw new Error("Resulting image dimensions are zero.");
    }

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Canvas context failed");

    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw images
    let currentX = 0;
    let currentY = 0;

    images.forEach((img) => {
      let drawX = currentX;
      let drawY = currentY;

      // Center align on the secondary axis
      if (direction === 'vertical') {
        drawX = (canvasWidth - img.naturalWidth) / 2;
      } else {
        drawY = (canvasHeight - img.naturalHeight) / 2;
      }

      ctx.drawImage(img, drawX, drawY);

      if (direction === 'vertical') {
        currentY += img.naturalHeight + gap;
      } else {
        currentX += img.naturalWidth + gap;
      }
    });

    // Use JPEG for output if quality slider is used, to handle compression
    const mimeType = 'image/jpeg';
    const dataUrl = canvas.toDataURL(mimeType, quality);
    const blob = await dataURLtoBlob(dataUrl);
    const buffer = await blob.arrayBuffer();

    return createProcessedFile(new Uint8Array(buffer), `merged_image_${Date.now()}.jpg`, mimeType);
  }
}

export const imageService = new ImageService();
