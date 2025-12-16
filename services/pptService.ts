
import { ProcessedFile } from '../types';
import { arrayBufferToDataURL } from '../utils/fileUtils';

class PptService {
  /**
   * Generates a PowerPoint (.pptx) file from extracted slide content.
   * @param slidesData Array of objects containing title, body, bullets.
   * @param filename Output filename.
   */
  public async generatePpt(slidesData: { title: string, body: string, bullets: string[] }[], filename: string): Promise<ProcessedFile> {
    let PptxGenJS;
    try {
        // Try dynamic import from importmap
        const module = await import('pptxgenjs');
        PptxGenJS = module.default || module;
    } catch (e) {
        console.error("PPTX module load failed", e);
        // Fallback to global if script tag loaded it
        if ((window as any).PptxGenJS) {
            PptxGenJS = (window as any).PptxGenJS;
        } else {
            throw new Error("Failed to load PowerPoint engine. Please check internet connection.");
        }
    }

    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    slidesData.forEach((slideContent) => {
      const slide = pptx.addSlide();

      // Title
      if (slideContent.title) {
        slide.addText(slideContent.title, { 
            x: 0.5, y: 0.5, w: '90%', h: 1, 
            fontSize: 24, bold: true, color: '000000', align: 'center' 
        });
      }

      // Body Text
      if (slideContent.body) {
        slide.addText(slideContent.body, { 
            x: 0.5, y: 1.5, w: '90%', h: 2, 
            fontSize: 14, color: '333333' 
        });
      }

      // Bullets
      if (slideContent.bullets && slideContent.bullets.length > 0) {
        const bulletItems = slideContent.bullets.map(b => ({ text: b, options: { breakLine: true } }));
        // Start lower if body text exists
        const startY = slideContent.body ? 3.5 : 1.5;
        
        slide.addText(bulletItems, {
            x: 0.5, y: startY, w: '90%', h: '50%',
            fontSize: 14, color: '333333', bullet: true,
            paraSpaceBefore: 10
        });
      }
    });

    // Generate blob
    const pptBlob = await pptx.write({ outputType: 'blob' });
    const arrayBuffer = await pptBlob.arrayBuffer();
    const dataUrl = arrayBufferToDataURL(arrayBuffer, 'application/vnd.openxmlformats-officedocument.presentationml.presentation');

    return {
      id: crypto.randomUUID(),
      name: filename.replace('.pdf', '.pptx'),
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      dataUrl: dataUrl,
      size: pptBlob.size
    };
  }
}

export const pptService = new PptService();
