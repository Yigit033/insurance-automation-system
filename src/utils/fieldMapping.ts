// Universal field mapping system for all document types
// This ensures consistent UI display across all document types

import { normalizeCurrency, normalizeDate, normalizePlateNumber, normalizeTCNumber, normalizePolicyNumber, normalizePhoneNumber, normalizeName, normalizeAddress, normalizeCompanyName } from './dataNormalization';

export interface FieldMapping {
  [key: string]: string[];
}

// Universal field mappings for all document types
export const UNIVERSAL_FIELD_MAPPINGS: FieldMapping = {
  // Customer Information
  customerName: [
    'insured_name', 'customer_name', 'policyholderName', 'insuredName',
    'sigorta_ettiren', 'musteri_adi', 'ad_soyad', 'name', 'insuredName',
    'Sigortak Adi/Lavans', 'Adi Soyadt/Unvani', 'Adi Soyadi/Unvani'
  ],
  
  // Policy Information
  policyNumber: [
    'policy_number', 'policyNumber', 'poliçe_no', 'poliçe_numarası',
    'daskPolicyNumber', 'reportNumber', 'dosya_no', 'Sigorta Sirketi Poliçe No',
    'DASK Pollçe No', 'DASK Policy Number'
  ],
  daskPolicyNumber: [
    'daskPolicyNumber', 'dask_policy_number', 'DASK Pollçe No', 'DASK Policy Number',
    'dask_poliçe_no', 'deprem_poliçe_no'
  ],
  
  // Dates
  startDate: [
    'start_date', 'startDate', 'policy_start_date', 'başlangıç_tarihi',
    'başlangıç', 'geçerlilik_başlangıç', 'validity_start', 'Baslangic Tarihi',
    'Baslangic-Bitis Tarihi', 'Geperlilik'
  ],
  endDate: [
    'end_date', 'endDate', 'policy_end_date', 'bitiş_tarihi',
    'bitiş', 'geçerlilik_bitiş', 'validity_end', 'vade_tarihi',
    'Bitig Tarihi', 'Bitis Tarihi'
  ],
  issueDate: [
    'issue_date', 'issueDate', 'policy_issue_date', 'tanzim_tarihi',
    'düzenleme_tarihi', 'rapor_tarihi', 'reportDate', 'Tanzim Tarihi',
    'Teklif Tarihi', 'Düzenleme Tarihi'
  ],
  
  // Company Information
  insuranceCompany: [
    'insurance_company', 'company', 'sigorta_şirketi', 'şirket_unvanı',
    'insuranceCompany', 'company_name', 'sigorta_şirketi_unvanı',
    'Sigorta Sirketi Unvani', 'Sigorta Sirketi Unvant'
  ],
  companyPhone: [
    'company_phone', 'phone', 'telefon', 'iletişim_telefonu',
    'companyPhone', 'contact_phone'
  ],
  companyAddress: [
    'company_address', 'address', 'adres', 'şirket_adresi',
    'companyAddress', 'company_address'
  ],
  
  // Coverage Information
  coverageType: [
    'buildingCoverage', 'kasko_premium', 'trafik_premium', 'coverage_type',
    'teminat_türü', 'sigorta_türü', 'coverageTypes', 'teminat_bilgileri',
    'Bina Teminati', 'DEPREM BINA', 'KASKO', 'TRAFIK'
  ],
  coverageAmount: [
    'buildingCoverageAmount', 'kasko_amount', 'trafik_amount', 'coverage_amount',
    'teminat_bedeli', 'sigorta_bedeli', 'coverageAmount', 'teminat_tutarı',
    'Bina Teminat Bedeli', 'Odenecek Tutar', 'total_amount'
  ],
  
  // Vehicle Information (for vehicle-related documents)
  vehiclePlate: [
    'vehicle_plate', 'plateNumber', 'plate_number', 'araç_plakası',
    'plaka', 'vehiclePlate', 'plate', 'Plaka', 'Levha No'
  ],
  vehicleBrand: [
    'vehicle_brand', 'brand', 'marka', 'araç_markası',
    'vehicleBrand', 'car_brand', 'Marka', 'CITROEN'
  ],
  vehicleModel: [
    'vehicle_model', 'model', 'model', 'araç_modeli',
    'vehicleModel', 'car_model', 'Model', 'C4 CACTUS'
  ],
  vehicleYear: [
    'vehicle_year', 'year', 'yıl', 'araç_yılı',
    'vehicleYear', 'car_year', 'model_yılı', 'Model Yi', '2018'
  ],
  vehicleChassis: [
    'vehicle_chassis', 'chassis', 'şasi', 'araç_şasisi',
    'vehicleChassis', 'chassis_number', 'Sasi No', 'VF7OBBHYHJE513871'
  ],
  vehicleMotor: [
    'vehicle_motor', 'motor', 'motor', 'araç_motoru',
    'vehicleMotor', 'motor_number', 'motor_no', 'Notor No', 'lUJtht surscel'
  ],
  
  // Building Information (for property-related documents)
  buildingCode: [
    'buildingCode', 'bina_kodu', 'building_code', 'bina_kod',
    'building_code', 'bina_kod_numarası'
  ],
  addressCode: [
    'addressCode', 'adres_kodu', 'address_code', 'adres_kod',
    'address_code', 'adres_kod_numarası'
  ],
  buildingType: [
    'buildingType', 'bina_türü', 'building_type', 'yapı_türü',
    'building_type', 'yapı_tipi'
  ],
  buildingYear: [
    'buildingYear', 'bina_yılı', 'building_year', 'yapım_yılı',
    'building_year', 'inşaat_yılı'
  ],
  apartmentArea: [
    'apartmentArea', 'daire_alanı', 'apartment_area', 'alan',
    'apartment_area', 'metrekare'
  ],
  floorLocated: [
    'floorLocated', 'floor_located', 'bulunduğu_kat', 'kat',
    'floor_location', 'daire_katı'
  ],
  damageStatus: [
    'damageStatus', 'damage_status', 'hasar_durumu', 'hasar_durum',
    'damage_condition', 'hasar_bilgisi'
  ],
  province: [
    'province', 'şehir', 'il', 'city', 'location', 'konum'
  ],
  insuredAddress: [
    'insured_address', 'insuredAddress', 'sigortalı_adres', 'müşteri_adres',
    'customer_address', 'adres_bilgisi'
  ],
  insuredPhone: [
    'insured_phone', 'insuredPhone', 'sigortalı_telefon', 'müşteri_telefon',
    'customer_phone', 'telefon_bilgisi'
  ],
  
  // Financial Information
  policyPremium: [
    'policyPremium', 'poliçe_primi', 'policy_premium', 'prim',
    'policy_premium', 'toplam_prim', 'net_prim', 'Poliçe Priml',
    'Vergi Öncesi Prim', 'premium_before_tax'
  ],
  grossPremium: [
    'gross_premium', 'brüt_prim', 'grossPremium', 'brüt_tutar',
    'gross_premium', 'toplam_tutar'
  ],
  netPremium: [
    'net_premium', 'net_prim', 'netPremium', 'net_tutar',
    'net_premium', 'temiz_tutar'
  ],
  taxAmount: [
    'tax_amount', 'vergi_tutarı', 'taxAmount', 'kdv_tutarı',
    'tax_amount', 'vergi_miktarı'
  ],
  
  // Discount Information
  discountInfo: [
    'discountSurchargeInfo', 'baglanti_indirimi', 'hasarsizlik_orani',
    'ozel_musteri_indirimi', 'indirim_bilgileri', 'discount_info',
    'hasarsizlik_kademesi', 'indirim_oranı'
  ],
  
  // Agency Information
  agencyNumber: [
    'agencyNumber', 'agency_number', 'acente_no', 'acente_numarası',
    'agent_number', 'aracı_numarası'
  ],
  renewalNumber: [
    'renewalNumber', 'renewal_number', 'yenileme_no', 'yenileme_numarası',
    'renewal_count', 'yenileme_sayısı'
  ],
  
  // Expert Information (for damage/expertise reports)
  expertName: [
    'expertName', 'expert_name', 'eksper_adi', 'eksper_adı',
    'expert_name', 'eksper_adı_soyadı'
  ],
  expertRegistry: [
    'expertRegistry', 'expert_registry', 'sicil_no', 'eksper_sicil',
    'expert_registry', 'sicil_numarası'
  ],
  
  // Damage Information (for damage reports)
  damageDate: [
    'damageDate', 'damage_date', 'hasar_tarihi', 'kaza_tarihi',
    'damage_date', 'hasar_tarihi_saati'
  ],
  damageLocation: [
    'damageLocation', 'damage_location', 'hasar_yeri', 'kaza_yeri',
    'damage_location', 'hasar_meydana_geldiği_yer'
  ],
  damageDescription: [
    'damageDescription', 'damage_description', 'hasar_tanımı', 'kaza_tanımı',
    'damage_description', 'hasar_detayları'
  ]
};

