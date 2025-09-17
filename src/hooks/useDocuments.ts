import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { config } from '@/utils/environment'; // NEW: Environment service import

// Enhanced inline document processing function with security
async function processDocumentInline(documentId: string, fileContent: string, fileType: string) {
  try {
    console.log('🚀 Processing document:', documentId);
    
    // Get OCR configuration securely
    const ocrConfig = config.getOcrConfig();
    
    if (!ocrConfig.primaryApiKey) {
      throw new Error('OCR API key not configured. Please check environment variables.');
    }
    
    // Call OCR.space API with retry logic
    console.log('🔍 Calling OCR.space API...');
    const ocrData = await callOcrWithRetry(fileContent, fileType, ocrConfig);
    console.log('📝 OCR response received');
    
    if (!ocrData.ParsedResults || ocrData.ParsedResults.length === 0) {
      throw new Error('OCR failed to extract text from document');
    }
    
    const extractedText = ocrData.ParsedResults[0].ParsedText;
    console.log('📊 Extracted text length:', extractedText.length);
    
    // Enhanced document type detection
    const documentType = detectDocumentType(extractedText);
    console.log('📋 Detected document type:', documentType);
    
    // Enhanced field extraction
    const extractedFields = extractFieldsFromText(extractedText, documentType);
    console.log('📋 Extracted fields:', extractedFields);
    
    // Calculate confidence score
    const confidence = calculateConfidenceScore(extractedText, extractedFields);
    
    // Update document in Supabase
    const { error } = await supabase
      .from('documents')
      .update({
        status: 'completed',
        extracted_data: {
          document_type: documentType,
          extracted_fields: extractedFields,
          raw_text: extractedText,
          confidence_score: confidence,
          processing_timestamp: new Date().toISOString()
        },
        ocr_confidence: confidence
      })
      .eq('id', documentId);
    
    if (error) {
      console.error('❌ Database update error:', error);
      throw new Error(`Database update failed: ${error.message}`);
    }
    
    console.log('✅ Document processing completed successfully');
    return { 
      success: true, 
      data: { 
        documentType, 
        extractedFields, 
        confidence,
        processingTime: Date.now() 
      } 
    };
    
  } catch (error) {
    console.error('❌ Error processing document:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown processing error',
      timestamp: new Date().toISOString()
    };
  }
}

