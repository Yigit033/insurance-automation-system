// Fix uploading document with Node.js API
import { processDocument } from './src/api/process-document.js';

async function fixUploadingDocument() {
  try {
    console.log('🔧 Uploading document düzeltiliyor...');
    
    const documentId = 'ff83b3e7-809f-42eb-8c8e-5bcb67350726';
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const fileType = 'image/png';
    
    const result = await processDocument(documentId, base64, fileType);
    
    if (result.success) {
      console.log('✅ Document processing completed:', result.data);
    } else {
      console.error('❌ Document processing failed');
    }
    
  } catch (err) {
    console.error('❌ Beklenmeyen hata:', err);
  }
}

fixUploadingDocument();
