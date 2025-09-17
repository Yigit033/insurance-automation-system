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

// Professional field extraction aligned with fieldMapping.ts
function extractFieldsFromText(text: string, documentType: string): any {
  const fields: any = {};
  
  // UNIVERSAL FIELDS - matching fieldMapping.ts exactly
  
  // Customer Information
  fields.insured_name = extractInsuredNameAdvanced(text);
  fields.customer_name = extractCustomerName(text);
  fields.policyholderName = extractPolicyHolderName(text);
  
  // Policy Information  
  fields.policy_number = extractPolicyNumberAdvanced(text);
  fields.policyNumber = extractPolicyNumberAdvanced(text); // Alternative field name
  fields.daskPolicyNumber = extractDaskPolicyNumber(text);
  
  // Dates
  fields.start_date = extractStartDate(text);
  fields.startDate = extractStartDate(text); // Alternative field name
  fields.end_date = extractEndDate(text);
  fields.endDate = extractEndDate(text); // Alternative field name
  fields.issue_date = extractIssueDate(text);
  fields.issueDate = extractIssueDate(text); // Alternative field name
  
  // Company Information
  fields.insurance_company = extractInsuranceCompany(text);
  fields.insuranceCompany = extractInsuranceCompany(text); // Alternative field name
  fields.company_phone = extractCompanyPhone(text);
  fields.companyPhone = extractCompanyPhone(text); // Alternative field name
  fields.company_address = extractCompanyAddress(text);
  fields.companyAddress = extractCompanyAddress(text); // Alternative field name
  
  // Coverage Information
  fields.buildingCoverage = extractBuildingCoverage(text); // For coverageType
  fields.buildingCoverageAmount = extractBuildingCoverageAmount(text); // For coverageAmount
  
  // Financial Information
  fields.policyPremium = extractPolicyPremium(text);
  fields.policy_premium = extractPolicyPremium(text); // Alternative field name
  fields.gross_premium = extractGrossPremium(text);
  fields.grossPremium = extractGrossPremium(text); // Alternative field name
  fields.net_premium = extractNetPremium(text);
  fields.netPremium = extractNetPremium(text); // Alternative field name
  fields.tax_amount = extractTaxAmount(text);
  fields.taxAmount = extractTaxAmount(text); // Alternative field name
  
  // Agency Information
  fields.agencyNumber = extractAgencyNumber(text);
  fields.agency_number = extractAgencyNumber(text); // Alternative field name
  fields.renewalNumber = extractRenewalNumber(text);
  fields.renewal_number = extractRenewalNumber(text); // Alternative field name
  
  // Discount Information
  fields.discountSurchargeInfo = extractDiscountInfo(text);
  fields.discount_info = extractDiscountInfo(text); // Alternative field name
  
  // DOCUMENT TYPE SPECIFIC FIELDS
  
  if (documentType === 'deprem' || documentType === 'konut') {
    // Building Information
    fields.buildingCode = extractBuildingCode(text);
    fields.building_code = extractBuildingCode(text); // Alternative field name
    fields.addressCode = extractAddressCode(text);
    fields.address_code = extractAddressCode(text); // Alternative field name
    fields.buildingType = extractBuildingTypeAdvanced(text);
    fields.building_type = extractBuildingTypeAdvanced(text); // Alternative field name
    fields.buildingYear = extractBuildingYear(text);
    fields.building_year = extractBuildingYear(text); // Alternative field name
    fields.apartmentArea = extractApartmentArea(text);
    fields.apartment_area = extractApartmentArea(text); // Alternative field name
    fields.floorLocated = extractFloorLocation(text);
    fields.floor_located = extractFloorLocation(text); // Alternative field name
    fields.damageStatus = extractDamageStatus(text);
    fields.damage_status = extractDamageStatus(text); // Alternative field name
    fields.province = extractProvince(text);
    fields.insured_address = extractInsuredAddress(text);
    fields.insuredAddress = extractInsuredAddress(text); // Alternative field name
    fields.insured_phone = extractInsuredPhone(text);
    fields.insuredPhone = extractInsuredPhone(text); // Alternative field name
    fields.plateNumber = extractPlateNumberFromText(text); // For levha no in DASK
    
  } else if (documentType === 'kasko' || documentType === 'trafik') {
    // Vehicle Information
    fields.vehicle_plate = extractVehiclePlate(text);
    fields.vehiclePlate = extractVehiclePlate(text); // Alternative field name
    fields.plate_number = extractVehiclePlate(text); // Alternative field name
    fields.vehicle_brand = extractVehicleBrandAdvanced(text);
    fields.vehicleBrand = extractVehicleBrandAdvanced(text); // Alternative field name
    fields.vehicle_model = extractVehicleModelAdvanced(text);
    fields.vehicleModel = extractVehicleModelAdvanced(text); // Alternative field name
    fields.vehicle_year = extractVehicleYearAdvanced(text);
    fields.vehicleYear = extractVehicleYearAdvanced(text); // Alternative field name
    fields.vehicle_chassis = extractChassisNumber(text);
    fields.vehicleChassis = extractChassisNumber(text); // Alternative field name
    fields.chassis_number = extractChassisNumber(text); // Alternative field name
    fields.vehicle_motor = extractMotorNumber(text);
    fields.vehicleMotor = extractMotorNumber(text); // Alternative field name
    fields.motor_number = extractMotorNumber(text); // Alternative field name
    fields.vehicle_value = extractVehicleValue(text);
    fields.vehicleValue = extractVehicleValue(text); // Alternative field name
    fields.kasko_premium = extractKaskoPremium(text);
    fields.kaskoPremium = extractKaskoPremium(text); // Alternative field name
    fields.mali_sorumluluk = extractMaliSorumluluk(text);
    fields.maliSorumluluk = extractMaliSorumluluk(text); // Alternative field name
    fields.ferdi_kaza = extractFerdiKaza(text);
    fields.ferdiKaza = extractFerdiKaza(text); // Alternative field name
    fields.hukuksal_koruma = extractHuksalKoruma(text);
    fields.huksalKoruma = extractHuksalKoruma(text); // Alternative field name
    
  } else if (documentType === 'hasar' || documentType === 'ekspertiz') {
    // Expert Information
    fields.expertName = extractExpertName(text);
    fields.expert_name = extractExpertName(text); // Alternative field name
    fields.expertRegistry = extractExpertRegistry(text);
    fields.expert_registry = extractExpertRegistry(text); // Alternative field name
    
    // Damage Information
    fields.damageDate = extractDamageDate(text);
    fields.damage_date = extractDamageDate(text); // Alternative field name
    fields.damageLocation = extractDamageLocation(text);
    fields.damage_location = extractDamageLocation(text); // Alternative field name
    fields.damageDescription = extractDamageDescription(text);
    fields.damage_description = extractDamageDescription(text); // Alternative field name
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
    // Pattern: "Sigorta Sirketi Poliçe No" followed by number (HIGHEST PRIORITY)
    /Sigorta Sirketi Poliçe No\s*:?\s*([0-9]+)/i,
    // Pattern: "Poliçe No" but NOT "DASK Poliçe No"
    /(?<!DASK\s+)Poliçe No\s*:?\s*([0-9]+)/i,
    // Generic policy pattern
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
    // Pattern: "DASK Pollçe No" with typo in OCR
    /DASK\s+Pollçe\s+No\s*:?\s*([0-9]+)/i,
    // Pattern: Correct spelling
    /DASK\s+Poliçe\s+No\s*:?\s*([0-9]+)/i,
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
    // Pattern: "Adi Soyadi/Unvani" followed by name on same or next line
    /Adi Soyadi\/Unvani\s*\n?\s*([A-ZÇĞIİÖŞÜ]+(?:\s+[A-ZÇĞIİÖŞÜ]+)*)/i,
    // Pattern: "SIGORTALI BILGILERI" section with name after
    /SİGORTALI BILGILERI[\s\S]*?Adi Soyadi\/Unvani\s*\n?\s*([A-ZÇĞIİÖŞÜ]+(?:\s+[A-ZÇĞIİÖŞÜ]+)*)/i,
    // Pattern: Look for "EMRAH TILAVER" specifically in SIGORTALI section
    /SİGORTALI BILGILERI[\s\S]*?([A-ZÇĞIİÖŞÜ]+\s+[A-ZÇĞIİÖŞÜ]+)(?=\s*\n?\s*TCKN|$)/i,
    // Generic name pattern after specific labels
    /(?:SİGORTALI|SIGORTAL|Sigortalı)\s+(?:ADI|Adı)\s*\/?\s*(?:SOYADI|Soyadi|UNVANI|Unvani)?\s*:?\s*([A-ZÇĞIİÖŞÜ]+(?:\s+[A-ZÇĞIİÖŞÜ]+)*)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      // Filter out common non-name patterns and validate
      if (name.length > 2 && 
          !name.includes('BILGILERI') && 
          !name.includes('TCKN') &&
          !name.includes('VKN') &&
          !name.includes('YKN') &&
          /^[A-ZÇĞIİÖŞÜ\s]+$/.test(name)) {
        return name;
      }
    }
  }
  
  return null;
}

