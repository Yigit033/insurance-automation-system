/**
 * Custom OCR Service Integration
 * Connects to the Python FastAPI OCR microservice
 */

interface OcrResponse {
  success: boolean;
  text: string;
  engine: string;
  processing_time: number;
  filename: string;
}

interface OcrError {
  detail: string;
}

/**
 * Process document using custom Python OCR service
 * @param file - File to process
 * @param engine - OCR engine to use ('tesseract', 'paddle', or 'auto')
 * @param clean - Whether to apply AI text cleaning
 * @returns Extracted text
 */
export async function processWithCustomOcr(
  file: File,
  engine: 'tesseract' | 'paddle' | 'auto' = 'auto',
  clean: boolean = true
): Promise<string> {
  try {
    const ocrApiUrl = import.meta.env.VITE_OCR_API_URL || 'http://localhost:8000';
    
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('engine', engine);
    formData.append('clean', clean.toString());
    
    console.log('🚀 Sending request to custom OCR service:', ocrApiUrl);
    
    // Call OCR service
    const response = await fetch(`${ocrApiUrl}/ocr`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData: OcrError = await response.json();
      throw new Error(`OCR service error: ${errorData.detail || response.statusText}`);
    }
    
    const data: OcrResponse = await response.json();
    
    console.log('✅ OCR completed:', {
      engine: data.engine,
      textLength: data.text.length,
      processingTime: data.processing_time
    });
    
    return data.text;
    
  } catch (error) {
    console.error('❌ Custom OCR service error:', error);
    throw error;
  }
}

/**
 * Process document from base64 content
 * @param base64Content - Base64 encoded file content
 * @param filename - Original filename
 * @param engine - OCR engine to use
 * @param clean - Whether to apply AI text cleaning
 * @returns Extracted text
 */
export async function processBase64WithCustomOcr(
  base64Content: string,
  filename: string,
  engine: 'tesseract' | 'paddle' | 'auto' = 'auto',
  clean: boolean = true
): Promise<string> {
  try {
    // Convert base64 to blob
    const base64Data = base64Content.split(',')[1] || base64Content;
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    const file = new File([blob], filename, { type: 'image/png' });
    
    return await processWithCustomOcr(file, engine, clean);
    
  } catch (error) {
    console.error('❌ Base64 OCR processing error:', error);
    throw error;
  }
}

/**
 * Check if custom OCR service is available
 * @returns true if service is healthy
 */
export async function checkOcrServiceHealth(): Promise<boolean> {
  try {
    const ocrApiUrl = import.meta.env.VITE_OCR_API_URL || 'http://localhost:8000';
    const response = await fetch(`${ocrApiUrl}/health`, {
      method: 'GET',
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ OCR service is healthy:', data);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ OCR service health check failed:', error);
    return false;
  }
}
