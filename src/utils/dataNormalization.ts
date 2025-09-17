// Professional data normalization and cleaning utilities
// Ensures consistent data format across all document types

export interface NormalizedData {
  [key: string]: any;
}

// Currency and number normalization
export function normalizeCurrency(value: string | number | null | undefined): number | null {
  if (!value) return null;
  
  let str = String(value).trim();
  if (!str || str === 'null' || str === 'undefined') return null;
  
  // Remove currency symbols and extra text
  str = str.replace(/[₺$€£¥]/g, '').trim();
  
  // Handle different decimal separators
  // Turkish format: 1.234.567,89 -> 1234567.89
  // US format: 1,234,567.89 -> 1234567.89
  // European format: 1 234 567,89 -> 1234567.89
  
  // First, normalize spaces and remove extra characters
  str = str.replace(/\s+/g, '').replace(/[^\d.,-]/g, '');
  
  // Handle negative numbers
  const isNegative = str.startsWith('-');
  if (isNegative) str = str.substring(1);
  
  // Detect format and normalize
  if (str.includes(',') && str.includes('.')) {
    // Mixed format: determine which is decimal separator
    const lastComma = str.lastIndexOf(',');
    const lastDot = str.lastIndexOf('.');
    
    if (lastComma > lastDot) {
      // Comma is decimal separator: 1.234.567,89
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // Dot is decimal separator: 1,234,567.89
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    // Only comma: could be decimal or thousands separator
    const parts = str.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      // Decimal separator: 1234,56
      str = str.replace(',', '.');
    } else {
      // Thousands separator: 1,234,567
      str = str.replace(/,/g, '');
    }
  }
  
  const num = parseFloat(str);
  if (isNaN(num)) return null;
  
  return isNegative ? -num : num;
}

// Date normalization
export function normalizeDate(value: string | null | undefined): string | null {
  if (!value) return null;
  
  let str = String(value).trim();
  if (!str || str === 'null' || str === 'undefined') return null;
  
  // Remove extra whitespace and normalize
  str = str.replace(/\s+/g, ' ').trim();
  
  // Common Turkish date patterns
  const patterns = [
    // DD/MM/YYYY or DD.MM.YYYY
    /^(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{4})$/,
    // DD/MM/YY or DD.MM.YY
    /^(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{2})$/,
    // YYYY-MM-DD (already normalized)
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    // DD-MM-YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
  ];
  
  for (const pattern of patterns) {
    const match = str.match(pattern);
    if (match) {
      let day = parseInt(match[1], 10);
      let month = parseInt(match[2], 10);
      let year = parseInt(match[3], 10);
      
      // Handle 2-digit years
      if (year < 100) {
        year += year < 50 ? 2000 : 1900;
      }
      
      // Validate date
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      }
    }
  }
  
  return null;
}

// Turkish plate number normalization
export function normalizePlateNumber(value: string | null | undefined): string | null {
  if (!value) return null;
  
  let str = String(value).trim().toUpperCase();
  if (!str || str === 'NULL' || str === 'UNDEFINED') return null;
  
  // Remove extra spaces and special characters
  str = str.replace(/\s+/g, '').replace(/[^\dA-Z]/g, '');
  
  // Turkish plate format: 2-3 digits + 1-2 letters + 2-4 digits
  // Examples: 34ABC123, 06A1234, 35AB1234
  const platePattern = /^(\d{2,3})([A-Z]{1,2})(\d{2,4})$/;
  const match = str.match(platePattern);
  
  if (match) {
    const [, digits, letters, numbers] = match;
    return `${digits} ${letters} ${numbers}`;
  }
  
  return str; // Return as-is if doesn't match pattern
}

// TC number normalization
export function normalizeTCNumber(value: string | null | undefined): string | null {
  if (!value) return null;
  
  let str = String(value).trim();
  if (!str || str === 'null' || str === 'undefined') return null;
  
  // Remove all non-digit characters
  str = str.replace(/\D/g, '');
  
  // TC number must be exactly 11 digits
  if (str.length === 11) {
    return str;
  }
  
  return null;
}

