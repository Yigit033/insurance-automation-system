-- Add normalized fields to documents table for better querying and indexing
-- This migration adds commonly queried fields as separate columns for better performance

-- Add normalized fields to documents table
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS normalized_policy_number TEXT,
ADD COLUMN IF NOT EXISTS normalized_customer_name TEXT,
ADD COLUMN IF NOT EXISTS normalized_insurance_company TEXT,
ADD COLUMN IF NOT EXISTS normalized_vehicle_plate TEXT,
ADD COLUMN IF NOT EXISTS normalized_tc_number TEXT,
ADD COLUMN IF NOT EXISTS normalized_phone TEXT,
ADD COLUMN IF NOT EXISTS policy_start_date DATE,
ADD COLUMN IF NOT EXISTS policy_end_date DATE,
ADD COLUMN IF NOT EXISTS policy_premium DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS coverage_amount DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS document_type_normalized TEXT;

-- Create indexes for normalized fields for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_normalized_policy_number ON public.documents(normalized_policy_number);
CREATE INDEX IF NOT EXISTS idx_documents_normalized_customer_name ON public.documents(normalized_customer_name);
CREATE INDEX IF NOT EXISTS idx_documents_normalized_insurance_company ON public.documents(normalized_insurance_company);
CREATE INDEX IF NOT EXISTS idx_documents_normalized_vehicle_plate ON public.documents(normalized_vehicle_plate);
CREATE INDEX IF NOT EXISTS idx_documents_normalized_tc_number ON public.documents(normalized_tc_number);
CREATE INDEX IF NOT EXISTS idx_documents_policy_dates ON public.documents(policy_start_date, policy_end_date);
CREATE INDEX IF NOT EXISTS idx_documents_document_type_normalized ON public.documents(document_type_normalized);

-- Create function to update normalized fields from extracted_data
CREATE OR REPLACE FUNCTION update_normalized_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Update normalized fields from extracted_data JSONB
  NEW.normalized_policy_number := COALESCE(
    NEW.extracted_data->'extracted_fields'->>'policy_number',
    NEW.extracted_data->'extracted_fields'->>'policyNumber',
    NEW.extracted_data->'extracted_fields'->>'daskPolicyNumber'
  );
  
  NEW.normalized_customer_name := COALESCE(
    NEW.extracted_data->'extracted_fields'->>'insured_name',
    NEW.extracted_data->'extracted_fields'->>'customer_name',
    NEW.extracted_data->'extracted_fields'->>'policyholderName',
    NEW.extracted_data->'extracted_fields'->>'insuredName'
  );
  
  NEW.normalized_insurance_company := COALESCE(
    NEW.extracted_data->'extracted_fields'->>'insurance_company',
    NEW.extracted_data->'extracted_fields'->>'insuranceCompany',
    NEW.extracted_data->'extracted_fields'->>'company'
  );
  
  NEW.normalized_vehicle_plate := COALESCE(
    NEW.extracted_data->'extracted_fields'->>'vehicle_plate',
    NEW.extracted_data->'extracted_fields'->>'plateNumber',
    NEW.extracted_data->'extracted_fields'->>'plate_number'
  );
  
  NEW.normalized_tc_number := COALESCE(
    NEW.extracted_data->'extracted_fields'->>'tc_number',
    NEW.extracted_data->'extracted_fields'->>'insured_tc_number',
    NEW.extracted_data->'extracted_fields'->>'customer_tc'
  );
  
  NEW.normalized_phone := COALESCE(
    NEW.extracted_data->'extracted_fields'->>'company_phone',
    NEW.extracted_data->'extracted_fields'->>'phone',
    NEW.extracted_data->'extracted_fields'->>'insured_phone',
    NEW.extracted_data->'extracted_fields'->>'customer_phone'
  );
  
  -- Parse dates
  NEW.policy_start_date := CASE 
    WHEN NEW.extracted_data->'extracted_fields'->>'startDate' IS NOT NULL 
    THEN (NEW.extracted_data->'extracted_fields'->>'startDate')::DATE
    WHEN NEW.extracted_data->'extracted_fields'->>'policy_start_date' IS NOT NULL 
    THEN (NEW.extracted_data->'extracted_fields'->>'policy_start_date')::DATE
    ELSE NULL
  END;
  
  NEW.policy_end_date := CASE 
    WHEN NEW.extracted_data->'extracted_fields'->>'endDate' IS NOT NULL 
    THEN (NEW.extracted_data->'extracted_fields'->>'endDate')::DATE
    WHEN NEW.extracted_data->'extracted_fields'->>'policy_end_date' IS NOT NULL 
    THEN (NEW.extracted_data->'extracted_fields'->>'policy_end_date')::DATE
    ELSE NULL
  END;
  
  -- Parse currency amounts
  NEW.policy_premium := CASE 
    WHEN NEW.extracted_data->'extracted_fields'->>'policyPremium' IS NOT NULL 
    THEN (NEW.extracted_data->'extracted_fields'->>'policyPremium')::DECIMAL(12,2)
    WHEN NEW.extracted_data->'extracted_fields'->>'policy_premium' IS NOT NULL 
    THEN (NEW.extracted_data->'extracted_fields'->>'policy_premium')::DECIMAL(12,2)
    ELSE NULL
  END;
  
  NEW.coverage_amount := CASE 
    WHEN NEW.extracted_data->'extracted_fields'->>'buildingCoverageAmount' IS NOT NULL 
    THEN (NEW.extracted_data->'extracted_fields'->>'buildingCoverageAmount')::DECIMAL(12,2)
    WHEN NEW.extracted_data->'extracted_fields'->>'kasko_amount' IS NOT NULL 
    THEN (NEW.extracted_data->'extracted_fields'->>'kasko_amount')::DECIMAL(12,2)
    WHEN NEW.extracted_data->'extracted_fields'->>'total_amount' IS NOT NULL 
    THEN (NEW.extracted_data->'extracted_fields'->>'total_amount')::DECIMAL(12,2)
    ELSE NULL
  END;
  
  -- Set document type
  NEW.document_type_normalized := NEW.extracted_data->>'document_type';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update normalized fields
