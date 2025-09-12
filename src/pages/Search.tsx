import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, User, TrendingUp } from 'lucide-react';
import { AdvancedSearchForm } from '@/components/search/AdvancedSearchForm';
import { useAdvancedSearch } from '@/hooks/useAdvancedSearch';
import { Button } from '@/components/ui/button';

export default function Search() {
  const { results, loading, filters, updateFilters, clearFilters } = useAdvancedSearch();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'completed': { variant: 'default' as const, text: 'Tamamlandı' },
      'failed': { variant: 'destructive' as const, text: 'Başarısız' },
      'processing': { variant: 'secondary' as const, text: 'İşleniyor' },
      'uploading': { variant: 'outline' as const, text: 'Yükleniyor' }
    };
    
    return statusMap[status as keyof typeof statusMap] || { variant: 'outline' as const, text: status };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-insurance-navy">
          Gelişmiş Arama
        </h1>
        <p className="text-insurance-gray mt-2">
          Belgelerde detaylı arama yapın ve ihtiyacınız olan verileri hızlıca bulun
        </p>
      </div>

      <AdvancedSearchForm 
        filters={filters}
        onFiltersChange={updateFilters}
        onClear={clearFilters}
        loading={loading}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-insurance-navy">
            Arama Sonuçları ({results.length})
          </h2>
          {filters.query && (
            <div className="flex items-center gap-2 text-sm text-insurance-gray">
              <TrendingUp className="h-4 w-4" />
              Relevans skoruna göre sıralandı
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="text-center py-8 text-insurance-gray">
            Aranıyor...
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-8 text-insurance-gray">
            <FileText className="w-16 h-16 text-insurance-gray mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-insurance-navy mb-2">
              Sonuç bulunamadı
            </h3>
            <p className="text-insurance-gray">
              Arama kriterlerinizi değiştirip tekrar deneyin
            </p>
          </div>
        ) : (
          results.map((result) => {
            const extractedData = result.extracted_data as any;
            const statusBadge = getStatusBadge(result.status);
            
            return (
              <Card key={result.id} className="bg-gradient-card shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <h3 className="font-semibold text-insurance-navy">{result.original_filename}</h3>
                        <div className="flex items-center gap-4 text-sm text-insurance-gray">
                          {extractedData?.customer_name && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {extractedData.customer_name}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(result.created_at)}
                          </span>
                          {filters.query && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              Skor: {(result.search_rank * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                        {extractedData && (
                          <div className="mt-2 text-xs text-insurance-gray">
                            {extractedData.policy_number && (
                              <span className="mr-4">Poliçe: {extractedData.policy_number}</span>
                            )}
                            {extractedData.vehicle_plate && (
                              <span className="mr-4">Plaka: {extractedData.vehicle_plate}</span>
                            )}
                            {extractedData.amount && (
                              <span>Tutar: {extractedData.amount}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {extractedData?.document_type && (
                        <Badge variant="outline" className="capitalize border-insurance-blue text-insurance-blue">
                          {extractedData.document_type}
                        </Badge>
                      )}
                      <Badge variant={statusBadge.variant}>
                        {statusBadge.text}
                      </Badge>
                      {result.ocr_confidence && (
                        <Badge variant="secondary">
                          %{result.ocr_confidence.toFixed(0)} güven
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};