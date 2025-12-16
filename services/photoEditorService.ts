
import { AppFile, ProcessedFile } from '../types';
import { arrayBufferToDataURL, base64ToArrayBuffer, dataURLtoBlob } from '../utils/fileUtils';
import { GoogleGenAI } from "@google/genai";

declare const fabric: any;

export interface AdjustSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  noise: number;
  pixelate: number;
}

export class PhotoEditorService {
  private genAi: GoogleGenAI | null = null;
  private upscaler: any = null;

  private getGenAI() {
    // Always instantiate new to ensure fresh API key from env if it changes
    if (!process.env.API_KEY) {
        throw new Error("API Key missing. Please set it in the AI Studio sidebar.");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private async getUpscaler() {
    if (this.upscaler) return this.upscaler;
    try {
        const { default: Upscaler } = await import('upscaler');
        const { default: esrgan } = await import('@upscalerjs/esrgan-slim');
        this.upscaler = new Upscaler({ model: esrgan });
        return this.upscaler;
    } catch (e) {
        console.error("Upscaler load failed:", e);
        throw new Error("AI Upscaler failed to load. Please check your internet connection.");
    }
  }

  /**
   * Generative Edit: Uses Gemini to modify the image based on a prompt.
   * Uses 'gemini-2.5-flash-image' for fast multimodal editing.
   */
  public async generativeEdit(canvas: any, prompt: string): Promise<void> {
    const ai = this.getGenAI();
    
    // Resize Logic: Ensure image isn't too massive for the API (avoids 500 Errors & Timeouts)
    // Reduced to 768px and 60% quality to ensure payload fits within limits.
    const maxDim = 768;
    const currentMax = Math.max(canvas.width, canvas.height);
    const multiplier = currentMax > maxDim ? maxDim / currentMax : 1;

    // Export current canvas state with resizing
    const dataUrl = canvas.toDataURL({ format: 'jpeg', quality: 0.6, multiplier: multiplier });
    const base64Image = dataUrl.split(',')[1];

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: base64Image
                        }
                    },
                    { text: `Edit this image: ${prompt}. Return ONLY the edited image.` }
                ]
            }
        });

        let newImageBase64 = null;
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    newImageBase64 = part.inlineData.data;
                    break;
                }
            }
        }

        if (!newImageBase64) {
             throw new Error("AI did not return an image. It might have refused the request due to safety policies. Please try a different prompt.");
        }

        const newSrc = `data:image/png;base64,${newImageBase64}`;

        fabric.Image.fromURL(newSrc, (img: any) => {
            // Calculate scale to restore original size relative to canvas
            // If we downscaled to send to API, the result comes back small. 
            // We need to fit it back into the canvas area properly.
            
            img.set({
                left: canvas.width / 2,
                top: canvas.height / 2,
                originX: 'center',
                originY: 'center',
                id: `ai-gen-${Date.now()}`
            });
            
            // Scale to fill canvas loosely (matching the original visual bounds)
            const scaleX = canvas.width / img.width;
            const scaleY = canvas.height / img.height;
            const scale = Math.min(scaleX, scaleY);
            
            // Restore scale considering padding (80% fit)
            img.scale(scale * 0.8);

            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
        });

    } catch (e) {
        console.error("GenAI Edit Error", e);
        if (e instanceof Error) {
            if (e.message.includes("500") || e.message.includes("xhr")) {
                throw new Error("Image too large or server busy. Please try again with a smaller image or simpler prompt.");
            }
            throw e;
        }
        throw new Error("Generative Edit failed. Please check your API key.");
    }
  }

  /**
   * Analyzes the image to provide editing suggestions using Gemini 2.5 Flash.
   */
  public async analyzeImage(canvas: any): Promise<{label: string, action: string}[]> {
    const ai = this.getGenAI();
    // Use low res for analysis to be fast and cheap (max 512px)
    const maxDim = 512;
    const currentMax = Math.max(canvas.width, canvas.height);
    const multiplier = currentMax > maxDim ? maxDim / currentMax : 1;

    const dataUrl = canvas.toDataURL({ format: 'jpeg', quality: 0.6, multiplier: multiplier });
    const base64Image = dataUrl.split(',')[1];

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
                    { text: 'Analyze this image. Suggest 4 very short photo editing actions (max 3 words each) that would improve it (e.g. "Fix Lighting", "Remove Background", "Upscale"). Return JSON: [{ "label": "Fix Lighting", "action": "auto_enhance" }]. Use actions: "remove_bg", "upscale", "auto_enhance", or "prompt:<description>" for creative edits.' }
                ]
            },
            config: { responseMimeType: 'application/json' }
        });
        
        return JSON.parse(response.text || '[]');
    } catch (e) {
        console.warn("AI Suggestion Error", e);
        return [
            { label: "Remove Background", action: "remove_bg" },
            { label: "Auto Enhance", action: "auto_enhance" },
            { label: "Upscale 2x", action: "upscale" },
            { label: "Cinematic Filter", action: "prompt:Add a cinematic filter" }
        ]; 
    }
  }

  /**
   * Upscales the active image using AI.
   */
  public async upscaleImage(canvas: any): Promise<void> {
      const active = canvas.getActiveObject() || canvas.getObjects().find((o: any) => o.id === 'main-image');
      if (!active || active.type !== 'image') throw new Error("No image selected to upscale.");

      const upscaler = await this.getUpscaler();
      
      // Get raw image data
      const dataUrl = active.toDataURL({ format: 'png', multiplier: 1 });
      
      // Upscale
      const upscaledSrc = await upscaler.upscale(dataUrl, {
          patchSize: 64,
          padding: 2
      });

      return new Promise((resolve) => {
          fabric.Image.fromURL(upscaledSrc, (img: any) => {
              // Replace old image
              img.set({
                  left: active.left,
                  top: active.top,
                  originX: active.originX,
                  originY: active.originY,
                  scaleX: active.scaleX / 2, // Compensate for 2x upscale visually
                  scaleY: active.scaleY / 2,
                  angle: active.angle,
                  flipX: active.flipX,
                  flipY: active.flipY,
                  id: active.id
              });
              
              canvas.remove(active);
              canvas.add(img);
              canvas.setActiveObject(img);
              canvas.renderAll();
              resolve();
          });
      });
  }

  /**
   * Magic Background Remover (Client-Side Pixel Logic)
   */
  public async removeBackground(activeObj: any): Promise<void> {
      if (!activeObj || !activeObj._element) return;
      
      return new Promise((resolve) => {
          const imgElem = activeObj._element;
          const canvas = document.createElement('canvas');
          canvas.width = activeObj.width;
          canvas.height = activeObj.height;
          const ctx = canvas.getContext('2d');
          if(!ctx) { resolve(); return; }
          
          ctx.drawImage(imgElem, 0, 0, activeObj.width, activeObj.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Simple corner sampling for bg color
          const corners = [0, (canvas.width - 1) * 4, (canvas.width * canvas.height - canvas.width) * 4, (canvas.width * canvas.height - 1) * 4];
          let r = 0, g = 0, b = 0, count = 0;
          
          corners.forEach(i => {
              r += data[i]; g += data[i+1]; b += data[i+2]; count++;
          });
          r /= count; g /= count; b /= count;
          
          const threshold = 30; 
          
          for(let i=0; i<data.length; i+=4) {
              const dr = Math.abs(data[i] - r);
              const dg = Math.abs(data[i+1] - g);
              const db = Math.abs(data[i+2] - b);
              
              if(dr < threshold && dg < threshold && db < threshold) {
                  data[i+3] = 0;
              }
          }
          
          ctx.putImageData(imageData, 0, 0);
          
          const newSrc = canvas.toDataURL();
          activeObj.setSrc(newSrc, () => {
              activeObj.canvas?.renderAll();
              resolve();
          });
      });
  }

  /**
   * Applies common photo filters using Fabric.js
   */
  public applyFilters(activeObj: any, settings: AdjustSettings) {
      if (!activeObj) return;
      
      const filters: any[] = [];

      if (settings.brightness !== 0) {
          filters.push(new fabric.Image.filters.Brightness({ brightness: settings.brightness }));
      }
      if (settings.contrast !== 0) {
          filters.push(new fabric.Image.filters.Contrast({ contrast: settings.contrast }));
      }
      if (settings.saturation !== 0) {
          filters.push(new fabric.Image.filters.Saturation({ saturation: settings.saturation }));
      }
      if (settings.blur > 0) {
          filters.push(new fabric.Image.filters.Blur({ blur: settings.blur }));
      }
      if (settings.noise > 0) {
          filters.push(new fabric.Image.filters.Noise({ noise: settings.noise }));
      }
      if (settings.pixelate > 0) {
          filters.push(new fabric.Image.filters.Pixelate({ blocksize: settings.pixelate * 10 }));
      }

      activeObj.filters = filters;
      activeObj.applyFilters();
      activeObj.canvas?.requestRenderAll();
  }
}

export const photoEditorService = new PhotoEditorService();