// Enhanced OCR call with retry logic and fallback
async function callOcrWithRetry(
  fileContent: string, 
  fileType: string, 
  ocrConfig: any,
  attempt: number = 1
): Promise<any> {
  const maxRetries = ocrConfig.maxRetries || 3;
  const timeout = ocrConfig.timeout || 30000;
  
  try {
    const apiKey = attempt === 1 ? ocrConfig.primaryApiKey : (ocrConfig.backupApiKey || ocrConfig.primaryApiKey);
    
    const ocrFormData = new FormData();
    ocrFormData.append('apikey', apiKey);
    ocrFormData.append('base64Image', `data:${fileType};base64,${fileContent}`);
    ocrFormData.append('language', 'tur');
    ocrFormData.append('isOverlayRequired', 'false');
    ocrFormData.append('detectOrientation', 'true');
    ocrFormData.append('scale', 'true');
    ocrFormData.append('OCREngine', '2');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: ocrFormData,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!ocrResponse.ok) {
      throw new Error(`OCR API returned ${ocrResponse.status}: ${ocrResponse.statusText}`);
    }
    
    const ocrData = await ocrResponse.json();
    
    if (ocrData.OCRExitCode !== 1 && ocrData.OCRExitCode !== 2) {
      throw new Error(`OCR processing failed: ${ocrData.ErrorMessage || 'Unknown error'}`);
    }
    
    return ocrData;
    
  } catch (error) {
    console.warn(`🟡 OCR attempt ${attempt} failed:`, error);
    
    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      console.log(`⏳ Retrying OCR in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callOcrWithRetry(fileContent, fileType, ocrConfig, attempt + 1);
    }
    
    throw new Error(`OCR failed after ${maxRetries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Enhanced document type detection
function detectDocumentType(text: string): string {
  const textUpper = text.toUpperCase();
  
  // More sophisticated detection patterns
  const patterns = {
    'deprem': ['DEPREM', 'DASK', 'DOĞAL AFET', 'EARTHQUAKE'],
    'kasko': ['KASKO', 'MOTORLİ ARAÇLAR', 'OTO', 'VEHICLE'],
    'trafik': ['TRAFİK', 'ZORUNLU', 'COMPULSORY', 'MOTOR'],
    'saglik': ['SAĞLIK', 'HEALTH', 'MEDİKAL', 'MEDICAL'],
    'hayat': ['HAYAT', 'LIFE', 'YAŞ', 'VEFAT'],
    'konut': ['KONUT', 'EV', 'HOME', 'HOUSE', 'DWELLING']
  };
  
  for (const [type, keywords] of Object.entries(patterns)) {
    if (keywords.some(keyword => textUpper.includes(keyword))) {
      return type;
    }
  }
  
  return 'unknown';
}

// Professional field extraction with comprehensive patterns
function extractFieldsFromText(text: string, documentType: string): any {
  const fields: any = {};
  
  // Common fields for all document types - using proven patterns
  fields.policy_number = extractPolicyNumberAdvanced(text);
  fields.insured_name = extractInsuredNameAdvanced(text);
  fields.policyholderName = extractPolicyHolderName(text);
  fields.customer_name = extractCustomerName(text);
  fields.startDate = extractStartDate(text);
  fields.endDate = extractEndDate(text);
  fields.issueDate = extractIssueDate(text);
  fields.policyPremium = extractPolicyPremium(text);
  fields.insuranceCompany = extractInsuranceCompany(text);
  fields.company_phone = extractCompanyPhone(text);
  fields.agencyNumber = extractAgencyNumber(text);
  fields.renewalNumber = extractRenewalNumber(text);
  
  // Document type specific fields with advanced patterns
  if (documentType === 'deprem' || documentType === 'konut') {
    // DEPREM/KONUT specific fields
    fields.daskPolicyNumber = extractDaskPolicyNumber(text);
    fields.addressCode = extractAddressCode(text);
    fields.buildingCode = extractBuildingCode(text);
    fields.buildingType = extractBuildingTypeAdvanced(text);
    fields.buildingYear = extractBuildingYear(text);
    fields.apartmentArea = extractApartmentArea(text);
    fields.floorLocated = extractFloorLocation(text);
    fields.damageStatus = extractDamageStatus(text);
    fields.buildingCoverage = extractBuildingCoverage(text);
    fields.buildingCoverageAmount = extractBuildingCoverageAmount(text);
    fields.discountSurchargeInfo = extractDiscountInfo(text);
    fields.province = extractProvince(text);
    fields.insured_address = extractInsuredAddress(text);
    fields.insured_phone = extractInsuredPhone(text);
    fields.plateNumber = extractPlateNumberFromText(text); // For levha no
  } else if (documentType === 'kasko' || documentType === 'trafik') {
    // KASKO/TRAFİK specific fields
    fields.plate_number = extractVehiclePlate(text);
    fields.vehicle_brand = extractVehicleBrandAdvanced(text);
    fields.vehicle_model = extractVehicleModelAdvanced(text);
    fields.vehicle_year = extractVehicleYearAdvanced(text);
    fields.chassis_number = extractChassisNumber(text);
    fields.motor_number = extractMotorNumber(text);
    fields.vehicle_value = extractVehicleValue(text);
    fields.kasko_premium = extractKaskoPremium(text);
    fields.mali_sorumluluk = extractMaliSorumluluk(text);
    fields.ferdi_kaza = extractFerdiKaza(text);
    fields.hukuksal_koruma = extractHuksalKoruma(text);
  }
  
  return fields;
}

// Professional confidence scoring based on extraction quality
function calculateConfidenceScore(text: string, fields: any): number {
  let score = 0.3; // Base score
  
  // Text quality indicators
  if (text.length > 500) score += 0.15;
  if (text.length > 1000) score += 0.15;
  if (text.length > 1500) score += 0.1;
  
  // Critical field extraction success (higher weight)
  if (fields.policy_number || fields.daskPolicyNumber) score += 0.15;
  if (fields.insured_name || fields.policyholderName || fields.customer_name) score += 0.15;
  if (fields.insuranceCompany) score += 0.1;
  if (fields.startDate || fields.endDate) score += 0.1;
  if (fields.policyPremium) score += 0.08;
  
  // Document type specific bonuses
  if (fields.buildingCoverage && fields.buildingCoverageAmount) score += 0.1;
  if (fields.addressCode && fields.buildingCode) score += 0.05;
  if (fields.buildingType && fields.buildingYear) score += 0.05;
  
  // Text pattern quality indicators
  const hasStructuredData = text.includes(':') && text.includes('\t');
  if (hasStructuredData) score += 0.05;
  
  const hasDatePatterns = /[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4}/.test(text);
  if (hasDatePatterns) score += 0.03;
  
  const hasAmountPatterns = /[\d\.,]+/.test(text);
  if (hasAmountPatterns) score += 0.03;
  
  // Field extraction success rate
  const totalFields = Object.keys(fields).length;
  const extractedFields = Object.values(fields).filter(value => 
    value !== null && value !== undefined && value !== ''
  ).length;
  
  if (totalFields > 0) {
    const extractionRate = extractedFields / totalFields;
    score += extractionRate * 0.15;
  }
  
  // Normalize score to realistic range (30% - 99.99%)
  return Math.min(Math.max(score, 0.30), 0.9999);
}

// ADVANCED FIELD EXTRACTION FUNCTIONS - RESTORED FROM WORKING VERSION

function extractPolicyNumberAdvanced(text: string): string | null {
  const patterns = [
    /Sigorta Sirketi Poliçe No\s*:?\s*([0-9]+)/i,
    /(?:POLİÇE|POLICE|Poliçe)\s*(?:NO|No|NUMARASI|Numarası)\s*:?\s*([A-Z0-9\-\/\.]+)/i,
    /Policy\s*(?:Number|No)\s*:?\s*([A-Z0-9\-\/\.]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

function extractDaskPolicyNumber(text: string): string | null {
  const patterns = [
    /DASK\s+Pollçe\s+No\s*:?\s*([0-9]+)/i,
    /DASK\s+Policy\s+No\s*:?\s*([0-9]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

function extractInsuredNameAdvanced(text: string): string | null {
  const patterns = [
    /Adi Soyadi\/Unvani\s+([A-ZÇĞIİÖŞÜ\s]+)/i,
    /(?:SİGORTALI|SIGORTAL|Sigortalı)\s+(?:ADI|Adı)\s*\/?\s*(?:SOYADI|Soyadi|UNVANI|Unvani)?\s*:?\s*([A-ZÇĞIİÖŞÜ\s]+)/i,
    /(?:INSURED|Insured)\s*(?:Name|NAME)\s*:?\s*([A-ZÇĞIİÖŞÜ\s]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      // Filter out common non-name patterns
      if (name.length > 2 && !name.includes('BILGILERI') && !name.includes('TCKN')) {
        return name;
      }
    }
  }
  
  return null;
}

function extractPolicyHolderName(text: string): string | null {
  const patterns = [
    /Adi Soyadt\/Unvani\s+([A-ZÇĞIİÖŞÜ\s]+)/i,
    /(?:SİGORTA ETTIREN|Sigorta Ettiren)\s+(?:ADI|Adi)\s*\/?\s*(?:SOYADI|Soyadi|UNVANI|Unvani)?\s*:?\s*([A-ZÇĞIİÖŞÜ\s]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      if (name.length > 2 && !name.includes('BILGILERI')) {
        return name;
      }
    }
  }
  
  return null;
}

function extractCustomerName(text: string): string | null {
  // Try policyholder first, then insured
  return extractPolicyHolderName(text) || extractInsuredNameAdvanced(text);
}

function extractStartDate(text: string): string | null {
  const patterns = [
    /Baslangiç Tarihi\s*:?\s*([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4})/i,
    /(?:Başlangıç|Start)\s+(?:Tarihi|Date)\s*:?\s*([0-9]{1,2}[\/\.\-][0-9]{1,2}[\/\.\-][0-9]{4})/i,
    /Policy\s+Start\s*:?\s*([0-9]{1,2}[\/\.\-][0-9]{1,2}[\/\.\-][0-9]{4})/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

function extractEndDate(text: string): string | null {
  const patterns = [
    /Bitig Tarihi\s*:?\s*([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4})/i,
    /(?:Bitiş|End)\s+(?:Tarihi|Date)\s*:?\s*([0-9]{1,2}[\/\.\-][0-9]{1,2}[\/\.\-][0-9]{4})/i,
    /Policy\s+End\s*:?\s*([0-9]{1,2}[\/\.\-][0-9]{1,2}[\/\.\-][0-9]{4})/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

function extractIssueDate(text: string): string | null {
  const patterns = [
    /Tanzim Tarihi\s*:?\s*([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4})/i,
    /(?:Tanzim|Issue)\s+(?:Tarihi|Date)\s*:?\s*([0-9]{1,2}[\/\.\-][0-9]{1,2}[\/\.\-][0-9]{4})/i,
    /Issue\s+Date\s*:?\s*([0-9]{1,2}[\/\.\-][0-9]{1,2}[\/\.\-][0-9]{4})/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

function extractPolicyPremium(text: string): string | null {
  const patterns = [
    /Poliçe Priml\s*:?\s*([\d\.,]+)/i,
    /(?:PRİM|PRIM|Premium|PREMIUM)\s*(?:TUTARI|Tutari)?\s*:?\s*([\d\.,]+)/i,
    /Policy\s+Premium\s*:?\s*([\d\.,]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

function extractInsuranceCompany(text: string): string | null {
  const patterns = [
    /Sigorta Sirketi Unvant?\s*:?\s*([A-ZÇĞIİÖŞÜ\s\.]+)/i,
    /(?:Insurance|INSURANCE)\s+(?:Company|COMPANY)\s*:?\s*([A-ZÇĞIİÖŞÜ\s\.]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const company = match[1].trim();
      if (company.length > 3 && !company.includes('BILGILERI')) {
        return company;
      }
    }
  }
  
  return null;
}

function extractCompanyPhone(text: string): string | null {
  const patterns = [
    /Telefon\s*:?\s*\(([0-9\-\s]+)\)/i,
    /Phone\s*:?\s*\(([0-9\-\s]+)\)/i,
    /Tel\s*:?\s*\(([0-9\-\s]+)\)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

function extractAgencyNumber(text: string): string | null {
  const patterns = [
    /Acente No\s*:?\s*([0-9]+)/i,
    /Agency\s+(?:No|Number)\s*:?\s*([0-9]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

function extractRenewalNumber(text: string): string | null {
  const patterns = [
    /Yenileme No\s+([0-9]+)/i,
    /Renewal\s+(?:No|Number)\s*:?\s*([0-9]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

// DEPREM/KONUT specific extractions
function extractAddressCode(text: string): string | null {
  const patterns = [
    /Adres Kodu\s*:?\s*([0-9]+)/i,
    /Address\s+Code\s*:?\s*([0-9]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

function extractBuildingCode(text: string): string | null {
  const patterns = [
    /Bina Kodu\s*:?\s*([0-9]+)/i,
    /Building\s+Code\s*:?\s*([0-9]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

function extractBuildingTypeAdvanced(text: string): string | null {
  const patterns = [
    /Bina Yapi Tarzi?\s*:?\s*([A-ZÇĞIİÖŞÜ\s]+)/i,
    /Building\s+Type\s*:?\s*([A-ZÇĞIİÖŞÜ\s]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const type = match[1].trim();
      if (type.length > 2) return type;
    }
  }
  
  return null;
}

function extractBuildingYear(text: string): string | null {
  const patterns = [
    /Bina Inga Yilt?\s*:?\s*([0-9\s\-]+)/i,
    /Building\s+Year\s*:?\s*([0-9\s\-]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

function extractApartmentArea(text: string): string | null {
  const patterns = [
    /Daire Brut Yazolç[0-9]*mu?\s*:?\s*([0-9]+)/i,
    /(?:Area|AREA)\s*:?\s*([0-9]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

function extractFloorLocation(text: string): string | null {
  const patterns = [
    /Bulundugu Kat\s*:?\s*([A-ZÇĞIİÖŞÜ\s]+)/i,
    /Floor\s+Location\s*:?\s*([A-ZÇĞIİÖŞÜ\s]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

function extractDamageStatus(text: string): string | null {
  const patterns = [
    /Hasar Durumu\s*:?\s*([A-ZÇĞIİÖŞÜ\s]+)/i,
    /Damage\s+Status\s*:?\s*([A-ZÇĞIİÖŞÜ\s]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

function extractBuildingCoverage(text: string): string | null {
  const patterns = [
    /Bina Teminati\s*[\r\n\t]*([A-ZÇĞIİÖŞÜ\s]+)/i,
    /Building\s+Coverage\s*:?\s*([A-ZÇĞIİÖŞÜ\s]+)/i,
    /DEPREM BINA/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (pattern.source.includes('DEPREM BINA')) {
        return 'DEPREM BINA';
      }
      if (match[1]) return match[1].trim();
    }
  }
  
  return null;
}

function extractBuildingCoverageAmount(text: string): string | null {
  const patterns = [
    /Bina Teminat Bedeli\s*:?\s*([\d\.,]+)/i,
    /Building\s+Coverage\s+Amount\s*:?\s*([\d\.,]+)/i,
    /TEMİNAT BEDELI\/LIMITI[^0-9]*Bina Teminat Bedeli\s*:?\s*([\d\.,]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

function extractDiscountInfo(text: string): string | null {
  const patterns = [
    /Poliçe primine Deprem Bina teminati[^%]*%[^%]*%[^%]*/i,
    /(?:İndirim|Indirim|Discount)[^%]*%[^%]*/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[0]) return match[0].trim();
  }
  
  return null;
}

function extractProvince(text: string): string | null {
  const patterns = [
    /\(Vlice\/Bucak-Kõy\s+([A-ZÇĞIİÖŞÜ\/\-\s]+)/i,
    /Province\s*:?\s*([A-ZÇĞIİÖŞÜ\/\-\s]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

function extractInsuredAddress(text: string): string | null {
  const patterns = [
    /lietigim Adresi\s+([A-ZÇĞIİÖŞÜ0-9\s\.\,]+)/i,
    /(?:ADRES|Address)\s*:?\s*([A-ZÇĞIİÖŞÜ0-9\s\.\,\/]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

function extractInsuredPhone(text: string): string | null {
  const patterns = [
    /Cep Telefonu\s*:?\s*\(([0-9\*\-\s]+)\)/i,
    /Mobile\s+Phone\s*:?\s*\(([0-9\*\-\s]+)\)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

function extractPlateNumberFromText(text: string): string | null {
  const patterns = [
    /Levha No\s*:?\s*([A-Z0-9]+)/i,
    /Plate\s+No\s*:?\s*([A-Z0-9]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

// KASKO/TRAFİK specific extractions
function extractVehiclePlate(text: string): string | null {
  const patterns = [
    /(?:PLAKA|Plaka|Plate)\s*(?:NO|No|Number)?\s*:?\s*([0-9]{2}\s*[A-Z]{1,3}\s*[0-9]{1,4})/i,
    /\b([0-9]{2}\s*[A-Z]{1,3}\s*[0-9]{1,4})\b/g
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].replace(/\s/g, '');
  }
  
  return null;
}

function extractVehicleBrandAdvanced(text: string): string | null {
  const brands = [
    'TOYOTA', 'HONDA', 'BMW', 'MERCEDES', 'AUDI', 'VOLKSWAGEN', 'FORD', 
    'RENAULT', 'PEUGEOT', 'FIAT', 'HYUNDAI', 'KIA', 'NISSAN', 'MAZDA',
    'OPEL', 'CHEVROLET', 'SKODA', 'SEAT', 'CITROEN', 'DACIA'
  ];
  
  const patterns = [
    /(?:MARKA|Marka|Brand)\s*:?\s*([A-ZÇĞIİÖŞÜ\s]+)/i,
    /Vehicle\s+Brand\s*:?\s*([A-ZÇĞIİÖŞÜ\s]+)/i
  ];
  
  // Try specific patterns first
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const brand = match[1].trim().toUpperCase();
      if (brands.includes(brand)) return brand;
    }
  }
  
  // Fallback to brand detection in text
  const textUpper = text.toUpperCase();
  for (const brand of brands) {
    if (textUpper.includes(brand)) {
      return brand;
    }
  }
  
  return null;
}

function extractVehicleModelAdvanced(text: string): string | null {
  const patterns = [
    /(?:MODEL|Model)\s*:?\s*([A-Z0-9\s\-]+)/i,
    /Vehicle\s+Model\s*:?\s*([A-Z0-9\s\-]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

function extractVehicleYearAdvanced(text: string): string | null {
  const patterns = [
    /(?:MODEL YILI|Model Yılı|Model Year)\s*:?\s*([0-9]{4})/i,
    /Vehicle\s+Year\s*:?\s*([0-9]{4})/i,
    /\b(19[0-9]{2}|20[0-9]{2})\b/g
  ];
  
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      return Array.isArray(matches) ? matches[matches.length - 1] : matches;
    }
  }
  
  return null;
}

function extractChassisNumber(text: string): string | null {
  const patterns = [
    /(?:ŞASİ|Şasi|Chassis)\s*(?:NO|No|Number)?\s*:?\s*([A-Z0-9]+)/i,
    /Chassis\s+Number\s*:?\s*([A-Z0-9]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

function extractMotorNumber(text: string): string | null {
  const patterns = [
    /(?:MOTOR|Motor)\s*(?:NO|No|Number)?\s*:?\s*([A-Z0-9]+)/i,
    /Engine\s+Number\s*:?\s*([A-Z0-9]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

function extractVehicleValue(text: string): string | null {
  const patterns = [
    /(?:ARAÇ DEĞER|Araç Değer|Vehicle Value)\s*:?\s*([\d\.,]+)/i,
    /Market\s+Value\s*:?\s*([\d\.,]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

function extractKaskoPremium(text: string): string | null {
  const patterns = [
    /(?:KASKO|Kasko)\s*(?:PRİM|Prim|Premium)\s*:?\s*([\d\.,]+)/i,
    /Comprehensive\s+Premium\s*:?\s*([\d\.,]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

function extractMaliSorumluluk(text: string): string | null {
  const patterns = [
    /(?:MALİ SORUMLULUK|Mali Sorumluluk)\s*:?\s*([\d\.,]+)/i,
    /Liability\s+Coverage\s*:?\s*([\d\.,]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

function extractFerdiKaza(text: string): string | null {
  const patterns = [
    /(?:FERDİ KAZA|Ferdi Kaza)\s*:?\s*([\d\.,]+)/i,
    /Personal\s+Accident\s*:?\s*([\d\.,]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

function extractHuksalKoruma(text: string): string | null {
  const patterns = [
    /(?:HUKUKSAL KORUMA|Hukuksal Koruma)\s*:?\s*([\d\.,]+)/i,
    /Legal\s+Protection\s*:?\s*([\d\.,]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

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

      // Process document inline using Supabase client
      const result = await processDocumentInline(docData.id, base64, file.type);

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