// Document type specific field priorities
export const DOCUMENT_TYPE_PRIORITIES: { [key: string]: string[] } = {
  trafik: [
    'vehiclePlate', 'vehicleBrand', 'vehicleModel', 'vehicleYear',
    'coverageType', 'coverageAmount', 'policyPremium'
  ],
  kasko: [
    'vehiclePlate', 'vehicleBrand', 'vehicleModel', 'vehicleYear',
    'vehicleChassis', 'vehicleMotor', 'coverageType', 'coverageAmount'
  ],
  deprem: [
    'daskPolicyNumber', 'buildingCode', 'addressCode', 'buildingType', 
    'buildingYear', 'apartmentArea', 'floorLocated', 'damageStatus',
    'province', 'coverageType', 'coverageAmount', 'agencyNumber', 
    'renewalNumber'
  ],
  hasar: [
    'expertName', 'expertRegistry', 'damageDate', 'damageLocation',
    'damageDescription', 'coverageAmount'
  ],
  ekspertiz: [
    'expertName', 'expertRegistry', 'damageDate', 'damageLocation',
    'damageDescription', 'coverageAmount'
  ]
};

// Get field value with fallback support and normalization
export function getFieldValue(fieldName: string, extractedFields: any): string | null {
  const fieldMappings = UNIVERSAL_FIELD_MAPPINGS[fieldName];
  if (!fieldMappings) return null;
  
  // Try each field mapping in order
  for (const field of fieldMappings) {
    if (extractedFields[field] && extractedFields[field] !== null && extractedFields[field] !== '') {
      const value = String(extractedFields[field]);
      
      // Apply normalization based on field type
      if (fieldName.includes('Date') || fieldName.includes('date')) {
        return normalizeDate(value);
      } else if (fieldName.includes('Plate') || fieldName.includes('plate')) {
        return normalizePlateNumber(value);
      } else if (fieldName.includes('TC') || fieldName.includes('tc')) {
        return normalizeTCNumber(value);
      } else if (fieldName.includes('Policy') || fieldName.includes('policy')) {
        return normalizePolicyNumber(value);
      } else if (fieldName.includes('Phone') || fieldName.includes('phone')) {
        return normalizePhoneNumber(value);
      } else if (fieldName.includes('Name') || fieldName.includes('name')) {
        return normalizeName(value);
      } else if (fieldName.includes('Address') || fieldName.includes('address')) {
        return normalizeAddress(value);
      } else if (fieldName.includes('Company') || fieldName.includes('company')) {
        return normalizeCompanyName(value);
      } else if (fieldName.includes('Amount') || fieldName.includes('Premium') || fieldName.includes('amount') || fieldName.includes('premium')) {
        const normalized = normalizeCurrency(value);
        return normalized !== null ? normalized.toFixed(2) : value;
      }
      
      return value;
    }
  }
  
  return null;
}