CREATE TRIGGER update_documents_normalized_fields
  BEFORE INSERT OR UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION update_normalized_fields();

-- Update existing documents to populate normalized fields
UPDATE public.documents 
SET extracted_data = extracted_data
WHERE extracted_data IS NOT NULL;

-- Create view for easy querying of normalized data
CREATE OR REPLACE VIEW documents_normalized AS
SELECT 
  id,
  user_id,
  filename,
  original_filename,
  file_type,
  status,
  extracted_data,
  ocr_confidence,
  processing_time,
  error_message,
  created_at,
  updated_at,
  -- Normalized fields
  normalized_policy_number,
  normalized_customer_name,
  normalized_insurance_company,
  normalized_vehicle_plate,
  normalized_tc_number,
  normalized_phone,
  policy_start_date,
  policy_end_date,
  policy_premium,
  coverage_amount,
  document_type_normalized
FROM public.documents;

-- Create function for advanced search with normalized fields
CREATE OR REPLACE FUNCTION search_documents_advanced(
  user_id_param UUID,
  search_query TEXT DEFAULT '',
  document_type_filter TEXT DEFAULT '',
  customer_name_filter TEXT DEFAULT '',
  policy_number_filter TEXT DEFAULT '',
  company_filter TEXT DEFAULT '',
  date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  min_premium DECIMAL DEFAULT NULL,
  max_premium DECIMAL DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  filename TEXT,
  original_filename TEXT,
  file_type TEXT,
  status TEXT,
  extracted_data JSONB,
  ocr_confidence NUMERIC(6,2),
  created_at TIMESTAMP WITH TIME ZONE,
  search_rank REAL,
  normalized_policy_number TEXT,
  normalized_customer_name TEXT,
  normalized_insurance_company TEXT,
  normalized_vehicle_plate TEXT,
  policy_start_date DATE,
  policy_end_date DATE,
  policy_premium DECIMAL(12,2),
  coverage_amount DECIMAL(12,2),
  document_type_normalized TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    END as search_rank,
    d.normalized_policy_number,
    d.normalized_customer_name,
    d.normalized_insurance_company,
    d.normalized_vehicle_plate,
    d.policy_start_date,
    d.policy_end_date,
    d.policy_premium,
    d.coverage_amount,
    d.document_type_normalized
  FROM documents d
  LEFT JOIN document_search ds ON d.id = ds.document_id
  WHERE d.user_id = user_id_param
    AND (search_query = '' OR to_tsvector('turkish', ds.content_text) @@ plainto_tsquery('turkish', search_query))
    AND (document_type_filter = '' OR d.document_type_normalized = document_type_filter)
    AND (customer_name_filter = '' OR d.normalized_customer_name ILIKE '%' || customer_name_filter || '%')
    AND (policy_number_filter = '' OR d.normalized_policy_number ILIKE '%' || policy_number_filter || '%')
    AND (company_filter = '' OR d.normalized_insurance_company ILIKE '%' || company_filter || '%')
    AND (date_from IS NULL OR d.created_at >= date_from)
    AND (date_to IS NULL OR d.created_at <= date_to)
    AND (min_premium IS NULL OR d.policy_premium >= min_premium)
    AND (max_premium IS NULL OR d.policy_premium <= max_premium)
  ORDER BY 
    CASE WHEN search_query = '' THEN d.created_at ELSE NULL END DESC,
    CASE WHEN search_query != '' THEN ts_rank(to_tsvector('turkish', ds.content_text), plainto_tsquery('turkish', search_query)) ELSE NULL END DESC;
END;
$$;

-- Create analytics function with normalized data
CREATE OR REPLACE FUNCTION get_user_analytics_advanced(user_id_param UUID)
RETURNS TABLE (
  total_documents BIGINT,
  processed_documents BIGINT,
  failed_documents BIGINT,
  total_premium DECIMAL(12,2),
  avg_premium DECIMAL(12,2),
  documents_by_type JSONB,
  documents_by_month JSONB,
  top_companies JSONB,
  recent_activity JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_documents,
    COUNT(*) FILTER (WHERE status = 'completed') as processed_documents,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_documents,
    COALESCE(SUM(policy_premium), 0) as total_premium,
    COALESCE(AVG(policy_premium), 0) as avg_premium,
    (
      SELECT jsonb_object_agg(document_type_normalized, count)
      FROM (
        SELECT document_type_normalized, COUNT(*) as count
        FROM documents
        WHERE user_id = user_id_param AND document_type_normalized IS NOT NULL
        GROUP BY document_type_normalized
      ) t
    ) as documents_by_type,
    (
      SELECT jsonb_object_agg(to_char(created_at, 'YYYY-MM'), count)
      FROM (
        SELECT DATE_TRUNC('month', created_at) as created_at, COUNT(*) as count
        FROM documents
        WHERE user_id = user_id_param
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY created_at DESC
        LIMIT 12
      ) t
    ) as documents_by_month,
    (
      SELECT jsonb_object_agg(normalized_insurance_company, count)
      FROM (
        SELECT normalized_insurance_company, COUNT(*) as count
        FROM documents
        WHERE user_id = user_id_param AND normalized_insurance_company IS NOT NULL
        GROUP BY normalized_insurance_company
        ORDER BY count DESC
        LIMIT 10
      ) t
    ) as top_companies,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'filename', original_filename,
          'type', document_type_normalized,
          'created_at', created_at,
          'premium', policy_premium
        )
      )
      FROM (
        SELECT id, original_filename, document_type_normalized, created_at, policy_premium
        FROM documents
        WHERE user_id = user_id_param
        ORDER BY created_at DESC
        LIMIT 10
      ) t
    ) as recent_activity
  FROM documents
  WHERE user_id = user_id_param;
END;
$$;
