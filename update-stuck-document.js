// Update stuck document status
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ukngohltwzdmrrymymlc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbmdvaGx0d3pkbXJyeW15bWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MDU0OTksImV4cCI6MjA3MzE4MTQ5OX0.sZFRXR72Y0nUB3rIbXSIzFyR0PYVOBWmp0Z4zOrhv-E';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function updateStuckDocument() {
  try {
    console.log('🔄 Stuck document güncelleniyor...');
    
    const documentId = '1e32940c-a914-43b2-97f4-2739818e53e0';
    
    // Update status to failed
    const { error } = await supabase
      .from('documents')
      .update({ 
        status: 'failed',
        error_message: 'Function call failed - switching to minimal function'
      })
      .eq('id', documentId);
    
    if (error) {
      console.error('❌ Update hatası:', error);
    } else {
      console.log('✅ Document status updated to failed');
    }
    
  } catch (err) {
    console.error('❌ Beklenmeyen hata:', err);
  }
}

updateStuckDocument();