// Policy number normalization
export function normalizePolicyNumber(value: string | null | undefined): string | null {
  if (!value) return null;
  
  let str = String(value).trim().toUpperCase();
  if (!str || str === 'NULL' || str === 'UNDEFINED') return null;
  
  // Remove extra spaces but keep hyphens and alphanumeric characters
  str = str.replace(/\s+/g, ' ').trim();
  
  // Common policy number patterns
  const patterns = [
    // Pure numbers: 123456789
    /^\d+$/,
    // Alphanumeric: ABC123456
    /^[A-Z0-9]+$/,
    // With hyphens: ABC-123-456
    /^[A-Z0-9-]+$/,
    // Mixed: 123-ABC-456
    /^[A-Z0-9-]+$/,
  ];
  
  for (const pattern of patterns) {
    if (pattern.test(str)) {
      return str;
    }
  }
  
  return str; // Return as-is if doesn't match any pattern
}

// Phone number normalization
export function normalizePhoneNumber(value: string | null | undefined): string | null {
  if (!value) return null;
  
  let str = String(value).trim();
  if (!str || str === 'null' || str === 'undefined') return null;
  
  // Remove all non-digit characters except +
  str = str.replace(/[^\d+]/g, '');
  
  // Turkish phone number patterns
  if (str.startsWith('+90')) {
    return str;
  } else if (str.startsWith('90') && str.length === 12) {
    return '+' + str;
  } else if (str.startsWith('0') && str.length === 11) {
    return '+90' + str.substring(1);
  } else if (str.length === 10) {
    return '+90' + str;
  }
  
  return str; // Return as-is if doesn't match patterns
}

// Name normalization
export function normalizeName(value: string | null | undefined): string | null {
  if (!value) return null;
  
  let str = String(value).trim();
  if (!str || str === 'null' || str === 'undefined') return null;
  
  // Convert to proper case (first letter of each word uppercase)
  str = str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  
  // Remove extra spaces
  str = str.replace(/\s+/g, ' ').trim();
  
  // Remove special characters except Turkish characters
  str = str.replace(/[^\w\sçğıöşüÇĞIİÖŞÜ]/g, '');
  
  return str;
}

// Address normalization
export function normalizeAddress(value: string | null | undefined): string | null {
  if (!value) return null;
  
  let str = String(value).trim();
  if (!str || str === 'null' || str === 'undefined') return null;
  
  // Normalize spaces and remove extra characters
  str = str.replace(/\s+/g, ' ').trim();
  
  // Remove special characters except Turkish characters and common address symbols
  str = str.replace(/[^\w\sçğıöşüÇĞIİÖŞÜ.,/-]/g, '');
  
  return str;
}

// Company name normalization
export function normalizeCompanyName(value: string | null | undefined): string | null {
  if (!value) return null;
  
  let str = String(value).trim().toUpperCase();
  if (!str || str === 'NULL' || str === 'UNDEFINED') return null;
  
  // Remove extra spaces
  str = str.replace(/\s+/g, ' ').trim();
  
  // Remove special characters except Turkish characters and common company symbols
  str = str.replace(/[^\w\sçğıöşüÇĞIİÖŞÜ.,-]/g, '');
  
  return str;
}

