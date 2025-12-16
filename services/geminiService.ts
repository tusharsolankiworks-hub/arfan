
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_TEXT } from '../constants';
import { arrayBufferToBase64 } from '../utils/fileUtils';

export class GeminiService {
  private getAiInstance(): GoogleGenAI {
    // Instantiate GoogleGenAI right before the API call to ensure it uses the latest API_KEY from the environment.
    if (!process.env.API_KEY) {
      throw new Error("API_KEY is not set in environment variables. Please select an API key in the AI Studio sidebar.");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  /**
   * Helper to execute an async function with retry logic.
   * @param fn The async function to execute.
   * @param maxRetries Maximum number of retries.
   * @param baseDelayMs Base delay for exponential backoff.
   * @returns A Promise that resolves with the result of `fn`.
   */
  private async callWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelayMs: number = 1000, // 1 second
  ): Promise<T> {
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        console.error(`Attempt ${i + 1}/${maxRetries + 1} failed:`, error);
        if (i < maxRetries) {
          const delay = baseDelayMs * Math.pow(2, i); // Exponential backoff
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // If all retries failed, re-throw a more informative error
          let errorMessage = "An unknown error occurred.";
          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (typeof error === 'object' && error !== null && 'status' in error && 'message' in error) {
            errorMessage = `${(error as any).status}: ${(error as any).message}`;
          }
          throw new Error(`API call failed after ${maxRetries + 1} attempts: ${errorMessage}`);
        }
      }
    }
    throw new Error('Unexpected state in callWithRetry'); // Should not be reached
  }

  /**
   * Summarizes the text content of a PDF using the Gemini API.
   * @param pdfArrayBuffer The ArrayBuffer of the PDF file.
   * @returns A Promise that resolves with the summary text.
   */
  public async summarizePdf(pdfArrayBuffer: ArrayBuffer): Promise<string> {
    return this.callWithRetry(async () => {
      const ai = this.getAiInstance();
      const pdfBase64 = arrayBufferToBase64(pdfArrayBuffer);

      const prompt = `Please summarize the key content and main points of the following PDF document.
                      Focus on providing a concise overview that captures the essence of the document.`;

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: pdfBase64,
              },
            },
          ],
        },
      });

      return response.text;
    });
  }

  /**
   * Performs Optical Character Recognition (OCR) on a PDF document using the Gemini API.
   * Extracts all text content from the PDF, including scanned or image-based pages.
   * @param pdfArrayBuffer The ArrayBuffer of the PDF file.
   * @returns A Promise that resolves with the extracted text content.
   */
  public async ocrPdf(pdfArrayBuffer: ArrayBuffer): Promise<string> {
    return this.callWithRetry(async () => {
      const ai = this.getAiInstance();
      const pdfBase64 = arrayBufferToBase64(pdfArrayBuffer);

      const prompt = `Extract all text content from the following PDF document.
                      Provide the extracted text as a plain string, preserving as much of the original formatting (paragraphs, line breaks) as possible.
                      Do not add any introductory or concluding remarks, just the raw extracted text.`;

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: pdfBase64,
              },
            },
          ],
        },
      });

      return response.text;
    });
  }

  /**
   * Identifies the type of document based on an image of its first page.
   * Used for auto-labeling split PDF sections.
   * @param imageBase64 Base64 string of the page image (JPEG).
   * @returns A Promise resolving to a short 1-3 word label (e.g., "Invoice", "Tax Form").
   */
  public async identifyDocumentType(imageBase64: string): Promise<string> {
    return this.callWithRetry(async () => {
      const ai = this.getAiInstance();

      // Remove data URL prefix if present
      const cleanBase64 = imageBase64.split(',')[1] || imageBase64;

      const prompt = `Look at this document page. Provide a very short file name label (1-3 words max) that describes what this document is (e.g., "Invoice", "Bank Statement", "Resume", "Contract"). Return ONLY the label, no punctuation.`;

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: cleanBase64,
              },
            },
          ],
        },
      });

      return response.text.trim();
    });
  }

  /**
   * Proofreads the given text, correcting grammar and spelling errors.
   * @param text The text to proofread.
   * @returns The corrected text.
   */
  public async proofreadText(text: string): Promise<string> {
    return this.callWithRetry(async () => {
      const ai = this.getAiInstance();

      const prompt = `You are a professional editor. Proofread the following text for grammar, spelling, and punctuation errors. 
      Return ONLY the corrected version of the text. Do not add any conversational filler, explanations, or markdown code blocks unless the original text had them. 
      Preserve the original paragraph structure as much as possible.
      
      Text to proofread:
      ${text}`;

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: {
          parts: [{ text: prompt }],
        },
      });

      return response.text.trim();
    });
  }

  /**
   * Reformats raw extracted text into a structured JSON format for Word document generation.
   * Identifies headings, lists, and paragraphs.
   * @param text The raw text extracted from a PDF.
   * @returns A JSON string representing the document structure.
   */
  public async reformatTextForWord(text: string): Promise<string> {
    return this.callWithRetry(async () => {
      const ai = this.getAiInstance();

      const prompt = `Analyze the following extracted text. Structure it into a JSON array suitable for generating a Word document.
      Identify headings (Title, Heading 1, Heading 2), bullet points, and standard paragraphs.
      
      Output strictly a JSON array of objects with this schema:
      { "type": "title" | "heading1" | "heading2" | "bullet" | "paragraph", "content": "string" }

      Do not change the meaning of the text, just structure it.
      If the text is too long, summarize sections but keep the structure.
      Return ONLY the raw JSON string. No markdown code fences.

      Text:
      ${text.substring(0, 30000)} 
      `; // Limit context to avoid token limits, though 2.5 flash is generous

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          responseMimeType: 'application/json'
        }
      });

      return response.text.trim();
    });
  }

  /**
   * Generates a structured JSON response based on text prompt and optional images.
   * Useful for analyzing images and getting structured data back.
   * @param prompt The text prompt.
   * @param imagesBase64 Array of base64 encoded image strings.
   * @returns Parsed JSON object.
   */
  public async generateJson(prompt: string, imagesBase64: string[] = []): Promise<any> {
    return this.callWithRetry(async () => {
      const ai = this.getAiInstance();
      
      const parts: any[] = [{ text: prompt }];
      
      for (const img of imagesBase64) {
          // Remove data URL prefix if present
          const cleanBase64 = img.split(',')[1] || img;
          parts.push({
              inlineData: {
                  mimeType: 'image/jpeg',
                  data: cleanBase64
              }
          });
      }

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: {
          parts: parts,
        },
        config: {
          responseMimeType: 'application/json'
        }
      });

      try {
        return JSON.parse(response.text);
      } catch (e) {
        console.error("Failed to parse JSON response", response.text);
        throw new Error("AI response was not valid JSON.");
      }
    });
  }

  /**
   * Extracts tabular data from an image for Excel conversion.
   * @param imageBase64 The base64 string of the image containing the table.
   * @returns A JSON object representing the table data (array of rows).
   */
  public async extractTableData(imageBase64: string): Promise<{ rows: string[][] }> {
    return this.callWithRetry(async () => {
      const ai = this.getAiInstance();
      const cleanBase64 = imageBase64.split(',')[1] || imageBase64;

      const prompt = `Analyze this image. Identify any tables or structured data grids.
      Extract the content into a 2D array of strings representing rows and columns.
      If there are merged cells, duplicate the value or leave empty as appropriate to maintain grid structure.
      Return ONLY a JSON object with this schema:
      { "rows": [ ["Header1", "Header2"], ["Row1Col1", "Row1Col2"] ] }
      If no table is found, return { "rows": [] } but still attempt to extract text line by line as rows.`;

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } }
          ],
        },
        config: { responseMimeType: 'application/json' }
      });

      try {
        return JSON.parse(response.text);
      } catch (e) {
        throw new Error("Failed to parse AI response for table extraction.");
      }
    });
  }

  /**
   * Extracts slide content (title, bullets, body) from an image for PowerPoint conversion.
   * @param imageBase64 The base64 string of the slide image.
   * @returns A JSON object representing the slide structure.
   */
  public async extractSlideContent(imageBase64: string): Promise<{ title: string, body: string, bullets: string[] }> {
    return this.callWithRetry(async () => {
      const ai = this.getAiInstance();
      const cleanBase64 = imageBase64.split(',')[1] || imageBase64;

      const prompt = `Analyze this presentation slide image. Extract the main components.
      1. Identify the Title.
      2. Identify the main body text.
      3. Identify any bullet points (list items).
      
      Return a JSON object with this schema:
      {
        "title": "Slide Title string",
        "body": "Main paragraph text string",
        "bullets": ["Bullet 1", "Bullet 2"]
      }
      If a section is missing, return empty string or empty array.`;

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } }
          ],
        },
        config: { responseMimeType: 'application/json' }
      });

      try {
        return JSON.parse(response.text);
      } catch (e) {
        throw new Error("Failed to parse AI response for slide extraction.");
      }
    });
  }
}

export const geminiService = new GeminiService();
