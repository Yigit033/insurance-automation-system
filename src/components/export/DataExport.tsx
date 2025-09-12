import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Download, FileText, Table } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function DataExport() {
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [exporting, setExporting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const exportData = async () => {
    if (!user) return;

    setExporting(true);
    try {
      const { data: documents, error } = await supabase
        .from('documents')
        .select(`
          id,
          filename,
          original_filename,
          file_type,
          status,
          extracted_data,
          ocr_confidence,
          created_at,
          file_size
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!documents || documents.length === 0) {
        toast({
          title: 'Veri Bulunamadı',
          description: 'Dışa aktarılacak belge bulunamadı.',
          variant: 'destructive'
        });
        return;
      }

      // Prepare data for export
      const exportData = documents.map(doc => {
        const extractedData = doc.extracted_data as any;
        return {
          'Dosya Adı': doc.original_filename,
          'Tür': doc.file_type,
          'Durum': doc.status,
          'Müşteri Adı': extractedData?.customer_name || '',
          'TC Kimlik': extractedData?.national_id || '',
          'Poliçe No': extractedData?.policy_number || '',
          'Araç Plaka': extractedData?.vehicle_plate || '',
          'Telefon': extractedData?.phone || '',
          'Tutar': extractedData?.amount || '',
          'Sigorta Şirketi': extractedData?.insurance_company || '',
          'Belge Türü': extractedData?.document_type || '',
          'OCR Güven': doc.ocr_confidence || 0,
          'Dosya Boyutu (KB)': Math.round((doc.file_size || 0) / 1024),
          'Yükleme Tarihi': new Date(doc.created_at).toLocaleDateString('tr-TR')
        };
      });

      let content: string;
      let filename: string;
      let mimeType: string;

      if (exportFormat === 'csv') {
        // Generate CSV
        const headers = Object.keys(exportData[0] || {});
        const csvContent = [
          headers.join(','),
          ...exportData.map(row => 
            headers.map(header => `"${(row as any)[header] || ''}"`).join(',')
          )
        ].join('\n');
        
        content = csvContent;
        filename = `belgeler_${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv;charset=utf-8;';
      } else {
        // Generate JSON
        content = JSON.stringify(exportData, null, 2);
        filename = `belgeler_${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json;charset=utf-8;';
      }

      // Download file
      const blob = new Blob([content], { type: mimeType });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);

      toast({
        title: 'Dışa Aktarım Tamamlandı',
        description: `${documents.length} belge başarıyla ${exportFormat.toUpperCase()} formatında dışa aktarıldı.`
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Dışa Aktarım Hatası',
        description: 'Veriler dışa aktarılırken bir hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Veri Dışa Aktarımı
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Dışa Aktarım Formatı</label>
          <Select value={exportFormat} onValueChange={(value: 'csv' | 'json') => setExportFormat(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">
                <div className="flex items-center gap-2">
                  <Table className="h-4 w-4" />
                  CSV (Excel ile açılabilir)
                </div>
              </SelectItem>
              <SelectItem value="json">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  JSON (Programatik kullanım)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground">
          Tüm belgeleriniz ve çıkarılan veriler seçilen formatta dışa aktarılacak.
          Dışa aktarılan dosya şunları içerir:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Dosya bilgileri ve durum</li>
            <li>OCR ile çıkarılan metin veriler</li>
            <li>Güven skorları ve metrikler</li>
            <li>Tarih ve boyut bilgileri</li>
          </ul>
        </div>

        <Button onClick={exportData} disabled={exporting} className="w-full">
          <Download className="h-4 w-4 mr-2" />
          {exporting ? 'Dışa Aktarılıyor...' : `${exportFormat.toUpperCase()} Olarak Dışa Aktar`}
        </Button>
      </CardContent>
    </Card>
  );
}