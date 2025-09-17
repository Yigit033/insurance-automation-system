// Fix documents stuck in uploading status
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ukngohltwzdmrrymymlc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbmdvaGx0d3pkbXJyeW15bWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MDU0OTksImV4cCI6MjA3MzE4MTQ5OX0.sZFRXR72Y0nUB3rIbXSIzFyR0PYVOBWmp0Z4zOrhv-E';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixUploadingDocuments() {
  try {
    console.log('🔧 Uploading durumundaki belgeler düzeltiliyor...');
    
    // Get all documents in uploading status
    const { data: uploadingDocs, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('status', 'uploading');
    
    if (fetchError) {
      console.error('❌ Fetch hatası:', fetchError);
      return;
    }
    
    console.log(`📄 ${uploadingDocs.length} belge uploading durumunda bulundu`);
    
    // Update each document to failed status
    for (const doc of uploadingDocs) {
      console.log(`🔄 Belge güncelleniyor: ${doc.id}`);
      
      const { error: updateError } = await supabase
        .from('documents')
        .update({ 
          status: 'failed',
          error_message: 'Upload interrupted - please try again'
        })
        .eq('id', doc.id);
      
      if (updateError) {
        console.error(`❌ Update hatası ${doc.id}:`, updateError);
      } else {
        console.log(`✅ Belge güncellendi: ${doc.id}`);
      }
    }
    
    console.log('✅ Tüm uploading belgeler düzeltildi');
    
  } catch (err) {
    console.error('❌ Beklenmeyen hata:', err);
  }
}

fixUploadingDocuments();
