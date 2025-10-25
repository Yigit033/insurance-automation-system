import pdfjs from './pdfjs-config';
import { fromUrl as tiffFromUrl } from 'tiff.js';

// Browser-compatible Buffer polyfill
let Buffer: typeof globalThis.Buffer;
if (typeof globalThis.Buffer !== 'undefined') {
  Buffer = globalThis.Buffer;
} else if (typeof require !== 'undefined') {
  Buffer = require('buffer').Buffer;
} else {
  // Fallback for browser environments
  Buffer = class Buffer {
    static from(data: any, encoding?: any) {
      if (data instanceof ArrayBuffer) {
        return new Uint8Array(data) as any;
      }
      if (typeof data === 'string') {
        const bytes = new Uint8Array(data.length);
        for (let i = 0; i < data.length; i++) {
          bytes[i] = data.charCodeAt(i);
        }
        return bytes as any;
      }
      return data;
    }
    toString(encoding?: any) {
      if (this instanceof Uint8Array) {
        return Array.from(this).map(b => String.fromCharCode(b)).join('');
      }
      return String(this);
    }
  } as any;
}

// Helper function to process image via API (disabled for Vite)
// async function processImageViaAPI(buffer: Buffer, mimeType: string): Promise<{ processedImage: string; buffer: string }> {
//   // This function is disabled for Vite projects
//   // Images are processed directly by OCR service
// }

// Type for PDF.js text items
interface TextItem {
  str: string;
  dir: string;
  transform: number[];
  width: number;
  height: number;
  fontName: string;
  hasEOL: boolean;
}

// PDF.js is now configured in pdfjs-config.ts
const pdfjsLib = pdfjs as any;

export interface ProcessedDocument {
  text: string;
  pages: {
    pageNumber: number;
    text: string;
    width: number;
    height: number;
  }[];
  metadata: {
    pages: number;
    format: string;
    isScanned: boolean;
    dpi: number;
  };
}

class DocumentProcessor {
  private static instance: DocumentProcessor;

  private constructor() {}

  public static getInstance(): DocumentProcessor {
    if (!DocumentProcessor.instance) {
      DocumentProcessor.instance = new DocumentProcessor();
    }
    return DocumentProcessor.instance;
  }

  // Static method for direct access
  public static async processDocument(file: File): Promise<ProcessedDocument> {
    return DocumentProcessor.getInstance().processDocument(file);
  }

  async processDocument(file: File): Promise<ProcessedDocument> {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    const fileExt = fileName.split('.').pop()?.toLowerCase();

    try {
      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Process based on file type
      if (fileType === 'application/pdf' || fileExt === 'pdf') {
        return await this.processPdf(buffer);
      } else if (['tif', 'tiff'].includes(fileExt || '')) {
        return await this.processTiff(buffer);
      } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExt || '')) {
        return await this.processImage(buffer, fileType);
      } else {
        throw new Error(`Unsupported file format: ${fileExt || fileType}. Supported formats: PDF, JPG, JPEG, PNG, GIF, BMP, WEBP, TIFF`);
      }
    } catch (error) {
      console.error('Error processing document:', error);
      throw new Error(`Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processPdf(buffer: Buffer): Promise<ProcessedDocument> {
    try {
      // PDF.js is already configured in pdfjs-config.ts

      const loadingTask = pdfjsLib.getDocument({ 
        data: buffer,
        useSystemFonts: true,
        disableFontFace: false,
        disableRange: false,
        disableStream: false,
        // Add timeout to prevent hanging
        maxImageSize: 1024 * 1024, // 1MB max image size
        isEvalSupported: false,
        isOffscreenCanvasSupported: false
      });
      
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      const pages = [];
      let fullText = '';

      // Extract text from each page
      for (let i = 1; i <= numPages; i++) {
        try {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.0 });
          
          // Try to extract text directly
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .filter((item): item is TextItem => 'str' in item)
            .map(item => item.str)
            .join(' ');
          
          pages.push({
            pageNumber: i,
            text: pageText,
            width: viewport.width,
            height: viewport.height
          });
          
          fullText += pageText + '\n\f';
        } catch (pageError) {
          console.warn(`Error processing page ${i}:`, pageError);
          // Continue with other pages
        }
      }

      return {
        text: fullText.trim(),
        pages,
        metadata: {
          pages: numPages,
          format: 'PDF',
          isScanned: fullText.trim().length < 100, // Simple heuristic for scanned PDFs
          dpi: 300 // Default DPI for PDFs
        }
      };
    } catch (error) {
      console.error('PDF processing error:', error);
      
      // If PDF.js fails, return a basic structure that will trigger OCR
      console.log('PDF.js failed, marking as scanned document for OCR processing');
      return {
        text: '', // Empty text will trigger OCR
        pages: [{
          pageNumber: 1,
          text: '',
          width: 612, // Standard PDF page width
          height: 792  // Standard PDF page height
        }],
        metadata: {
          pages: 1,
          format: 'PDF',
          isScanned: true, // Force OCR processing
          dpi: 300
        }
      };
    }
  }

  private async processTiff(buffer: Buffer): Promise<ProcessedDocument> {
    // For client-side, we'll just pass the TIFF data as is
    // The server will handle the conversion
    return this.processImage(buffer, 'image/tiff');
  }

  private async processImage(buffer: Buffer, mimeType: string): Promise<ProcessedDocument> {
    try {
      // For client-side processing, we'll skip image processing and go directly to OCR
      // The image will be processed by the OCR service
      const format = mimeType.split('/')[1]?.toUpperCase() || 'UNKNOWN';
      console.log(`📸 Processing ${format} image directly for OCR:`, mimeType);
      console.log(`📸 Image buffer size: ${buffer.length} bytes`);
      
      return {
        text: '', // Empty text will trigger OCR in useDocuments
        pages: [{
          pageNumber: 1,
          text: '',
          width: 0,
          height: 0
        }],
        metadata: {
          pages: 1,
          format: format,
          isScanned: true, // Force OCR processing
          dpi: 300
        }
      };
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper method to detect if a PDF is scanned
  private async isPdfScanned(pdf: any): Promise<boolean> {
    try {
      // Try to extract text from first page
      const page = await pdf.getPage(1);
      const textContent = await page.getTextContent();
      const text = textContent.items.map((item: any) => item.str).join(' ');
      
      // If there's very little text, it's likely a scanned document
      return text.trim().length < 50;
    } catch (error) {
      console.error('Error checking if PDF is scanned:', error);
      return true; // Assume it's scanned if we can't check
    }
  }
}

export default DocumentProcessor.getInstance();
