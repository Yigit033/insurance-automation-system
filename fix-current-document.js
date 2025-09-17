// Fix current document with proper extracted data
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ukngohltwzdmrrymymlc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbmdvaGx0d3pkbXJyeW15bWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MDU0OTksImV4cCI6MjA3MzE4MTQ5OX0.sZFRXR72Y0nUB3rIbXSIzFyR0PYVOBWmp0Z4zOrhv-E';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixCurrentDocument() {
  try {
    console.log('🔧 Current document düzeltiliyor...');
    
    const documentId = 'f6f27ad6-7723-4e94-a413-49aff6c310a6';
    
    // Proper extracted data structure
    const properExtractedData = {
      raw_text: "Sample extracted text from OCR",
      document_type: 'insurance_policy',
      extraction_method: 'ocr_space',
      confidence: 770,
      extracted_fields: {
        customer_name: null,
        tc_number: null,
        policy_number: 'BILGILERI',
        start_date: null,
        end_date: null,
        amount: '00 TL',
        plate_number: null,
        chassis_number: null,
        motor_number: null,
        expert_info: null
      }
    };
    
    console.log('📊 Proper extracted data:', properExtractedData);
    
    // Update document with proper structure
    const { error } = await supabase
      .from('documents')
      .update({ 
        extracted_data: properExtractedData,
        ocr_confidence: 770
      })
      .eq('id', documentId);
    
    if (error) {
      console.error('❌ Update hatası:', error);
    } else {
      console.log('✅ Document updated with proper structure');
    }
    
  } catch (err) {
    console.error('❌ Beklenmeyen hata:', err);
  }
}

fixCurrentDocument();
