import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Terminal, Download, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ProcessingLog {
  id: string;
  document_id: string;
  filename: string;
  status: string;
  error_message?: string;
  created_at: string;
  processing_time?: number;
  extracted_data?: any;
}

export const ProcessingLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ProcessingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchLogs = async () => {
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('id, original_filename, status, error_message, created_at, processing_time, extracted_data')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setLogs(data || []);
      } catch (error) {
        console.error('Error fetching processing logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();

    // Set up real-time subscription
    const subscription = supabase
      .channel('processing_logs')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'documents',
          filter: `user_id=eq.${user.id}`
        }, 
        () => {
          if (autoRefresh) {
            fetchLogs();
          }
        }
      )
      .subscribe();

    // Auto refresh every 5 seconds
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchLogs();
      }
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [user, autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'uploading':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'processing':
        return '⏳';
      case 'failed':
        return '❌';
      case 'uploading':
        return '📤';
      default:
        return '❓';
    }
  };

  const formatDuration = (processingTime?: number) => {
    if (!processingTime) return 'N/A';
    return `${(processingTime / 1000).toFixed(1)}s`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const exportLogs = () => {
    const csvContent = [
      ['Document ID', 'Filename', 'Status', 'Processing Time (s)', 'Error Message', 'Created At'],
      ...logs.map(log => [
        log.id,
        log.filename,
        log.status,
        formatDuration(log.processing_time),
        log.error_message || '',
        formatTimestamp(log.created_at)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `processing-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearLogs = async () => {
    if (!user) return;
    
    try {
      // Delete completed and failed documents older than 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('user_id', user.id)
        .in('status', ['completed', 'failed'])
        .lt('created_at', sevenDaysAgo);

      if (error) throw error;
      
      // Refresh logs
      setLogs(prev => prev.filter(log => 
        log.status === 'processing' || log.status === 'uploading' ||
        new Date(log.created_at) > new Date(sevenDaysAgo)
      ));
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Terminal className="w-5 h-5" />
            <span>İşlem Logları</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Yükleniyor...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5" />
            <span>İşlem Logları</span>
            <Badge variant="outline">{logs.length}</Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'bg-green-50 text-green-700' : ''}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Otomatik' : 'Manuel'}
            </Button>
            <Button variant="outline" size="sm" onClick={exportLogs}>
              <Download className="w-4 h-4 mr-1" />
              Dışa Aktar
            </Button>
            <Button variant="outline" size="sm" onClick={clearLogs}>
              <Trash2 className="w-4 h-4 mr-1" />
              Temizle
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-2">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Henüz işlem logu yok
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-lg">{getStatusIcon(log.status)}</span>
                        <span className="font-medium text-sm truncate">
                          {log.filename}
                        </span>
                        <Badge className={getStatusColor(log.status)}>
                          {log.status === 'completed' ? 'Tamamlandı' :
                           log.status === 'processing' ? 'İşleniyor' :
                           log.status === 'failed' ? 'Hata' :
                           log.status === 'uploading' ? 'Yükleniyor' : log.status}
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>ID: {log.id}</div>
                        <div>Zaman: {formatTimestamp(log.created_at)}</div>
                        {log.processing_time && (
                          <div>İşlem Süresi: {formatDuration(log.processing_time)}</div>
                        )}
                        {log.error_message && (
                          <div className="text-red-600 font-medium">
                            Hata: {log.error_message}
                          </div>
                        )}
                        {log.extracted_data && log.status === 'completed' && (
                          <div className="text-green-600">
                            Çıkarılan Alanlar: {Object.keys(log.extracted_data).length}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
