import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { processDocument } from '@/api/process-document';

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
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result?.toString().split(',')[1];
        if (result) {
          resolve(result);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsDataURL(file);
    });

    try {
      console.log('🚀 Processing document with Node.js API...');
      console.log(`📄 Document ID: ${docData.id}`);
      console.log(`📄 File Type: ${file.type}`);
      console.log(`📊 Base64 Length: ${base64.length}`);

      // Call Node.js API to process document
      const result = await processDocument(docData.id, base64, file.type);

      if (result.success) {
        console.log('✅ Document processing completed successfully:', result.data);
        
        // Reload documents to show updated status
        await fetchDocuments();
      } else {
        throw new Error('Document processing failed');
      }
    } catch (error) {
      console.error('❌ Unexpected error during processing:', error);
      // Update status to failed
      await supabase
        .from('documents')
        .update({ 
          status: 'failed', 
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', docData.id);
      throw error;
    }

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