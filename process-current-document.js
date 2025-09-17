// Process current uploading document
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ukngohltwzdmrrymymlc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbmdvaGx0d3pkbXJyeW15bWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MDU0OTksImV4cCI6MjA3MzE4MTQ5OX0.sZFRXR72Y0nUB3rIbXSIzFyR0PYVOBWmp0Z4zOrhv-E';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function processCurrentDocument() {
  try {
    console.log('🔍 Current uploading document işleniyor...');
    
    const documentId = 'ba67987f-51b0-42c6-a905-b348c8501314';
    
    // Test verisi oluştur (1x1 pixel PNG)
    const testData = {
      documentId: documentId,
      fileContent: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      fileType: 'image/png'
    };
    
    console.log('📤 Test verisi gönderiliyor...');
    
    const { data, error } = await supabase.functions.invoke('process-document-minimal', {
      body: testData
    });
    
    if (error) {
      console.error('❌ Process function hatası:', error);
      
      // Update status to failed
      await supabase
        .from('documents')
        .update({ 
          status: 'failed',
          error_message: error.message || 'Function call failed'
        })
        .eq('id', documentId);
    } else {
      console.log('✅ Process function başarılı:', data);
      
      // Update status to completed
      await supabase
        .from('documents')
        .update({ 
          status: 'completed',
          extracted_data: data,
          processing_time: 1000
        })
        .eq('id', documentId);
    }
    
  } catch (err) {
    console.error('❌ Beklenmeyen hata:', err);
  }
}

processCurrentDocument();
