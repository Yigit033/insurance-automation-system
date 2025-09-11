import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Document {
  id: string;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  file_url?: string;
  status: string;
  extracted_data?: any;
  ocr_confidence?: number;
  processing_time?: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchDocuments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (file: File) => {
    if (!user) throw new Error('User not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Create document record
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        filename: fileName,
        original_filename: file.name,
        file_type: file.type,
        file_size: file.size,
        file_url: uploadData.path,
        status: 'uploading'
      })
      .select()
      .single();

    if (docError) throw docError;

    // Convert file to base64 for processing
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result?.toString().split(',')[1];
      
      // Call edge function to process document
      const { error: processError } = await supabase.functions.invoke('process-document', {
        body: {
          documentId: docData.id,
          fileContent: base64,
          fileType: file.type
        }
      });

      if (processError) {
        console.error('Error processing document:', processError);
        // Update status to failed
        await supabase
          .from('documents')
          .update({ status: 'failed', error_message: processError.message })
          .eq('id', docData.id);
      }
    };
    reader.readAsDataURL(file);

    return docData;
  };

  const deleteDocument = async (documentId: string) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', user.id);

    if (error) throw error;

    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  useEffect(() => {
    fetchDocuments();

    // Set up real-time subscription
    const subscription = supabase
      .channel('documents_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'documents',
          filter: `user_id=eq.${user?.id}`
        }, 
        () => {
          fetchDocuments();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return {
    documents,
    loading,
    uploadDocument,
    deleteDocument,
    refetch: fetchDocuments
  };
}