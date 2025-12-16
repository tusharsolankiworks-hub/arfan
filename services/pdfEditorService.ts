
import { PDFDocument, rgb, StandardFonts, PDFFont, PDFName, PDFString, degrees } from 'pdf-lib';
import { AppFile, ProcessedFile } from '../types';
import { arrayBufferToDataURL } from '../utils/fileUtils';
import { pdfService, getPdfJs } from './pdfService';

export interface FabricObject {
  type: string;
  left: number;
  top: number;
  width: number;
  height: number;
  scaleX?: number;
  scaleY?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  underline?: boolean;
  linethrough?: boolean;
  angle?: number;
  opacity?: number;
  src?: string; 
  backgroundColor?: string;
  isOriginalText?: boolean; 
  rx?: number; 
  ry?: number;
  linkUrl?: string; 
  subtype?: string; 
  textAlign?: string;
}

export interface TextItem {
    str: string;
    transform: number[]; // [scaleX, skewY, skewX, scaleY, x, y]
    width: number;
    height: number;
}

const hexToRgb = (hex: string | undefined) => {
  if (!hex || typeof hex !== 'string' || hex === 'transparent') return undefined;
  if (hex.startsWith('rgb')) {
     const match = hex.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
     if (match) return rgb(parseInt(match[1])/255, parseInt(match[2])/255, parseInt(match[3])/255);
     return rgb(0,0,0);
  }
  const cleanHex = hex.replace('#', '');
  let r = 0, g = 0, b = 0;
  if (cleanHex.length === 3) {
      r = parseInt(cleanHex[0] + cleanHex[0], 16) / 255;
      g = parseInt(cleanHex[1] + cleanHex[1], 16) / 255;
      b = parseInt(cleanHex[2] + cleanHex[2], 16) / 255;
  } else if (cleanHex.length >= 6) {
      r = parseInt(cleanHex.slice(0, 2), 16) / 255;
      g = parseInt(cleanHex.slice(2, 4), 16) / 255;
      b = parseInt(cleanHex.slice(4, 6), 16) / 255;
  }
  return rgb(r, g, b);
};