function extractPolicyHolderName(text: string): string | null {
  const patterns = [
    // Pattern: "Adi Soyadt/Unvani" in SIGORTA ETTIREN section
    /SİGORTA ETTIREN BILGILER[\s\S]*?Adi Soyadt\/Unvani\s*\n?\s*([A-ZÇĞIİÖŞÜ]+(?:\s+[A-ZÇĞIİÖŞÜ]+)*)/i,
    // Pattern: Look for name in SIGORTA ETTIREN section
    /SİGORTA ETTIREN BILGILER[\s\S]*?([A-ZÇĞIİÖŞÜ]+\s+[A-ZÇĞIİÖŞÜ]+)(?=\s*\n?\s*TCKN|$)/i,
    // Pattern: "Adi Soyadt/Unvani" followed by name
    /Adi Soyadt\/Unvani\s*\n?\s*([A-ZÇĞIİÖŞÜ]+(?:\s+[A-ZÇĞIİÖŞÜ]+)*)/i,
    // Generic policyholder pattern
    /(?:SİGORTA ETTIREN|Sigorta Ettiren)\s+(?:ADI|Adi)\s*\/?\s*(?:SOYADI|Soyadi|UNVANI|Unvani)?\s*:?\s*([A-ZÇĞIİÖŞÜ]+(?:\s+[A-ZÇĞIİÖŞÜ]+)*)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      // Validate name format and filter out unwanted patterns
      if (name.length > 2 && 
          !name.includes('BILGILERI') && 
          !name.includes('TCKN') &&
          !name.includes('VKN') &&
          !name.includes('YKN') &&
          /^[A-ZÇĞIİÖŞÜ\s]+$/.test(name)) {
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
    // Pattern: "Baslangiç Tarihi" followed by colon and date
    /Baslangiç Tarihi\s*:?\s*([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4})/i,
    // Pattern: Generic start date patterns
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
    // Pattern: "Bitig Tarihi" followed by colon and date
    /Bitig Tarihi\s*:?\s*([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4})/i,
    // Pattern: Generic end date patterns
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
    // Pattern: "Tanzim Tarihi" followed by colon and date
    /Tanzim Tarihi\s*:?\s*([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4})/i,
    // Pattern: Generic issue date patterns
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
    // Pattern: Line starting with colon and containing "SIGORTA"
    /:([A-ZÇĞIİÖŞÜ\s\.]+SIGORTA[A-ZÇĞIİÖŞÜ\s\.]*)/i,
    // Pattern: "Sigorta Sirketi Unvani" followed by company name
    /Sigorta Sirketi Unvant?\s*:?\s*([A-ZÇĞIİÖŞÜ\s\.]+?)(?:\n|Sigorta Sirketi Poliçe)/i,
    // Generic insurance company pattern
    /(?:Insurance|INSURANCE)\s+(?:Company|COMPANY)\s*:?\s*([A-ZÇĞIİÖŞÜ\s\.]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const company = match[1].trim();
      // Validate company name and filter unwanted patterns
      if (company.length > 5 && 
          !company.includes('BILGILERI') && 
          !company.includes('POLIÇE') &&
          !company.includes('NO') &&
          company.includes('SIGORTA') &&
          /[A-ZÇĞIİÖŞÜ]/.test(company)) {
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
    // Pattern: "Adres Kodu" followed by colon and number
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
    // Pattern: "Bina Kodu" followed by colon and number
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

// Additional missing extraction functions

function extractCompanyAddress(text: string): string | null {
  const patterns = [
    /(?:ŞİRKET ADRESİ|Şirket Adresi|Company Address)\s*:?\s*([A-ZÇĞIİÖŞÜa-zçğıiöşü0-9\s\.\,\/\-]+)/i,
    /(?:ADRES|Address)\s*:?\s*([A-ZÇĞIİÖŞÜa-zçğıiöşü0-9\s\.\,\/\-]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const address = match[1].trim();
      if (address.length > 5) return address;
    }
  }
  
  return null;
}

function extractGrossPremium(text: string): string | null {
  const patterns = [
    /(?:BRÜT PRİM|Brüt Prim|Gross Premium)\s*:?\s*([\d\.,]+)/i,
    /(?:TOPLAM TUTAR|Toplam Tutar|Total Amount)\s*:?\s*([\d\.,]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

function extractNetPremium(text: string): string | null {
  const patterns = [
    /(?:NET PRİM|Net Prim|Net Premium)\s*:?\s*([\d\.,]+)/i,
    /(?:NET TUTAR|Net Tutar|Net Amount)\s*:?\s*([\d\.,]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

function extractTaxAmount(text: string): string | null {
  const patterns = [
    /(?:VERGİ TUTARI|Vergi Tutarı|Tax Amount)\s*:?\s*([\d\.,]+)/i,
    /(?:KDV|Kdv)\s*:?\s*([\d\.,]+)/i,
    /(?:TAX|Tax)\s*:?\s*([\d\.,]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

// Expert and Damage related functions for hasar/ekspertiz documents

function extractExpertName(text: string): string | null {
  const patterns = [
    /(?:EKSPER ADI|Eksper Adı|Expert Name)\s*:?\s*([A-ZÇĞIİÖŞÜ\s]+)/i,
    /(?:EKSPER|Expert)\s*:?\s*([A-ZÇĞIİÖŞÜ\s]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      if (name.length > 2 && /^[A-ZÇĞIİÖŞÜ\s]+$/.test(name)) {
        return name;
      }
    }
  }
  
  return null;
}

function extractExpertRegistry(text: string): string | null {
  const patterns = [
    /(?:SİCİL NO|Sicil No|Registry No)\s*:?\s*([0-9]+)/i,
    /(?:SİCİL NUMARASI|Sicil Numarası|Registry Number)\s*:?\s*([0-9]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

function extractDamageDate(text: string): string | null {
  const patterns = [
    /(?:HASAR TARİHİ|Hasar Tarihi|Damage Date)\s*:?\s*([0-9]{1,2}[\/\.\-][0-9]{1,2}[\/\.\-][0-9]{4})/i,
    /(?:KAZA TARİHİ|Kaza Tarihi|Accident Date)\s*:?\s*([0-9]{1,2}[\/\.\-][0-9]{1,2}[\/\.\-][0-9]{4})/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

function extractDamageLocation(text: string): string | null {
  const patterns = [
    /(?:HASAR YERİ|Hasar Yeri|Damage Location)\s*:?\s*([A-ZÇĞIİÖŞÜa-zçğıiöşü0-9\s\.\,\/\-]+)/i,
    /(?:KAZA YERİ|Kaza Yeri|Accident Location)\s*:?\s*([A-ZÇĞIİÖŞÜa-zçğıiöşü0-9\s\.\,\/\-]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const location = match[1].trim();
      if (location.length > 3) return location;
    }
  }
  
  return null;
}

function extractDamageDescription(text: string): string | null {
  const patterns = [
    /(?:HASAR TANIMI|Hasar Tanımı|Damage Description)\s*:?\s*([A-ZÇĞIİÖŞÜa-zçğıiöşü0-9\s\.\,\/\-\(\)]+)/i,
    /(?:HASAR DETAYLARI|Hasar Detayları|Damage Details)\s*:?\s*([A-ZÇĞIİÖŞÜa-zçğıiöşü0-9\s\.\,\/\-\(\)]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const description = match[1].trim();
      if (description.length > 5) return description;
    }
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