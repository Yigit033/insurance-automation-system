// Bu script takılan belgeleri temizler
console.log('🔍 Takılan belgeleri kontrol ediliyor...');

// Supabase URL ve key'lerinizi buraya ekleyin
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
  console.log('❌ Lütfen Supabase URL ve key\'lerinizi script\'e ekleyin');
  console.log('📝 Dosyayı düzenleyin: clear-stuck-documents.js');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function clearStuckDocuments() {
  try {
    // 2 dakikadan uzun süren işleniyor belgeleri bul
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    
    console.log('📅 2 dakikadan eski belgeler aranıyor...');
    
    const { data: stuckDocs, error: fetchError } = await supabase
      .from('documents')
      .select('id, original_filename, status, created_at, error_message')
      .eq('status', 'processing')
      .lt('created_at', twoMinutesAgo);

    if (fetchError) {
      console.error('❌ Veritabanı hatası:', fetchError.message);
      return;
    }

    if (!stuckDocs || stuckDocs.length === 0) {
      console.log('✅ Takılan belge bulunamadı');
      return;
    }

    console.log(`📊 ${stuckDocs.length} takılan belge bulundu:`);
    stuckDocs.forEach((doc, index) => {
      console.log(`  ${index + 1}. ${doc.original_filename} (${doc.id})`);
      console.log(`     Oluşturulma: ${doc.created_at}`);
      console.log(`     Hata mesajı: ${doc.error_message || 'Yok'}`);
    });

    // Takılan belgeleri failed olarak işaretle
    const stuckIds = stuckDocs.map(doc => doc.id);
    
    console.log('🔄 Takılan belgeler failed olarak işaretleniyor...');
    
    const { error: updateError } = await supabase
      .from('documents')
      .update({ 
        status: 'failed', 
        error_message: 'İşlem zaman aşımı - otomatik düzeltildi',
        processing_time: 120000 // 2 dakika
      })
      .in('id', stuckIds);

    if (updateError) {
      console.error('❌ Güncelleme hatası:', updateError.message);
      return;
    }

    console.log(`✅ ${stuckIds.length} belge başarıyla düzeltildi`);
    console.log('🎉 Tüm takılan belgeler temizlendi!');
    
  } catch (error) {
    console.error('❌ Beklenmeyen hata:', error.message);
  }
}

// Script'i çalıştır
clearStuckDocuments();
