import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SearchFilters {
  query: string;
  documentType: string;
  dateFrom: string;
  dateTo: string;
}

export interface SearchResult {
  id: string;
  filename: string;
  original_filename: string;
  file_type: string;
  status: string;
  extracted_data: any;
  ocr_confidence: number;
  created_at: string;
  search_rank: number;
}

export function useAdvancedSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    documentType: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const { user } = useAuth();

  const searchDocuments = async (searchFilters: SearchFilters) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('search_documents', {
        user_id_param: user.id,
        search_query: searchFilters.query,
        document_type_filter: searchFilters.documentType === 'all' ? '' : searchFilters.documentType,
        date_from: searchFilters.dateFrom ? new Date(searchFilters.dateFrom).toISOString() : null,
        date_to: searchFilters.dateTo ? new Date(searchFilters.dateTo).toISOString() : null
      });

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    searchDocuments(updatedFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      query: '',
      documentType: 'all',
      dateFrom: '',
      dateTo: ''
    };
    setFilters(clearedFilters);
    searchDocuments(clearedFilters);
  };

  useEffect(() => {
    if (user) {
      searchDocuments(filters);
    }
  }, [user]);

  return {
    results,
    loading,
    filters,
    updateFilters,
    clearFilters,
    searchDocuments
  };
}