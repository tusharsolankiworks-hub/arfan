import { AppFile, ProcessedFile } from '../types';
import { arrayBufferToDataURL, dataURLtoBlob } from '../utils/fileUtils';
import { geminiService } from './geminiService';

declare const fabric: any;

export interface EnhanceSettings {
  sharpen: number; // 0-1
  contrast: number; // -1 to 1
  brightness: number; // -1 to 1
}

export interface AnalysisResult {
  blurScore: number;
  suggestedUpscale: 2 | 4;
  suggestedSharpen: 'low' | 'medium' | 'high';
}

class ImageEnhancerService {
  private upscaler: any = null;

  /**
   * Initializes the AI Upscaler. Lazy loaded to save resources.
   */
  private async getUpscaler() {
    if (this.upscaler) return this.upscaler;
    
    try {
      // Dynamic import to avoid loading heavy TFJS unless needed
      // Note: These must be in the importmap for this to work cleanly in browser
      const { default: Upscaler } = await import('upscaler');
      const { default: esrgan } = await import('@upscalerjs/esrgan-slim');
      
      this.upscaler = new Upscaler({
        model: esrgan,
      });
      return this.upscaler;
    } catch (e) {
      console.error("Failed to load UpscalerJS", e);
      throw new Error("AI Engine failed to load. Please check your internet connection.");
    }
  }

  /**
   * Loads an image file into a Fabric canvas for processing
   */
  public async loadToCanvas(file: AppFile, canvas: any): Promise<void> {
    if (!file.arrayBuffer) throw new Error("File content not loaded");
    const dataUrl = arrayBufferToDataURL(file.arrayBuffer, file.type);
    
    return new Promise((resolve) => {
        fabric.Image.fromURL(dataUrl, (img: any) => {
            canvas.clear();
            
            // Store original dims for reference
            canvas.originalWidth = img.width;
            canvas.originalHeight = img.height;

            // Fit to canvas
            const scale = Math.min(
                canvas.width / img.width, 
                canvas.height / img.height
            );
            
            img.set({
                originX: 'center',
                originY: 'center',
                left: canvas.width / 2,
                top: canvas.height / 2,
                scaleX: scale,
                scaleY: scale,
                selectable: false,
                id: 'main-image'
            });

            canvas.add(img);
            canvas.renderAll();
            resolve();
        });
    });
  }

  /**
   * Applies manual enhancement filters using Fabric.js
   * Optimized for "De-blur" effect using Convolution
   */
  public applyManualFilters(canvas: any, settings: EnhanceSettings) {
      if (!canvas) return;
      const img = canvas.getObjects().find((o: any) => o.id === 'main-image');
      if (!img) return;

      img.filters = [];

      // 1. Sharpen (Convolution)
      // Kernel for Unsharp Masking
      // [ 0 -s  0 ]
      // [-s 4s+1 -s]
      // [ 0 -s  0 ]
      // s = strength
      if (settings.sharpen > 0) {
          const s = settings.sharpen; 
          const matrix = [
              0, -s, 0,
              -s, 4 * s + 1, -s,
              0, -s, 0
          ];
          img.filters.push(new fabric.Image.filters.Convolute({
              matrix: matrix
          }));
      }

      // 2. Contrast
      if (settings.contrast !== 0) {
          img.filters.push(new fabric.Image.filters.Contrast({
              contrast: settings.contrast
          }));
      }

      // 3. Brightness
      if (settings.brightness !== 0) {
          img.filters.push(new fabric.Image.filters.Brightness({
              brightness: settings.brightness
          }));
      }

      img.applyFilters();
      canvas.requestRenderAll();
  }

  /**
   * Uses Gemini to analyze the image blur and suggest settings
   */
  public async analyzeImage(file: AppFile): Promise<AnalysisResult> {
      if (!file.arrayBuffer) throw new Error("File missing");
      const base64 = arrayBufferToDataURL(file.arrayBuffer, file.type).split(',')[1];

      const prompt = `Analyze this image for blur/sharpness issues.
      Return a JSON object with:
      1. "blurScore" (0 to 100, where 100 is very blurry).
      2. "suggestedUpscale" (integer 2 or 4). Use 4 if image is small (<800px) and blurry.
      3. "suggestedSharpen" (string: "low", "medium", "high").
      `;

      try {
          const result = await geminiService.generateJson(prompt, [base64]);
          return {
              blurScore: result.blurScore || 0,
              suggestedUpscale: result.suggestedUpscale || 2,
              suggestedSharpen: result.suggestedSharpen || 'medium'
          };
      } catch (e) {
          // Fallback if AI fails
          return { blurScore: 50, suggestedUpscale: 2, suggestedSharpen: 'medium' };
      }
  }

  /**
   * AI Super-Resolution using UpscalerJS (ESRGAN)
   * Runs client-side.
   */
  public async upscaleAI(file: AppFile, factor: 2 | 4, onProgress?: (percent: number) => void): Promise<string> {
      const upscaler = await this.getUpscaler();
      const dataUrl = arrayBufferToDataURL(file.arrayBuffer!, file.type);

      // Load image to get dims
      const img = new Image();
      await new Promise(r => { img.onload = r; img.src = dataUrl; });

      // If image is large, prevent 4x to avoid crash
      if (img.width * img.height > 2000000 && factor === 4) {
          console.warn("Image too large for 4x, falling back to 2x");
          factor = 2;
      }

      try {
          const upscaledDataUrl = await upscaler.upscale(dataUrl, {
              patchSize: 64, // Process in chunks to avoid UI freeze
              padding: 2,
              progress: (progress: number) => {
                  if (onProgress) onProgress(Math.round(progress * 100));
              }
          });
          return upscaledDataUrl;
      } catch (e) {
          console.error("Upscale failed", e);
          throw new Error("Upscaling failed. The image might be too complex for this device's GPU.");
      }
  }

  /**
   * Export the canvas content to a high-quality file
   */
  public async exportCanvas(canvas: any, filename: string): Promise<ProcessedFile> {
      // Revert scaling for export to get full resolution processing
      const img = canvas.getObjects().find((o: any) => o.id === 'main-image');
      if (!img) throw new Error("No image");

      const originalScaleX = img.scaleX;
      const originalScaleY = img.scaleY;
      const originalLeft = img.left;
      const originalTop = img.top;

      // Reset to natural size for full res export
      img.set({ scaleX: 1, scaleY: 1, left: 0, top: 0, originX: 'left', originY: 'top' });
      
      // Create a temp canvas for export at full resolution
      // We can't easily clone filter application without rendering
      // Trick: Use toDataURL with multiplier
      
      // Restore view
      img.set({ scaleX: originalScaleX, scaleY: originalScaleY, left: originalLeft, top: originalTop, originX: 'center', originY: 'center' });
      
      // Multiplier to match original resolution
      const multiplier = canvas.originalWidth / (img.width * img.scaleX);
      
      const dataUrl = canvas.toDataURL({
          format: 'jpeg',
          quality: 0.95,
          multiplier: multiplier,
          enableRetinaScaling: true
      });

      const blob = await dataURLtoBlob(dataUrl);
      return {
          id: crypto.randomUUID(),
          name: `enhanced_${filename}`,
          mimeType: 'image/jpeg',
          dataUrl: dataUrl,
          size: blob.size
      };
  }
}

export const imageEnhancerService = new ImageEnhancerService();