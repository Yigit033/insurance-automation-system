import * as pdfjs from 'pdfjs-dist';

// PDF.js configuration
export const configurePdfJs = () => {
  if (typeof window !== 'undefined') {
    // Set worker source
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';
    
    // Additional configuration
    pdfjs.GlobalWorkerOptions.workerPort = null;
    
    console.log('PDF.js configured with worker:', pdfjs.GlobalWorkerOptions.workerSrc);
  }
};

// Initialize PDF.js when module loads
configurePdfJs();

export default pdfjs;
