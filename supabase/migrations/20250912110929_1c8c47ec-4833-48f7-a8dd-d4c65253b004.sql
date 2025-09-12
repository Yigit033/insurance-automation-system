-- Enable full-text search capabilities
CREATE INDEX IF NOT EXISTS idx_document_search_fts ON document_search USING gin(to_tsvector('turkish', content_text));

-- Create function for advanced search
CREATE OR REPLACE FUNCTION search_documents(
  user_id_param UUID,
  search_query TEXT DEFAULT '',
  document_type_filter TEXT DEFAULT '',
  date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  filename TEXT,
  original_filename TEXT,
  file_type TEXT,
  status TEXT,
  extracted_data JSONB,
  ocr_confidence NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE,
  search_rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.filename,
    d.original_filename,
    d.file_type,
    d.status,
    d.extracted_data,
    d.ocr_confidence,
    d.created_at,
    CASE 
      WHEN search_query = '' THEN 1.0
      ELSE ts_rank(to_tsvector('turkish', ds.content_text), plainto_tsquery('turkish', search_query))
    END as search_rank
  FROM documents d
  LEFT JOIN document_search ds ON d.id = ds.document_id
  WHERE d.user_id = user_id_param
    AND (search_query = '' OR to_tsvector('turkish', ds.content_text) @@ plainto_tsquery('turkish', search_query))
    AND (document_type_filter = '' OR (d.extracted_data->>'document_type' = document_type_filter))
    AND (date_from IS NULL OR d.created_at >= date_from)
    AND (date_to IS NULL OR d.created_at <= date_to)
  ORDER BY 
    CASE WHEN search_query = '' THEN d.created_at ELSE NULL END DESC,
    CASE WHEN search_query != '' THEN ts_rank(to_tsvector('turkish', ds.content_text), plainto_tsquery('turkish', search_query)) ELSE NULL END DESC;
END;
$$;

-- Create analytics function for dashboard
CREATE OR REPLACE FUNCTION get_user_analytics(user_id_param UUID)
RETURNS TABLE (
  total_documents BIGINT,
  processed_documents BIGINT,
  failed_documents BIGINT,
  avg_processing_time NUMERIC,
  avg_confidence NUMERIC,
  documents_by_type JSONB,
  monthly_uploads JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_documents,
    COUNT(*) FILTER (WHERE status = 'completed') as processed_documents,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_documents,
    AVG(processing_time) FILTER (WHERE processing_time IS NOT NULL) as avg_processing_time,
    AVG(ocr_confidence) FILTER (WHERE ocr_confidence IS NOT NULL) as avg_confidence,
    (
      SELECT jsonb_object_agg(document_type, doc_count)
      FROM (
        SELECT 
          COALESCE(extracted_data->>'document_type', 'unknown') as document_type,
          COUNT(*) as doc_count
        FROM documents 
        WHERE user_id = user_id_param 
        GROUP BY extracted_data->>'document_type'
      ) t
    ) as documents_by_type,
    (
      SELECT jsonb_object_agg(month_year, doc_count)
      FROM (
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM') as month_year,
          COUNT(*) as doc_count
        FROM documents 
        WHERE user_id = user_id_param 
          AND created_at >= NOW() - INTERVAL '12 months'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month_year
      ) t
    ) as monthly_uploads
  FROM documents 
  WHERE user_id = user_id_param;
END;
$$;