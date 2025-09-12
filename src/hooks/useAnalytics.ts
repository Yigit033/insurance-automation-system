import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AnalyticsData {
  total_documents: number;
  processed_documents: number;
  failed_documents: number;
  avg_processing_time: number;
  avg_confidence: number;
  documents_by_type: Record<string, number>;
  monthly_uploads: Record<string, number>;
}

export function useAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchAnalytics = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_analytics', {
        user_id_param: user.id
      });

      if (error) throw error;
      
      if (data && data.length > 0) {
        const result = data[0];
        setAnalytics({
          total_documents: result.total_documents,
          processed_documents: result.processed_documents,
          failed_documents: result.failed_documents,
          avg_processing_time: result.avg_processing_time,
          avg_confidence: result.avg_confidence,
          documents_by_type: (result.documents_by_type as any) || {},
          monthly_uploads: (result.monthly_uploads as any) || {}
        });
      }
    } catch (error) {
      console.error('Analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [user]);

  return {
    analytics,
    loading,
    refetch: fetchAnalytics
  };
}