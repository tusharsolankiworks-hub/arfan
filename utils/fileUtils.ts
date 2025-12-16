
/**
 * Converts an ArrayBuffer to a Base64 encoded string.
 * Optimized for large files by processing in chunks to avoid stack overflow
 * and improve performance over byte-by-byte concatenation.
 * Uses incremental btoa to reduce memory pressure.
 * @param buffer The ArrayBuffer to convert.
 * @returns A Base64 encoded string.
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let base64 = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  const chunkSize = 32769; // Must be multiple of 3 to prevent padding characters in the middle

  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    // Apply btoa to each chunk and concatenate
    base64 += btoa(String.fromCharCode.apply(null, chunk as unknown as number[]));
  }
  return base64;
}

/**
 * Converts a Base64 encoded string to an ArrayBuffer.
 * @param base64 The Base64 string to convert.
 * @returns An ArrayBuffer.
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Reads a File object into an ArrayBuffer.
 * @param file The File object to read.
 * @returns A Promise that resolves with the ArrayBuffer.
 */
export async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Converts an ArrayBuffer to a Data URL (base64 encoded).
 * @param buffer The ArrayBuffer to convert.
 * @param mimeType The MIME type of the data (e.g., 'image/png', 'application/pdf').
 * @returns A Data URL string.
 */
export function arrayBufferToDataURL(buffer: ArrayBuffer, mimeType: string): string {
  const base64 = arrayBufferToBase64(buffer);
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Creates a File object from an ArrayBuffer and MIME type.
 * @param buffer The ArrayBuffer containing the file data.
 * @param filename The name of the file.
 * @param mimeType The MIME type of the file.
 * @returns A new File object.
 */
export function arrayBufferToFile(buffer: ArrayBuffer, filename: string, mimeType: string): File {
  return new File([buffer], filename, { type: mimeType });
}

/**
 * Converts a Data URL to a Blob.
 * @param dataURL The Data URL string.
 * @returns A Promise that resolves with a Blob object.
 */
export async function dataURLtoBlob(dataURL: string): Promise<Blob> {
  return new Promise((resolve) => {
    const arr = dataURL.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    resolve(new Blob([u8arr], { type: mime }));
  });
}