// Get all available fields for a document type
export function getAvailableFields(extractedFields: any, documentType?: string): { [key: string]: string } {
  const availableFields: { [key: string]: string } = {};
  
  // Get all universal field mappings
  for (const [fieldName, fieldMappings] of Object.entries(UNIVERSAL_FIELD_MAPPINGS)) {
    const value = getFieldValue(fieldName, extractedFields);
    if (value) {
      availableFields[fieldName] = value;
    }
  }
  
  return availableFields;
}

// Check if a field has any value
export function hasFieldValue(fieldName: string, extractedFields: any): boolean {
  return getFieldValue(fieldName, extractedFields) !== null;
}

// Get document type specific field labels
export function getFieldLabel(fieldName: string, documentType?: string): string {
  const labels: { [key: string]: string } = {
    customerName: 'Müşteri Adı',
    policyNumber: 'Poliçe Numarası',
    startDate: 'Başlangıç Tarihi',
    endDate: 'Bitiş Tarihi',
    issueDate: 'Tanzim Tarihi',
    insuranceCompany: 'Sigorta Şirketi',
    companyPhone: 'Telefon',
    companyAddress: 'Adres',
    coverageType: documentType === 'deprem' ? 'Teminat Türü' : 
                  documentType === 'trafik' ? 'Trafik Teminatı' :
                  documentType === 'kasko' ? 'Kasko Teminatı' : 'Teminat Türü',
    coverageAmount: documentType === 'deprem' ? 'Teminat Bedeli' : 
                   documentType === 'trafik' ? 'Trafik Bedeli' :
                   documentType === 'kasko' ? 'Kasko Bedeli' : 'Teminat Bedeli',
    vehiclePlate: 'Araç Plakası',
    vehicleBrand: 'Araç Markası',
    vehicleModel: 'Araç Modeli',
    vehicleYear: 'Araç Yılı',
    vehicleChassis: 'Şasi Numarası',
    vehicleMotor: 'Motor Numarası',
    buildingCode: 'Bina Kodu',
    addressCode: 'Adres Kodu',
    buildingType: 'Bina Türü',
    buildingYear: 'Bina Yılı',
    floorLocated: 'Bulunduğu Kat',
    damageStatus: 'Hasar Durumu',
    province: 'İl/Şehir',
    insuredAddress: 'Sigortalı Adresi',
    insuredPhone: 'Sigortalı Telefonu',
    apartmentArea: 'Daire Alanı',
    daskPolicyNumber: 'DASK Poliçe No',
    agencyNumber: 'Acente Numarası',
    renewalNumber: 'Yenileme Numarası',
    policyPremium: 'Poliçe Primi',
    grossPremium: 'Brüt Prim',
    netPremium: 'Net Prim',
    taxAmount: 'Vergi Tutarı',
    discountInfo: 'İndirim Bilgileri',
    expertName: 'Eksper Adı',
    expertRegistry: 'Sicil Numarası',
    damageDate: 'Hasar Tarihi',
    damageLocation: 'Hasar Yeri',
    damageDescription: 'Hasar Tanımı'
  };
  
  return labels[fieldName] || fieldName;
}