// Main normalization function
export function normalizeExtractedData(data: any): NormalizedData {
  const normalized: NormalizedData = {};
  
  // Field mappings for normalization
  const fieldMappings = {
    // Currency fields
    currency: [
      'policyPremium', 'gross_premium', 'net_premium', 'tax_amount',
      'buildingCoverageAmount', 'kasko_amount', 'trafik_amount',
      'total_amount', 'premium_before_tax', 'coverageAmount',
      'policy_premium', 'prim', 'tutar', 'bedel'
    ],
    
    // Date fields
    date: [
      'startDate', 'endDate', 'issueDate', 'start_date', 'end_date',
      'issue_date', 'policy_start_date', 'policy_end_date', 'policy_issue_date',
      'tanzim_tarihi', 'başlangıç_tarihi', 'bitiş_tarihi', 'reportDate',
      'damageDate', 'preparationDate', 'düzenleme_tarihi'
    ],
    
    // Plate number fields
    plate: [
      'vehicle_plate', 'plateNumber', 'plate_number', 'araç_plakası',
      'plaka', 'vehiclePlate', 'plate', 'Plaka', 'Levha No'
    ],
    
    // TC number fields
    tc: [
      'tc_number', 'insured_tc_number', 'customer_tc', 'tc_no',
      'TCKN', 'VKN', 'YKN', 'kimlik_no'
    ],
    
    // Policy number fields
    policy: [
      'policy_number', 'policyNumber', 'poliçe_no', 'poliçe_numarası',
      'daskPolicyNumber', 'reportNumber', 'dosya_no', 'Sigorta Sirketi Poliçe No',
      'DASK Pollçe No', 'DASK Policy Number'
    ],
    
    // Phone number fields
    phone: [
      'company_phone', 'phone', 'telefon', 'iletişim_telefonu',
      'companyPhone', 'contact_phone', 'insured_phone', 'customer_phone',
      'sabit_telefon', 'cep_telefonu'
    ],
    
    // Name fields
    name: [
      'insured_name', 'customer_name', 'policyholderName', 'insuredName',
      'sigorta_ettiren', 'musteri_adi', 'ad_soyad', 'name', 'expertName',
      'Sigortak Adi/Lavans', 'Adi Soyadt/Unvani', 'Adi Soyadi/Unvani'
    ],
    
    // Address fields
    address: [
      'company_address', 'address', 'adres', 'şirket_adresi',
      'insured_address', 'customer_address', 'iletişim_adresi',
      'damageLocation', 'hasar_yeri', 'kaza_yeri'
    ],
    
    // Company name fields
    company: [
      'insurance_company', 'company', 'sigorta_şirketi', 'şirket_unvanı',
      'insuranceCompany', 'company_name', 'sigorta_şirketi_unvanı',
      'Sigorta Sirketi Unvani', 'Sigorta Sirketi Unvant'
    ]
  };
  
  // Normalize each field based on its type
  for (const [fieldType, fields] of Object.entries(fieldMappings)) {
    for (const field of fields) {
      if (data[field] !== undefined && data[field] !== null) {
        switch (fieldType) {
          case 'currency':
            normalized[field] = normalizeCurrency(data[field]);
            break;
          case 'date':
            normalized[field] = normalizeDate(data[field]);
            break;
          case 'plate':
            normalized[field] = normalizePlateNumber(data[field]);
            break;
          case 'tc':
            normalized[field] = normalizeTCNumber(data[field]);
            break;
          case 'policy':
            normalized[field] = normalizePolicyNumber(data[field]);
            break;
          case 'phone':
            normalized[field] = normalizePhoneNumber(data[field]);
            break;
          case 'name':
            normalized[field] = normalizeName(data[field]);
            break;
          case 'address':
            normalized[field] = normalizeAddress(data[field]);
            break;
          case 'company':
            normalized[field] = normalizeCompanyName(data[field]);
            break;
          default:
            normalized[field] = data[field];
        }
      }
    }
  }
  
  // Copy other fields as-is
  for (const [key, value] of Object.entries(data)) {
    if (!normalized.hasOwnProperty(key)) {
      normalized[key] = value;
    }
  }
  
  return normalized;
}

// Validation helpers
export function isValidCurrency(value: any): boolean {
  const normalized = normalizeCurrency(value);
  return normalized !== null && normalized > 0;
}

export function isValidDate(value: any): boolean {
  const normalized = normalizeDate(value);
  return normalized !== null;
}

export function isValidPlateNumber(value: any): boolean {
  const normalized = normalizePlateNumber(value);
  return normalized !== null && normalized.length > 0;
}

export function isValidTCNumber(value: any): boolean {
  const normalized = normalizeTCNumber(value);
  return normalized !== null && normalized.length === 11;
}

export function isValidPolicyNumber(value: any): boolean {
  const normalized = normalizePolicyNumber(value);
  return normalized !== null && normalized.length > 0;
}

export function isValidPhoneNumber(value: any): boolean {
  const normalized = normalizePhoneNumber(value);
  return normalized !== null && normalized.length >= 10;
}
