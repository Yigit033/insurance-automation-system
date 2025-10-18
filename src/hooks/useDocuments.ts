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
    const timeout = 120000; // Increased timeout to 120 seconds for large files
    
    try {
      const apiKey = attempt === 1 ? ocrConfig.primaryApiKey : (ocrConfig.backupApiKey || ocrConfig.primaryApiKey);
      
      if (!apiKey) {
        throw new Error('No OCR API key configured');
      }
      
      console.log(`🔍 OCR attempt ${attempt}/${maxRetries} with API key: ${apiKey.substring(0, 8)}...`);
      console.log(`📊 File type: ${fileType}, Base64 length: ${fileContent.length}`);
      
      // Create FormData with proper structure
      const ocrFormData = new FormData();
      ocrFormData.append('apikey', apiKey);
      ocrFormData.append('base64Image', `data:${fileType};base64,${fileContent}`);
      ocrFormData.append('language', 'tur');
      ocrFormData.append('isOverlayRequired', 'false');
      ocrFormData.append('detectOrientation', 'true');
      ocrFormData.append('scale', 'true');
      ocrFormData.append('OCREngine', '2');
      ocrFormData.append('filetype', fileType.split('/')[1] || 'jpg');
      
      console.log('📤 Sending request to OCR.space API...');
      const startTime = Date.now();
      
      // Use XMLHttpRequest for better control and debugging
      const ocrData = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Set timeout
        xhr.timeout = timeout;
        
        xhr.onload = function() {
          const responseTime = Date.now() - startTime;
          console.log(`📥 Received OCR response in ${responseTime}ms with status: ${xhr.status}`);
          
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              
              if (data.OCRExitCode === 1 || data.OCRExitCode === 2) {
                console.log(`✅ OCR completed successfully in ${responseTime}ms`);
                resolve(data);
              } else {
                console.error('OCR processing failed with data:', data);
                reject(new Error(`OCR processing failed: ${data.ErrorMessage || data.ErrorDetails || `Exit code ${data.OCRExitCode}`}`));
              }
            } catch (parseError) {
              console.error('Failed to parse OCR response:', xhr.responseText);
              reject(new Error(`Failed to parse OCR response: ${parseError}`));
            }
          } else {
            console.error('OCR API error response:', xhr.responseText);
            reject(new Error(`OCR API returned ${xhr.status}: ${xhr.statusText}`));
          }
        };
        
        xhr.onerror = function() {
          console.error('Network error occurred while calling OCR API');
          reject(new Error('Network error: Unable to reach OCR.space API. Please check your internet connection.'));
        };
        
        xhr.ontimeout = function() {
          console.warn(`⌛ OCR request timed out after ${timeout}ms`);
          reject(new Error(`Request timed out after ${timeout}ms`));
        };
        
        xhr.onprogress = function(e) {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            console.log(`📊 Upload progress: ${percentComplete.toFixed(1)}%`);
          }
        };
        
        // Open and send request
        xhr.open('POST', 'https://api.ocr.space/parse/image', true);
        xhr.send(ocrFormData);
      });
      
      return ocrData;
      
    } catch (error) {
      console.warn(`🟡 OCR attempt ${attempt} failed:`, error);
      
      // Check if it's a network connectivity issue
      const isNetworkError = error instanceof Error && 
        (error.message.includes('Network error') || 
        error.message.includes('Failed to fetch') ||
        error.message.includes('Unable to reach'));
      
      if (isNetworkError && attempt === 1) {
        console.error('⚠️ Network connectivity issue detected. Possible causes:');
        console.error('  1. Firewall or antivirus blocking the request');
        console.error('  2. ISP or corporate proxy blocking OCR.space');
        console.error('  3. OCR.space API is down');
        console.error('  4. CORS policy blocking the request');
        console.error('💡 Solution: Consider using a Supabase Edge Function to proxy the request');
      }
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
        console.log(`⏳ Retrying OCR in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return callOcrWithRetry(fileContent, fileType, ocrConfig, attempt + 1);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ OCR failed after ${maxRetries} attempts:`, errorMessage);
      throw new Error(`OCR failed after ${maxRetries} attempts: ${errorMessage}`);
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
    fields.tc_number = extractTCNumber(text);
    fields.tcNumber = extractTCNumber(text); // Alternative field name
    fields.policyholderStatus = extractPolicyholderStatus(text);
    fields.policyholder_status = extractPolicyholderStatus(text);
    fields.policyholderPhone = extractPolicyholderPhone(text);
    fields.policyholder_phone = extractPolicyholderPhone(text);
    
    // Policy Information  
    const daskNo = extractDaskPolicyNumber(text);
    const insuranceCompanyPolicyNo = extractInsuranceCompanyPolicyNumber(text);
    
    // For DEPREM documents, use DASK policy number as primary policy number
    if (documentType === 'deprem' || documentType === 'konut') {
      fields.policy_number = daskNo;
      fields.policyNumber = daskNo;
      fields.daskPolicyNumber = daskNo;
      fields.insuranceCompanyPolicyNumber = insuranceCompanyPolicyNo;
    } else {
      fields.policy_number = insuranceCompanyPolicyNo || daskNo;
      fields.policyNumber = insuranceCompanyPolicyNo || daskNo;
      fields.daskPolicyNumber = daskNo;
    }
    
    // Dates
    const startDate = extractStartDate(text);
    const endDate = extractEndDate(text);
    const issueDate = extractIssueDate(text);
    
    fields.start_date = startDate;
    fields.startDate = startDate;
    fields.end_date = endDate;
    fields.endDate = endDate;
    fields.issue_date = issueDate;
    fields.issueDate = issueDate;
    
    console.log('📅 Extracted dates:', { startDate, endDate, issueDate });
    
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
      // Note: plateNumber removed - BR14777 is agency plate (Levha No), not vehicle plate
      
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

  function extractInsuranceCompanyPolicyNumber(text: string): string | null {
    const patterns = [
      // Pattern 1: "Sigorta Şirketi Poliçe No" with multiple lines then ":180938592"
      /Sigorta\s+[ŞS]irketi\s+Poli[çc]e\s+No\s*\n[\s\S]{0,100}?:(\d{8,10})/i,
      // Pattern 2: Direct match
      /Sigorta\s+[ŞS]irketi\s+Poli[çc]e\s+No\s*:?\s*(\d{8,10})/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const policyNumber = match[1].trim();
        // Validation for policy numbers (typically 5+ digits)
        if (policyNumber.length >= 5 && /^\d+$/.test(policyNumber)) {
          return policyNumber;
        }
      }
    }
    
    return null;
  }

  function extractDaskPolicyNumber(text: string): string | null {
    const patterns = [
      // Pattern 1: "DASK Poliçe No" at start with multiple lines then ":84922504"
      /^[\s\S]{0,50}DASK\s+Poli[çc]e\s+No\s*\n[\s\S]{0,100}?:(\d{7,9})/im,
      // Pattern 2: Direct match
      /DASK\s+Poli[çc]e\s+No\s*:?\s*(\d{7,9})/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const daskNo = match[1].trim();
        // DASK policy numbers are typically 7-9 digits
        if (daskNo.length >= 7 && daskNo.length <= 9) {
          return daskNo;
        }
      }
    }
    
    return null;
  }

  function extractInsuredNameAdvanced(text: string): string | null {
    const patterns = [
      // Pattern 1: "Adı Soyadı/Unvanı" followed by name on next line (SIGORTA ETTIREN)
      /Ad[ıi]\s+Soyad[ıi]\s*\/\s*Unvan[ıi]?\s*\n\s*([A-ZÇĞIİÖŞÜ]+\s+[A-ZÇĞIİÖŞÜ]+)\s*\n\s*TCKN/im,
      // Pattern 2: In SIGORTALI BILGILERI section with colon
      /S[IİĪ]GORTALI\s+B[IİĪ]LG[IİĪ]LER[IİĪ][\s\S]{0,100}?Ad[ıi]\s+Soyad[ıi]\s*\/\s*Unvan[ıi]?\s*\n\s*:([A-ZÇĞIİÖŞÜ]+\s+[A-ZÇĞIİÖŞÜ]+)/im
    ];

    // Common false positives to exclude
    const excludePatterns = [
      'BILGILERI', 'BILGI', 'TCKN', 'VKN', 'YKN', 'T.C.', 'KIMLIK', 'KİMLİK',
      'SİGORTA', 'SIGORTA', 'POLİÇE', 'POLICE', 'NO:', 'TARIH', 'TARIHI', 'DOĞUM',
      'DOGUM', 'ADRES', 'TELEFON', 'E-POSTA', 'EPOSTA', 'E[\s\.]*MAIL', 'İLÇE', 'ILCE',
      'İL', 'IL', 'VERGİ', 'VERGI', 'DAİRE', 'DAIRE', 'KAT', 'NO', 'DAİRE NO', 'DAİRE NO'
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        // Use the first capture group if available, otherwise use the full match
        const name = (match[1] || match[0]).trim();

        // Validate name format and filter out unwanted patterns
        if (name && 
            name.length > 4 && // Minimum reasonable name length
            name.split(' ').length >= 2 && // At least first and last name
            !excludePatterns.some(term => name.includes(term)) &&
            !/\d/.test(name) && // No numbers in names
            /^[A-ZÇĞIİÖŞÜ\s]+$/.test(name)) { // Only Turkish uppercase letters and spaces

          // Additional validation: Check if the name contains at least one Turkish character
          // to avoid matching section headers or other text
          if (/[ÇĞIİÖŞÜ]/.test(name)) {
            return name;
          }
        }
      }
    }

    return null;
  }

  function extractPolicyHolderName(text: string): string | null {
    const patterns = [
      // Pattern 1: "Adı Soyadı/Unvanı" in SIGORTA ETTIREN section - name on next line
      /S[IİĪ]GORTA\s+ETT[IİĪ]REN\s+B[IİĪ]LG[IİĪ]LER[IİĪ][\s\S]{0,100}?Ad[ıi]\s+Soyad[ıi]\s*\/\s*Unvan[ıi]?\s*\n\s*([A-ZÇĞIİÖŞÜ]+\s+[A-ZÇĞIİÖŞÜ]+)\s*\n\s*TCKN/im
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

  function extractTCNumber(text: string): string | null {
    const patterns = [
      // Pattern 1: "TCKN/VKN/YKN" followed by newline and ":34*******22"
      /TCKN\/[VK]KN\/YKN\s*\n\s*:([0-9\*]{11})/i,
      // Pattern 2: "TCKN/VKN/YKN:" followed by "34*******22" on same line
      /TCKN\/[VK]KN\/YKN\s*:([0-9\*]{11})/i,
      // Pattern 3: Just look for any 11-digit number with stars
      /[^0-9]([0-9*]{11})(?![0-9*])/,
    ];
  
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const tcNo = match[1].trim();
        if (tcNo.length === 11) {
          return tcNo;
        }
      }
    }
    
    return null;
  }

  function extractStartDate(text: string): string | null {
    const patterns = [
      // Pattern 1: "Başlangıç Tarihi" followed by "Yenileme No" then ":20/08/2025"
      /Ba[şs]lang[ıi\u0131][\u00e7c]\s*Tarihi[\s\S]{0,50}?Yenileme\s+No[:\s]*\d+\s*\n\s*:([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})/i,
      // Pattern 2: Direct match after label
      /Ba[şs]lang[ıi\u0131][\u00e7c]\s*Tarihi\s*\n\s*:([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})/i,
      // Pattern 3: Simple match
      /Ba[şs]lang[ıi\u0131][\u00e7c]\s*Tarihi\s*:?\s*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        let dateStr = match[1].trim();
        // Normalize date format to DD/MM/YYYY
        dateStr = dateStr.replace(/\./g, '/');
        // Handle 2-digit year
        if (dateStr.match(/\d{1,2}\/\d{1,2}\/\d{2}$/)) {
          dateStr = dateStr.replace(/(\d{1,2}\/\d{1,2}\/)(\d{2})$/, '$120$2');
        }
        return dateStr;
      }
    }

    return null;
  }

  function extractEndDate(text: string): string | null {
    const patterns = [
      // Pattern 1: "Bitg Tarihi" (OCR error) followed by "Yenileme No" then second date
      /Bit[gi\u011f]\s*Tarihi[\s\S]{0,50}?Yenileme\s+No[:\s]*\d+\s*\n\s*:[0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4}\s*\n\s*:([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})/i,
      // Pattern 2: Direct match after label
      /Bit[gi\u011f\u015fs]\s*Tarihi\s*\n\s*:([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})/i,
      // Pattern 3: Simple match
      /Biti[\u015fsg\u0163]\s*Tarihi\s*:?\s*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        let dateStr = match[1].trim();
        // Normalize date format to DD/MM/YYYY
        dateStr = dateStr.replace(/\./g, '/');
        // Handle 2-digit year
        if (dateStr.match(/\d{1,2}\/\d{1,2}\/\d{2}$/)) {
          dateStr = dateStr.replace(/(\d{1,2}\/\d{1,2}\/)(\d{2})$/, '$120$2');
        }
        return dateStr;
      }
    }

    return null;
  }

  function extractIssueDate(text: string): string | null {
    // In raw text, dates appear at top before labels due to OCR order
    // Look for pattern: "20/08/2025" then "20/08/2025 14:04" then ":0" then labels
    const patterns = [
      // Pattern 1: First date at document start (before "Başlangıç Tarihi")
      /^[\s\S]{0,200}?([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4})\s*\n[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4}\s+[0-9]{1,2}:[0-9]{2}\s*\n:0\s*\nBa[\u015fs]lang/im,
      // Pattern 2: After "Tanzim Tarihi" in standard position
      /Tanzim\s+Tarihi[\s\S]{0,100}?D[üu]zenleme\s+Tarihi[\s\S]{0,50}?:([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{4})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) return match[1].trim();
    }

    return null;
  }

  function extractPolicyPremium(text: string): string | null {
    const patterns = [
      // Pattern: "Poliçe Primi" followed by multiple lines then ":613,00"
      /Poli[çc]e\s+Primi\s*\n[\s\S]{0,100}?:([\d\.,]+)/i,
      // Pattern: Direct match
      /Poli[çc]e\s+Primi\s*:?\s*([\d\.,]+)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) return match[1].trim();
    }

    return null;
  }

  function extractInsuranceCompany(text: string): string | null {
    const patterns = [
      // Pattern 1: Look for "UNI°CO" or "UNICO" in text (from logo/header)
      /UNI[°o]?CO\s+S[IİĪ]GORTA/i,
      // Pattern 2: Look for company name in Acente Unvanı section (sometimes company name appears there)
      /Acente\s+Unvan[ıiı]?\s*\n\s*:([A-Z\u00c7\u011eI\u0130\u00d6\u015e\u00dc\s\.]+SIGORTA[A-Z\u00c7\u011eI\u0130\u00d6\u015e\u00dc\s\.]*(?:A\.[\u015eS]\.|A\.S\.)?)(?=\n|$)/i,
      // Pattern 3: Known insurance companies
      /(UNICO|ALLIANZ|AK|ANADOLU|HALK|AKTIF|ZURICH|HDI|MAPFRE|RAY|NEVA)\s+S[IİĪ]GORTA[A-Z\u00c7\u011eI\u0130\u00d6\u015e\u00dc\s\.]*(?:A\.[\u015eS]\.|A\.S\.)?/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const company = (match[1] || match[0]).trim();
        
        // Clean up and validate
        if (company.length > 3 && 
            !company.includes('BILGILERI') && 
            !company.includes('POLIÇE') &&
            /SIGORTA/i.test(company)) {
          
          // Normalize "UNI°CO" to "UNICO" and remove newlines
          const normalized = company
            .replace(/UNI[°o]?CO/i, 'UNICO')
            .replace(/\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          // Return normalized company name
          return normalized.toUpperCase();
        }
      }
    }

    return null;
  }

  function extractCompanyPhone(text: string): string | null {
    const patterns = [
      // Pattern 1: Phone at end of document (OCR reads it last) - format ":(312)428-28-24"
      /:\(([0-9]{3})\)([0-9]{3})-([0-9]{2})-([0-9]{2})/,
      // Pattern 2: Standard phone format
      /Telefon\s*:?\s*\(?([0-9\-\s\(\)]+)\)?/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        // If it's the phone number pattern with groups, reconstruct it
        if (match.length === 5) {
          return `(${match[1]})${match[2]}-${match[3]}-${match[4]}`;
        }
        if (match[1]) return match[1].trim();
      }
    }

    return null;
  }

  function extractAgencyNumber(text: string): string | null {
    const patterns = [
      // Pattern: "Acente No" with colon on next line
      /Acente\s+No\s*\n\s*:([0-9]+)/i,
      // Pattern: "Acente No" with colon
      /Acente\s+No\s*:?\s*([0-9]+)/i,
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
      // Pattern: "Bina Kodu" followed by multiple lines then ":5818083"
      /Bina\s+Kodu\s*\n[\s\S]{0,50}?:([0-9]+)/i,
      // Pattern: Direct match
      /Bina\s+Kodu\s*:?\s*([0-9]+)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) return match[1].trim();
    }

    return null;
  }

  function extractBuildingCode(text: string): string | null {
    const patterns = [
      // Pattern: "Bina Kodu" followed by multiple lines then ":5818083"
      /Bina\s+Kodu\s*\n[\s\S]{0,50}?:([0-9]+)/i,
      // Pattern: Direct match
      /Bina\s+Kodu\s*:?\s*([0-9]+)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) return match[1].trim();
    }

    return null;
  }

  function extractBuildingTypeAdvanced(text: string): string | null {
    const patterns = [
      // Pattern: "Bina Yapı Tarzı" with OCR errors
      /Bina\s+Yap[ıi]\s+Tarz[ıi]\s*:?\s*([A-ZÇĞIİÖŞÜ\s]+?)(?=\s*(?:\n|Bina|Daire|$))/i,
      /Building\s+(?:Construction\s+)?Type\s*:?\s*([A-ZÇĞIİÖŞÜ\s]+)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const type = match[1].trim();
        if (type.length > 2 && !type.includes('BILGI')) {
          return type;
        }
      }
    }

    return null;
  }

  function extractBuildingYear(text: string): string | null {
    const patterns = [
      // Pattern: "Bina İnşa Yıll" followed by multiple lines then ":1976 - 1999"
      /Bina\s+[IİĪ]n[şs]a\s+Y[ıi]ll?\s*\n[\s\S]{0,100}?:([0-9]{4}\s*[-–]\s*[0-9]{4})/i,
      // Pattern: Direct match
      /Bina\s+[IİĪ]n[şs]a\s+Y[ıi]l[ıi]?\s*:?\s*([0-9]{4}\s*[-–]\s*[0-9]{4})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) return match[1].trim();
    }

    return null;
  }

  function extractApartmentArea(text: string): string | null {
    const patterns = [
      // Pattern: "Daire Brüt Yazölçümü" followed by multiple lines then ":70"
      /Daire\s+Br[üu]t\s+Y[aü]z[öo]l[çc][üuö]m[üuö]?\s*\n[\s\S]{0,100}?:([0-9]+)/i,
      // Pattern: Direct match
      /Daire\s+Br[üu]t\s+Y[aü]z[öo]l[çc][üuö]m[üuö]?\s*:?\s*([0-9]+)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) return match[1].trim();
    }

    return null;
  }

  function extractFloorLocation(text: string): string | null {
    const patterns = [
      // Pattern: "Bulunduğu Kat" followed by multiple lines then ":ZEMIN"
      /Bulundu[ğg]u\s+Kat\s*\n[\s\S]{0,100}?:([A-ZÇĞIİÖŞÜ0-9\s\-]+?)(?=\s*\n)/i,
      // Pattern: Direct match
      /Bulundu[ğg]u\s+Kat\s*:?\s*([A-ZÇĞIİÖŞÜ0-9\s\-]+?)(?=\s*\n)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const floor = match[1].trim();
        if (floor.length > 0 && !floor.includes('BILGI')) {
          return floor;
        }
      }
    }

    return null;
  }

  function extractDamageStatus(text: string): string | null {
    const patterns = [
      // Pattern: "Hasar Durumu" followed by multiple lines then ":HASARSIZ"
      /Hasar\s+Durumu\s*\n[\s\S]{0,100}?:([A-ZÇĞIİÖŞÜ\s]+?)(?=\s*\n)/i,
      // Pattern: Direct match
      /Hasar\s+Durumu\s*:?\s*([A-ZÇĞIİÖŞÜ\s]+?)(?=\s*\n)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const status = match[1].trim();
        if (status.length > 2 && !status.includes('BILGI')) {
          return status;
        }
      }
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
      // Pattern: "Bina Teminat Bedeli" in TEMİNAT BEDELİ/LİMİTİ section
      /TEM[İI\u012a]NAT\s+BEDEL[İI\u012a]\/L[İI\u012a]M[İI\u012a]T[İI\u012a][\s\S]{0,100}?Bina\s+Teminat\s+Bedeli\s*:?\s*([\d\.,]+)/i,
      // Pattern: Direct "Bina Teminat Bedeli" match
      /Bina\s+Teminat\s+Bedeli\s*:?\s*([\d\.,]+)/i,
      /Building\s+Coverage\s+Amount\s*:?\s*([\d\.,]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) return match[1].trim();
    }
    
    return null;
  }

  function extractDiscountInfo(text: string): string | null {
    const patterns = [
      // Pattern: Full discount section in DASK documents
      /[İI\u012a]ND[İI\u012a]R[İI\u012a]M\/S[ÜU]RPR[İI\u012a]M\s+B[İI\u012a]LG[İI\u012a]LER[İI\u012a][\s\S]{0,200}?Poli[\çc]e\s+primine[^\n]+%[^\n]+/i,
      // Pattern: Discount/surcharge information
      /(?:[İI\u012a]ndirim|Indirim|Discount|S[üu]rprim)[^%]*%[^%]*/i,
      // Pattern: Multiple discount lines
      /Poli[\çc]e\s+primine\s+Deprem\s+B[ıi]na\s+teminat[ıi][^%]+%[0-9]+/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const discount = match[0].trim();
        if (discount.length > 10) {
          return discount;
        }
      }
    }
    
    return null;
  }

  function extractProvince(text: string): string | null {
    const patterns = [
      // Pattern: "MERSİN/TARSUS/MERKEZ-MERKEZ" format - capture first part
      /\n\s*([A-ZÇĞIİÖŞÜ]+)\/[A-ZÇĞIİÖŞÜ]+\/[A-ZÇĞIİÖŞÜ\-]+\s*\n/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const province = match[1].trim();
        if (province.length > 2 && province !== 'TCKN' && !province.includes('BILGI')) {
          return province;
        }
      }
    }
    
    return null;
  }

  function extractInsuredAddress(text: string): string | null {
    const patterns = [
      // Pattern: "Adres" followed by newline and address in SIGORTALI YERE AIT BILGILER
      /S[IİĪ]GORTALI\s+YERE\s+A[IİĪ]T\s+B[IİĪ]LG[IİĪ]LER[\s\S]{0,150}?Adres\s*\n\s*([A-ZÇĞIİÖŞÜ0-9\s\.\,\-\/]+?)(?=\s*\n\s*Bina)/i,
      // Pattern: Generic "Adres" with newline
      /Adres\s*\n\s*([A-ZÇĞIİÖŞÜ0-9\s\.\,\-\/]+?)(?=\s*\n\s*Bina)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const address = match[1].trim();
        if (address.length > 10 && !address.includes('Kodu')) {
          return address;
        }
      }
    }
    
    return null;
  }

  function extractPolicyholderStatus(text: string): string | null {
    const patterns = [
      // Pattern: "Sigorta Ettiren Sıfatı" in SIGORTA ETTIREN section
      /Sigorta\s+Ettiren\s+S[ıi]fat[ıi]?\s*\n\s*:([A-ZÇĞIİÖŞÜ\s]+?)(?=\n|$)/i,
      /Sigorta\s+Ettiren\s+S[ıi]fat[ıi]?\s*:?\s*([A-ZÇĞIİÖŞÜ\s]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const status = match[1].trim();
        if (status.length > 2 && !status.includes('BILGI')) {
          return status;
        }
      }
    }
    
    return null;
  }

  function extractPolicyholderPhone(text: string): string | null {
    const patterns = [
      // Pattern: "Cep Telefonu" in SIGORTA ETTIREN section
      /S[IİĪ]GORTA\s+ETT[IİĪ]REN[\s\S]{0,200}?Cep\s+Telefonu\s*\n\s*:\(?([0-9\-\s\*\(\)]+)\)?/i,
      // Pattern: "Sabit Telefonu" in SIGORTA ETTIREN section  
      /S[IİĪ]GORTA\s+ETT[IİĪ]REN[\s\S]{0,200}?Sabit\s+Telefonu\s*\n\s*:\(?([0-9\-\s\*\(\)]+)\)?/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const phone = match[1].trim();
        const digitCount = phone.replace(/[^0-9]/g, '').length;
        if (digitCount >= 7) {
          return phone;
        }
      }
    }
    
    return null;
  }

  function extractInsuredPhone(text: string): string | null {
    const patterns = [
      // Pattern: "Cep Telefonu" in SIGORTALI BILGILERI section
      /S[IİĪ]GORTALI\s+B[IİĪ]LG[IİĪ]LER[IİĪ][\s\S]{0,200}?Cep\s+Telefonu\s*[\n:]+\s*\(?([0-9\-\s\*\(\)]+)\)?/i,
      // Pattern: Direct "Cep Telefonu" match
      /Cep\s+Telefonu\s*[\n:]+\s*\(?([0-9\-\s\*\(\)]+)\)?/i,
      /(?:Mobile|Cep Tel)\s*:?\s*\(?([0-9\-\s\*\(\)]+)\)?/i,
      /(?:Telefon|Phone|Tel)\s*:?\s*\(?([0-9\-\s\*\(\)]+)\)?/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const phone = match[1].trim();
        // Validate phone has enough digits (at least 7)
        const digitCount = phone.replace(/[^0-9]/g, '').length;
        if (digitCount >= 7) {
          return phone;
        }
      }
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
    // For DASK documents, company address is not typically shown
    // Return null to avoid extracting incorrect data
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