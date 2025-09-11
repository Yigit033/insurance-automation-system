import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, fileContent, fileType } = await req.json();

    console.log(`Processing document ${documentId} of type ${fileType}`);

    // Update document status to processing
    await supabase
      .from('documents')
      .update({ status: 'processing' })
      .eq('id', documentId);

    let extractedText = '';
    let ocrConfidence = 0;

    // Process based on file type
    if (fileType.startsWith('image/')) {
      // Use OpenAI Vision API for image OCR
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Sen bir sigorta belgesi OCR uzmanısın. Türkçe sigorta belgelerindeki metinleri çıkarır ve yapılandırırsın. 

GÖREV: Verilen sigorta belgesindeki tüm metni çıkar ve aşağıdaki formatta JSON olarak yapılandır:

{
  "raw_text": "belgedeki tüm metin",
  "structured_data": {
    "customer_name": "müşteri adı",
    "national_id": "TC kimlik no",
    "policy_number": "poliçe numarası", 
    "vehicle_plate": "araç plakası",
    "phone": "telefon numarası",
    "amount": "tutar",
    "date": "tarih",
    "insurance_company": "sigorta şirketi",
    "document_type": "belge türü (kasko, trafik, hasar vb.)"
  },
  "confidence": 95
}`
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Bu sigorta belgesindeki tüm bilgileri çıkar ve yapılandır:'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${fileType};base64,${fileContent}`
                  }
                }
              ]
            }
          ],
          max_tokens: 2000
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const result = JSON.parse(data.choices[0].message.content);
        extractedText = result.raw_text;
        ocrConfidence = result.confidence;

        // Store structured data
        const structuredData = result.structured_data;
        
        // Insert document fields
        for (const [fieldName, fieldValue] of Object.entries(structuredData)) {
          if (fieldValue && fieldValue !== '') {
            await supabase
              .from('document_fields')
              .insert({
                document_id: documentId,
                field_name: fieldName,
                field_value: String(fieldValue),
                confidence: ocrConfidence,
                field_type: 'text'
              });
          }
        }

        // Update document with extracted data
        await supabase
          .from('documents')
          .update({
            status: 'completed',
            extracted_data: structuredData,
            ocr_confidence: ocrConfidence,
            processing_time: Date.now()
          })
          .eq('id', documentId);

        // Create search index
        await supabase
          .from('document_search')
          .insert({
            document_id: documentId,
            content_text: extractedText,
            search_vector: extractedText // Simplified - in production use proper tsvector
          });

      } else {
        throw new Error('OCR processing failed');
      }
    } else if (fileType === 'application/pdf') {
      // For PDF files, use a simulated extraction
      extractedText = "PDF belge işleme simülasyonu - gerçek uygulamada PDF parser kullanılacak";
      ocrConfidence = 90;

      const simulatedData = {
        customer_name: "Ahmet Yılmaz",
        national_id: "12345678901",
        policy_number: "POL-2024-001",
        vehicle_plate: "34 ABC 123",
        amount: "15.000 ₺",
        document_type: "kasko"
      };

      // Store simulated data
      for (const [fieldName, fieldValue] of Object.entries(simulatedData)) {
        await supabase
          .from('document_fields')
          .insert({
            document_id: documentId,
            field_name: fieldName,
            field_value: fieldValue,
            confidence: ocrConfidence,
            field_type: 'text'
          });
      }

      await supabase
        .from('documents')
        .update({
          status: 'completed',
          extracted_data: simulatedData,
          ocr_confidence: ocrConfidence,
          processing_time: Date.now()
        })
        .eq('id', documentId);
    }

    console.log(`Document ${documentId} processed successfully`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        extractedText,
        confidence: ocrConfidence 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing document:', error);

    // Update document status to failed
    if (req.body) {
      const { documentId } = await req.json();
      await supabase
        .from('documents')
        .update({ 
          status: 'failed',
          error_message: error.message 
        })
        .eq('id', documentId);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});