export class PdfEditorService {
  /**
   * Processes an image to remove its background (make white pixels transparent).
   * @param imageSrc Base64 or URL of image
   * @param tolerance 0-255, how close to white to cut
   * @param opacity Output opacity 0-1
   */
  public async removeBackground(imageSrc: string, tolerance: number = 20, opacity: number = 1.0): Promise<string> {
      return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (!ctx) { resolve(imageSrc); return; }
              
              ctx.drawImage(img, 0, 0);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const data = imageData.data;
              
              for (let i = 0; i < data.length; i += 4) {
                  const r = data[i];
                  const g = data[i+1];
                  const b = data[i+2];
                  
                  // Simple "white-ish" check
                  // If pixel is light enough, make it transparent
                  if (r > 255 - tolerance && g > 255 - tolerance && b > 255 - tolerance) {
                      data[i+3] = 0; // Alpha 0
                  } else {
                      // Apply global opacity to non-transparent pixels if needed
                      if (opacity < 1.0) {
                          data[i+3] = Math.floor(data[i+3] * opacity);
                      }
                  }
              }
              
              ctx.putImageData(imageData, 0, 0);
              resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = reject;
          img.src = imageSrc;
      });
  }

  private async getPdfFont(pdfDoc: PDFDocument, family: string, weight: string = 'normal', style: string = 'normal'): Promise<PDFFont> {
    const isBold = weight === 'bold' || weight === '700';
    const isItalic = style === 'italic';
    
    // Normalize family name
    const fam = family.toLowerCase();

    if (fam.includes('times')) {
        if (isBold && isItalic) return pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);
        if (isBold) return pdfDoc.embedFont(StandardFonts.TimesRomanBold);
        if (isItalic) return pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
        return pdfDoc.embedFont(StandardFonts.TimesRoman);
    } 
    if (fam.includes('courier') || fam.includes('mono')) {
        if (isBold && isItalic) return pdfDoc.embedFont(StandardFonts.CourierBoldOblique);
        if (isBold) return pdfDoc.embedFont(StandardFonts.CourierBold);
        if (isItalic) return pdfDoc.embedFont(StandardFonts.CourierOblique);
        return pdfDoc.embedFont(StandardFonts.Courier);
    }
    // Default Helvetica (Arimo replacement)
    if (isBold && isItalic) return pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
    if (isBold) return pdfDoc.embedFont(StandardFonts.HelveticaBold);
    if (isItalic) return pdfDoc.embedFont(StandardFonts.HelveticaOblique);
    return pdfDoc.embedFont(StandardFonts.Helvetica);
  }

  public async extractTextData(file: AppFile): Promise<Map<number, TextItem[]>> {
      if (!file.arrayBuffer) throw new Error('File buffer missing');
      const pdfjs = await getPdfJs();
      const loadingTask = pdfjs.getDocument(file.arrayBuffer.slice(0));
      const pdf = await loadingTask.promise;
      
      const textMap = new Map<number, TextItem[]>();

      for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.0 });
          const textContent = await page.getTextContent();
          
          const items: TextItem[] = textContent.items.map((item: any) => {
              const tx = pdfjs.Util.transform(viewport.transform, item.transform);
              const fontSize = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]);
              return {
                  str: item.str,
                  transform: [tx[0], tx[1], tx[2], tx[3], tx[4], tx[5]], // x, y are at index 4, 5
                  width: item.width * (viewport.scale), 
                  height: fontSize
              };
          });
          
          // 0-based index for internal use
          textMap.set(i - 1, items);
      }
      return textMap;
  }

  public async savePdf(originalFile: AppFile, pagesData: { pageIndex: number, objects: FabricObject[] }[], scaleFactor: number = 1.0): Promise<ProcessedFile> {
    if (!originalFile.arrayBuffer) throw new Error('File buffer missing');
    const pdfDoc = await PDFDocument.load(originalFile.arrayBuffer);
    const pages = pdfDoc.getPages();
    
    for (const pageData of pagesData) {
        const page = pages[pageData.pageIndex];
        if (!page) continue;
        const { height: pageHeight } = page.getSize();
        
        for (const obj of pageData.objects) {
            // Skip helper objects
            if (obj.subtype === 'find_highlight') continue;
            if (obj.isOriginalText && obj.opacity === 0) continue;
            if (obj.type === 'rect' && obj.opacity === 0 && obj.fill === 'transparent') continue; 
            
            const scale = 1 / scaleFactor; 
            const x = obj.left * scale;
            const yRaw = obj.top * scale;
            const objScaleX = obj.scaleX || 1;
            const objScaleY = obj.scaleY || 1;
            const width = obj.width * objScaleX * scale;
            const height = obj.height * objScaleY * scale;
            
            // Fabric Y is top-down, PDF is bottom-up
            const y = pageHeight - yRaw - height; 
            const rotation = degrees(-(obj.angle || 0));

            // Setup Link if present
            if (obj.linkUrl) {
                const linkRef = pdfDoc.context.register(pdfDoc.context.obj({
                    Type: 'Annot', Subtype: 'Link', Rect: [x, y, x + width, y + height], Border: [0, 0, 0], A: { Type: 'Action', S: 'URI', URI: PDFString.of(obj.linkUrl) },
                }));
                const annots = page.node.Annots();
                if (annots) annots.push(linkRef);
                else page.node.set(PDFName.of('Annots'), pdfDoc.context.obj([linkRef]));
                
                // If it's just a link hotspot, we don't draw visual unless configured
                if (obj.subtype === 'link' && (!obj.stroke || obj.stroke === 'transparent')) continue; 
            }

            if (obj.type === 'rect' || obj.type === 'ellipse' || obj.type === 'circle') {
                let fillColor = hexToRgb(obj.fill);
                let strokeColor = hexToRgb(obj.stroke);
                let borderWidth = (obj.strokeWidth || 0) * scale;
                let opacity = obj.opacity ?? 1;
                
                // Whiteout logic
                if (obj.subtype === 'whiteout' || obj.fill === '#ffffff') { 
                    fillColor = rgb(1, 1, 1); 
                    opacity = 1.0; 
                }
                
                if (fillColor || (strokeColor && borderWidth > 0)) {
                    if (obj.type === 'ellipse' || obj.type === 'circle') {
                         page.drawEllipse({
                             x: x + width/2, y: y + height/2,
                             xScale: width/2, yScale: height/2,
                             color: fillColor, borderColor: strokeColor, borderWidth, opacity, rotate: rotation
                         });
                    } else {
                         page.drawRectangle({ x, y, width, height, color: fillColor, borderColor: strokeColor, borderWidth, opacity, rotate: rotation });
                    }
                }
            } 
            else if (obj.type === 'image' && obj.src) {
                 try {
                    let embeddedImage;
                    if (obj.src.startsWith('data:image/png')) embeddedImage = await pdfDoc.embedPng(obj.src);
                    else if (obj.src.startsWith('data:image/jpeg') || obj.src.startsWith('data:image/jpg')) embeddedImage = await pdfDoc.embedJpg(obj.src);
                    
                    if (embeddedImage) {
                        page.drawImage(embeddedImage, { x, y, width, height, opacity: obj.opacity ?? 1, rotate: rotation });
                    }
                 } catch (err) { console.error("Failed to embed image", err); }
            }
            else if (['i-text', 'text', 'textbox'].includes(obj.type)) {
                if (obj.text && obj.opacity !== 0) {
                    const fontSize = (obj.fontSize || 12) * objScaleY * scale;
                    const font = await this.getPdfFont(pdfDoc, obj.fontFamily || 'Helvetica', obj.fontWeight, obj.fontStyle);
                    const color = hexToRgb(obj.fill || '#000000');
                    
                    // Vertical alignment correction for PDF baseline
                    const textY = y + height - (fontSize * 0.2); 

                    page.drawText(obj.text, { x: x, y: textY, size: fontSize, font, color, opacity: obj.opacity ?? 1, rotate: rotation });
                    
                    const textWidth = font.widthOfTextAtSize(obj.text, fontSize);
                    
                    if (obj.underline) {
                        const underlineY = textY - (fontSize * 0.1); 
                        page.drawLine({
                            start: { x: x, y: underlineY },
                            end: { x: x + textWidth, y: underlineY },
                            thickness: fontSize * 0.05,
                            color: color,
                            opacity: obj.opacity ?? 1,
                        });
                    }
                }
            }
        }
    }
    const pdfBytes = await pdfDoc.save();
    return { id: crypto.randomUUID(), name: `edited_${originalFile.name}`, mimeType: 'application/pdf', dataUrl: arrayBufferToDataURL(pdfBytes.buffer, 'application/pdf'), size: pdfBytes.byteLength };
  }
}

export const pdfEditorService = new PdfEditorService();
