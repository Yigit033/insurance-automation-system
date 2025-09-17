// Process stuck document manually
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ukngohltwzdmrrymymlc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbmdvaGx0d3pkbXJyeW15bWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MDU0OTksImV4cCI6MjA3MzE4MTQ5OX0.sZFRXR72Y0nUB3rIbXSIzFyR0PYVOBWmp0Z4zOrhv-E';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function processStuckDocument() {
  try {
    console.log('🔍 Stuck document işleniyor...');
    
    const documentId = '1e32940c-a914-43b2-97f4-2739818e53e0';
    
    // Test verisi oluştur (1x1 pixel PNG)
    const testData = {
      documentId: documentId,
      fileContent: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      fileType: 'image/png'
    };
    
    console.log('📤 Test verisi gönderiliyor...');
    
    const { data, error } = await supabase.functions.invoke('process-document-simple', {
      body: testData
    });
    
    if (error) {
      console.error('❌ Process function hatası:', error);
    } else {
      console.log('✅ Process function başarılı:', data);
    }
    
  } catch (err) {
    console.error('❌ Beklenmeyen hata:', err);
  }
}

processStuckDocument();
