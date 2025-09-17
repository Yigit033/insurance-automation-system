// Bu script takılan "processing" belgeleri temizler
import { createClient } from '@supabase/supabase-js';

console.log('🔍 Takılan "processing" belgeleri kontrol ediliyor...');

// Supabase bağlantı bilgileri - bunları kendi değerlerinizle değiştirin
const SUPABASE_URL = 'https://ukngohltwzdmrrymymlc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbmdvaGx0d3pkbXJyeW15bWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MDU0OTksImV4cCI6MjA3MzE4MTQ5OX0.sZFRXR72Y0nUB3rIbXSIzFyR0PYVOBWmp0Z4zOrhv-E';

if (SUPABASE_ANON_KEY.includes('YourAnonKey')) {
  console.log('❌ Lütfen gerçek Supabase anon key\'inizi script\'e ekleyin');
  console.log('📝 Dosyayı düzenleyin: fix-processing-documents.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixProcessingDocuments() {
  try {
    // 5 dakikadan uzun süren processing belgeleri bul
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    console.log('📅 5 dakikadan eski processing belgeleri aranıyor...');
    
    const { data: processingDocs, error: fetchError } = await supabase
      .from('documents')
      .select('id, original_filename, status, created_at, error_message')
      .eq('status', 'processing')
      .lt('created_at', fiveMinutesAgo);

    if (fetchError) {
      console.error('❌ Veritabanı hatası:', fetchError.message);
      return;
    }

    if (!processingDocs || processingDocs.length === 0) {
      console.log('✅ Takılan processing belge bulunamadı');
      return;
    }

    console.log(`📊 ${processingDocs.length} takılan processing belge bulundu:`);
    processingDocs.forEach((doc, index) => {
      console.log(`  ${index + 1}. ${doc.original_filename} (${doc.id})`);
      console.log(`     Oluşturulma: ${doc.created_at}`);
      console.log(`     Hata mesajı: ${doc.error_message || 'Yok'}`);
    });

    // Takılan belgeleri failed olarak işaretle
    const stuckIds = processingDocs.map(doc => doc.id);
    
    console.log('🔄 Takılan belgeler failed olarak işaretleniyor...');
    
    const { error: updateError } = await supabase
      .from('documents')
      .update({ 
        status: 'failed', 
        error_message: 'İşlem zaman aşımı - otomatik düzeltildi (5+ dakika)',
        processing_time: 300000 // 5 dakika
      })
      .in('id', stuckIds);

    if (updateError) {
      console.error('❌ Güncelleme hatası:', updateError.message);
      return;
    }

    console.log(`✅ ${stuckIds.length} belge başarıyla düzeltildi`);
    console.log('🎉 Tüm takılan processing belgeler temizlendi!');
    
  } catch (error) {
    console.error('❌ Beklenmeyen hata:', error.message);
  }
}

// Script'i çalıştır
fixProcessingDocuments();
