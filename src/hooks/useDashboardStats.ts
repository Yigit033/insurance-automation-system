import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
  totalDocuments: number;
  todayProcessed: number;
  inQueue: number;
  successRate: number;
  recentDocuments: any[];
  loading: boolean;
}

export function useDashboardStats(): DashboardStats {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalDocuments: 0,
    todayProcessed: 0,
    inQueue: 0,
    successRate: 0,
    recentDocuments: [],
    loading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        // Get total documents
        const { count: totalCount } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Get today's processed documents
        const today = new Date().toISOString().split('T')[0];
        const { count: todayCount } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('created_at', today);

        // Get documents in queue
        const { count: queueCount } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('status', ['uploading', 'processing']);

        // Get success rate
        const { count: completedCount } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed');

        const successRate = totalCount ? (completedCount || 0) / totalCount * 100 : 0;

        // Get recent documents
        const { data: recentDocs } = await supabase
          .from('documents')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        setStats({
          totalDocuments: totalCount || 0,
          todayProcessed: todayCount || 0,
          inQueue: queueCount || 0,
          successRate: Math.round(successRate),
          recentDocuments: recentDocs || [],
          loading: false
        });

      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();

    // Set up real-time subscription
    const subscription = supabase
      .channel('dashboard_stats')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'documents',
          filter: `user_id=eq.${user?.id}`
        }, 
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return stats;
}