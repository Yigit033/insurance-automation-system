import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface QueueDocument {
  id: string;
  filename: string;
  status: string;
  error_message?: string;
  created_at: string;
  processing_time?: number;
}

export const QueueMonitor = () => {
  const { user } = useAuth();
  const [queueDocs, setQueueDocs] = useState<QueueDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchQueueDocs = async () => {
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('id, filename, status, error_message, created_at, processing_time')
          .eq('user_id', user.id)
          .in('status', ['uploading', 'processing'])
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setQueueDocs(data || []);
      } catch (error) {
        console.error('Error fetching queue documents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQueueDocs();

    // Set up real-time subscription
    const subscription = supabase
      .channel('queue_monitor')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'documents',
          filter: `user_id=eq.${user.id}`
        }, 
        () => {
          fetchQueueDocs();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'processing':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProcessingTime = (createdAt: string, processingTime?: number) => {
    if (processingTime) {
      return `${(processingTime / 1000).toFixed(1)}s`;
    }
    
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 60) {
      return `${diffSeconds}s`;
    } else {
      const minutes = Math.floor(diffSeconds / 60);
      return `${minutes}m ${diffSeconds % 60}s`;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>İşleme Kuyruğu</CardTitle>
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
          <span>İşleme Kuyruğu</span>
          <Badge variant="outline">{queueDocs.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {queueDocs.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            Kuyrukta bekleyen belge yok
          </div>
        ) : (
          <div className="space-y-3">
            {queueDocs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(doc.status)}
                  <div>
                    <div className="font-medium text-sm truncate max-w-[200px]">
                      {doc.filename}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getProcessingTime(doc.created_at, doc.processing_time)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(doc.status)}>
                    {doc.status === 'uploading' ? 'Yükleniyor' :
                     doc.status === 'processing' ? 'İşleniyor' :
                     doc.status === 'completed' ? 'Tamamlandı' :
                     doc.status === 'failed' ? 'Hata' : doc.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {queueDocs.some(doc => doc.status === 'processing') && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Genel İlerleme</span>
              <span>%{Math.round((queueDocs.filter(doc => doc.status === 'completed').length / queueDocs.length) * 100)}</span>
            </div>
            <Progress 
              value={(queueDocs.filter(doc => doc.status === 'completed').length / queueDocs.length) * 100} 
              className="h-2"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
