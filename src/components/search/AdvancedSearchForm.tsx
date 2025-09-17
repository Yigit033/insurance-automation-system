import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchFilters } from '@/hooks/useAdvancedSearch';
import { Search, X, Calendar } from 'lucide-react';

interface AdvancedSearchFormProps {
  filters: SearchFilters;
  onFiltersChange: (filters: Partial<SearchFilters>) => void;
  onClear: () => void;
  loading: boolean;
}

export function AdvancedSearchForm({ filters, onFiltersChange, onClear, loading }: AdvancedSearchFormProps) {
  const [localFilters, setLocalFilters] = useState({
    ...filters,
    documentType: filters.documentType || 'all'
  });

  const handleSearch = () => {
    onFiltersChange(localFilters);
  };

  const handleClear = () => {
    const clearedFilters = {
      query: '',
      documentType: 'all',
      dateFrom: '',
      dateTo: ''
    };
    setLocalFilters(clearedFilters);
    onClear();
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Gelişmiş Arama
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Arama Metni</label>
            <Input
              placeholder="Belge içeriğinde ara..."
              value={localFilters.query}
              onChange={(e) => handleFilterChange('query', e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Belge Türü</label>
            <Select 
              value={localFilters.documentType} 
              onValueChange={(value) => handleFilterChange('documentType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tür seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="kasko">Kasko</SelectItem>
                <SelectItem value="trafik">Trafik</SelectItem>
                <SelectItem value="hasar">Hasar</SelectItem>
                <SelectItem value="police">Poliçe</SelectItem>
                <SelectItem value="unknown">Bilinmeyen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Başlangıç Tarihi</label>
            <div className="relative">
              <Input
                type="date"
                value={localFilters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
              <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Bitiş Tarihi</label>
            <div className="relative">
              <Input
                type="date"
                value={localFilters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
              <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSearch} disabled={loading} className="flex-1">
            <Search className="h-4 w-4 mr-2" />
            {loading ? 'Aranıyor...' : 'Ara'}
          </Button>
          <Button variant="outline" onClick={handleClear}>
            <X className="h-4 w-4 mr-2" />
            Temizle
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}