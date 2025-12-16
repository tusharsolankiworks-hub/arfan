import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { AppFile, ProcessedFile } from '../types';
import { arrayBufferToDataURL } from '../utils/fileUtils';

export interface TextWatermarkSettings {
  text: string;
  fontSize: number;
  opacity: number;
  rotation: number;
  color: string;
  isTiled: boolean;
  position: { x: number; y: number }; // Percentage (0-100)
}

export interface ImageWatermarkSettings {
  imageFile: File | null;
  opacity: number;
  rotation: number;
  scale: number;
  isTiled: boolean;
  position: { x: number; y: number }; // Percentage (0-100)
}

class WatermarkService {
  
  private hexToRgb(hex: string) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return rgb(r, g, b);
  }

  public async addTextWatermark(file: AppFile, settings: TextWatermarkSettings): Promise<ProcessedFile> {
    if (!file.arrayBuffer) throw new Error("File buffer missing");

    const pdfDoc = await PDFDocument.load(file.arrayBuffer);
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();

    const color = this.hexToRgb(settings.color);
    const opacity = settings.opacity / 100;

    for (const page of pages) {
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(settings.text, settings.fontSize);
      const textHeight = settings.fontSize;
      
      if (settings.isTiled) {
        // Tiled Logic
        const gap = 200; // Spacing between tiles
        
        // Loop heavily to cover page including rotation spillover
        for (let x = -width; x < width * 2; x += textWidth + gap) {
          for (let y = -height; y < height * 2; y += gap) {
             page.drawText(settings.text, {
                x: x,
                y: y,
                size: settings.fontSize,
                font: font,
                color: color,
                opacity: opacity,
                rotate: degrees(settings.rotation), 
             });
          }
        }
      } else {
        // Single Position Logic
        // Convert UI Percentage Position (Top-Left origin) to PDF Points (Bottom-Left origin)
        const x = (settings.position.x / 100) * width - (textWidth / 2); 
        const y = height - ((settings.position.y / 100) * height) - (textHeight / 2); 

        page.drawText(settings.text, {
          x: x,
          y: y,
          size: settings.fontSize,
          font: font,
          color: color,
          opacity: opacity,
          rotate: degrees(settings.rotation),
        });
      }
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const dataUrl = arrayBufferToDataURL(pdfBytes.buffer, 'application/pdf');

    return {
      id: crypto.randomUUID(),
      name: `watermarked_${file.name}`,
      mimeType: 'application/pdf',
      dataUrl,
      size: blob.size
    };
  }

  public async addImageWatermark(file: AppFile, settings: ImageWatermarkSettings): Promise<ProcessedFile> {
    if (!file.arrayBuffer) throw new Error("File buffer missing");
    if (!settings.imageFile) throw new Error("No watermark image provided");

    const pdfDoc = await PDFDocument.load(file.arrayBuffer);
    const pages = pdfDoc.getPages();

    // Load Image
    const imageBytes = await settings.imageFile.arrayBuffer();
    let embeddedImage;
    if (settings.imageFile.type === 'image/png') {
        embeddedImage = await pdfDoc.embedPng(imageBytes);
    } else {
        embeddedImage = await pdfDoc.embedJpg(imageBytes);
    }

    const opacity = settings.opacity / 100;
    const imgDims = embeddedImage.scale(settings.scale);

    for (const page of pages) {
      const { width, height } = page.getSize();

      if (settings.isTiled) {
         const gap = 200;
         for (let x = -width; x < width * 2; x += imgDims.width + gap) {
            for (let y = -height; y < height * 2; y += gap) {
               page.drawImage(embeddedImage, {
                  x: x,
                  y: y,
                  width: imgDims.width,
                  height: imgDims.height,
                  opacity: opacity,
                  rotate: degrees(settings.rotation),
               });
            }
         }
      } else {
         const x = (settings.position.x / 100) * width - (imgDims.width / 2);
         const y = height - ((settings.position.y / 100) * height) - (imgDims.height / 2);

         page.drawImage(embeddedImage, {
            x: x,
            y: y,
            width: imgDims.width,
            height: imgDims.height,
            opacity: opacity,
            rotate: degrees(settings.rotation),
         });
      }
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const dataUrl = arrayBufferToDataURL(pdfBytes.buffer, 'application/pdf');

    return {
      id: crypto.randomUUID(),
      name: `watermarked_${file.name}`,
      mimeType: 'application/pdf',
      dataUrl,
      size: blob.size
    };
  }
}

export const watermarkService = new WatermarkService();