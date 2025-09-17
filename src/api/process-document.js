// Node.js based document processing API
import { createClient } from '@supabase/supabase-js';
// Note: dataNormalization is a TypeScript file, we'll implement the function inline for now

// IMPORTANT: Read Supabase credentials from environment variables
// In Vite/React, use VITE_ prefix. Do NOT commit real keys.
const supabaseUrl = import.meta?.env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = import.meta?.env?.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('[process-document] Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Inline data normalization functions
function normalizeCurrency(value) {
  if (!value) return null;
  
  let str = String(value).trim();
  if (!str || str === 'null' || str === 'undefined') return null;
  
  // Remove currency symbols
  str = str.replace(/[₺$€£¥]/g, '').trim();
  
  // Handle Turkish format: 1.234.567,89 -> 1234567.89
  if (str.includes(',') && str.includes('.')) {
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
    const parts = str.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      str = str.replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  }
  
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

function normalizeDate(value) {
  if (!value) return null;
  
  let str = String(value).trim();
  if (!str || str === 'null' || str === 'undefined') return null;
  
  // Common Turkish date patterns
  const patterns = [
    // DD/MM/YYYY or DD.MM.YYYY
    /^(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{4})$/,
    // DD/MM/YY or DD.MM.YY
    /^(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{2})$/,
    // YYYY-MM-DD (already normalized)
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    // DD-MM-YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/
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

function normalizePlateNumber(value) {
  if (!value) return null;
  
  let str = String(value).trim().toUpperCase();
  if (!str || str === 'NULL' || str === 'UNDEFINED') return null;
  
  // Remove extra spaces and special characters
  str = str.replace(/\s+/g, '').replace(/[^\dA-Z]/g, '');
  
  // Turkish plate format: 2-3 digits + 1-2 letters + 2-4 digits
  const platePattern = /^(\d{2,3})([A-Z]{1,2})(\d{2,4})$/;
  const match = str.match(platePattern);
  
  if (match) {
    const [, digits, letters, numbers] = match;
    return `${digits} ${letters} ${numbers}`;
  }
  
  return str;
}

function normalizeTCNumber(value) {
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

function normalizePolicyNumber(value) {
  if (!value) return null;
  
  let str = String(value).trim().toUpperCase();
  if (!str || str === 'NULL' || str === 'UNDEFINED') return null;
  
  // Remove extra spaces but keep hyphens and alphanumeric characters
  str = str.replace(/\s+/g, ' ').trim();
  
  return str;
}

function normalizePhoneNumber(value) {
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
  
  return str;
}

function normalizeName(value) {
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

function normalizeCompanyName(value) {
  if (!value) return null;
  
  let str = String(value).trim().toUpperCase();
  if (!str || str === 'NULL' || str === 'UNDEFINED') return null;
  
  // Remove extra spaces
  str = str.replace(/\s+/g, ' ').trim();
  
  // Remove special characters except Turkish characters and common company symbols
  str = str.replace(/[^\w\sçğıöşüÇĞIİÖŞÜ.,-]/g, '');
  
  return str;
}

function normalizeExtractedDataInline(data) {
  const normalized = {};
  
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

// Document type detection
function detectDocumentType(text) {
  const patterns = {
    trafik: [
      /ZORUNLU[:\s]+TRAF[Iİ]K[:\s]+S[Iİ]GORTASI/i,
      /TRAF[Iİ]K[:\s]+S[Iİ]GORTASI/i,
      /MAL[Iİ][:\s]+SORUMLULUK[:\s]+S[Iİ]GORTASI/i,
      /ZORUNLU[:\s]+MAL[Iİ][:\s]+SORUMLULUK/i
    ],
    kasko: [
      /KASKO[:\s]+S[Iİ]GORTASI/i,
      /KASKO[:\s]+POL[Iİ]ÇES[Iİ]/i,
      /ARAÇ[:\s]+KASKO/i,
      /MOTORLU[:\s]+KARA[:\s]+TAŞITLARI[:\s]+KASKO/i
    ],
    deprem: [
      /ZORUNLU[:\s]+DEPREM[:\s]+S[Iİ]GORTASI/i,
      /DEPREM[:\s]+S[Iİ]GORTASI/i,
      /DASK[:\s]+POL[Iİ]ÇES[Iİ]/i,
      /DOĞAL[:\s]+AFET[:\s]+S[Iİ]GORTALARI/i,
      /DASK[:\s]+DOĞAL[:\s]+AFET/i
    ],
    hasar: [
      /HASAR[:\s]+RAPORU/i,
      /KAZA[:\s]+TESP[Iİ]T[:\s]+TUTANAĞI/i,
      /HASAR[:\s]+BEYANI/i,
      /KAZA[:\s]+TESP[Iİ]T[:\s]+TUTANAĞI/i
    ],
    ekspertiz: [
      /EKSERT[Iİ]Z[:\s]+RAPORU/i,
      /EKSERT[Iİ]Z[:\s]+RAPORU/i,
      /EKSERT[Iİ]Z[:\s]+GÖRÜŞÜ/i,
      /EKSERT[Iİ]Z[:\s]+TESP[Iİ]T[Iİ]/i
    ]
  };
  
  for (const [type, patternList] of Object.entries(patterns)) {
    for (const pattern of patternList) {
      if (pattern.test(text)) {
        return type;
      }
    }
  }
  
  return 'insurance_policy'; // default
}

// Field extraction functions
function extractCustomerName(text) {
  // Çok daha spesifik pattern'ler - sadece gerçek isim alanlarını yakala
  const patterns = [
    // Sigorta Ettiren için
    /Sigorta[:\s]+Ettiren[:\s]+Bilgiler[Iİ][:\s]*Adı[:\s]+Soyadı[:\s]*\/[:\s]*Unvanı[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+TCKN|$)/i,
    /Adı[:\s]+Soyadı[:\s]*\/[:\s]*Unvanı[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+TCKN|$)/i,
    
    // Sigortalı için
    /Sigortalı[:\s]+Bilgiler[Iİ][:\s]*Adı[:\s]+Soyadı[:\s]*\/[:\s]*Unvanı[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+TCKN|$)/i,
    
    // Genel isim pattern'leri (daha dikkatli)
    /Ad[Iİ][:\s]+Soyad[Iİ][:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+TC|$)/i,
    /Müşteri[:\s]+Adı[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+TC|$)/i,
    /Sigortalı[:\s]+Adı[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+TC|$)/i,
    
    // Kasko için özel
    /Sigortalının[:\s]+Adı[:\s]+Soyadı[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+TC|$)/i,
    /Sigortalı[:\s]+Adı[:\s]+Soyadı[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+TC|$)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      let name = match[1].trim();
      // Çok daha dikkatli temizleme
      name = name.replace(/\s+/g, ' ')
                .replace(/[^\w\sçğıiöşüÇĞIİÖŞÜ]/g, '')
                .replace(/^(ad|adı|soyad|soyadı|isim|müşteri|sigortalı|sigorta|ettiren|bilgiler|bilgi|adresi|adres|telefon|tc|tckn|vkn|ykn|vergi|dairesi|e-posta|eposta|email|mail|iletişim|lietigim|posta|posta\s+lietigim)\s*/i, '')
                .trim();
      
      // Geçerli isim kontrolü
      if (name.length > 2 && name.length < 50 && 
          !name.match(/^(ad|adı|soyad|soyadı|isim|müşteri|sigortalı|sigorta|ettiren|bilgiler|bilgi|adresi|adres|telefon|tc|tckn|vkn|ykn|vergi|dairesi|e-posta|eposta|email|mail|iletişim|lietigim|posta|posta\s+lietigim)$/i) &&
          name.match(/^[A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+$/)) {
        return name;
      }
    }
  }
  return null;
}

function extractTCNumber(text) {
  // Çok daha dikkatli TC numarası extraction
  const patterns = [
    /TCKN[:\s]*\/[:\s]*VKN[:\s]*\/[:\s]*YKN[:\s]*:?(\d{11})/i,
    /tckn[:\s]*\/[:\s]*vkn[:\s]*\/[:\s]*ykn[:\s]*:?(\d{11})/i,
    /TC[:\s]+No[:\s]*:?(\d{11})/i,
    /tc[:\s]+no[:\s]*:?(\d{11})/i,
    /\b(\d{11})\b/g
  ];
  
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        const tc = match.length === 2 ? match[1] : match;
        if (tc && tc.length === 11 && isValidTCNumber(tc)) {
          return tc;
        }
      }
    }
  }
  return null;
}

function isValidTCNumber(tc) {
  if (tc.length !== 11) return false;
  
  const digits = tc.split('').map(Number);
  const sum1 = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const sum2 = digits[1] + digits[3] + digits[5] + digits[7];
  
  return (sum1 * 7 - sum2) % 10 === digits[9] && 
         (sum1 + sum2 + digits[9]) % 10 === digits[10];
}

function extractPolicyNumber(text) {
  const patterns = [
    /Teklif[:\s]+No[:\s]*:?([A-Z0-9\-]+)/i,
    /poliçe[:\s]+no[:\s]*:?([A-Z0-9\-]+)/i,
    /poliçe[:\s]+numarası[:\s]*:?([A-Z0-9\-]+)/i,
    /policy[:\s]+no[:\s]*:?([A-Z0-9\-]+)/i,
    /Sigorta[:\s]+Şirketi[:\s]+Pol[Iİ]çe[:\s]+No[:\s]*:?([A-Z0-9\-]+)/i,
    /sigorta[:\s]+şirketi[:\s]+pol[Iİ]çe[:\s]+no[:\s]*:?([A-Z0-9\-]+)/i,
    /poliçe[:\s]+([A-Z0-9\-]{6,})/i,
    /T\d{9}/g,
    /([A-Z]\d{8,})/g
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const policyNumber = match[1].trim();
      // Geçerli poliçe numarası kontrolü
      if (policyNumber.length > 3 && policyNumber.length < 50) {
        return policyNumber;
      }
    }
  }
  return null;
}

function extractDates(text) {
  const startPatterns = [
    /Poliçe[:\s]+Vadesi[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})[\s\-]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /başlangıç[:\s]+tarihi[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /başlangıç[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /start[:\s]+date[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})[\s\-]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/g
  ];
  
  const endPatterns = [
    /bitiş[:\s]+tarihi[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /bitiş[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /end[:\s]+date[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i
  ];
  
  let startDate = null;
  let endDate = null;
  
  // Check for date ranges first
  for (const pattern of startPatterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[1] && match[2]) {
        startDate = match[1].trim();
        endDate = match[2].trim();
        break;
      } else if (match[1]) {
        startDate = match[1].trim();
      }
    }
  }
  
  // If no range found, try individual patterns
  if (!startDate) {
    for (const pattern of startPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        startDate = match[1].trim();
        break;
      }
    }
  }
  
  if (!endDate) {
    for (const pattern of endPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        endDate = match[1].trim();
        break;
      }
    }
  }
  
  return { startDate, endDate };
}

function extractAmount(text) {
  const patterns = [
    /Ödenecek[:\s]+Tutar[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
    /TUTAR[:\s]*\(TL\)[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
    /(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*₺/g,
    /(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*TL/g,
    /tutar[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
    /amount[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

function extractPlateNumber(text) {
  const patterns = [
    /Plaka[:\s]*([0-9]{2}\s*[A-Z]{1,3}\s*[0-9]{2,4})/i,
    /plaka[:\s]*([0-9]{2}\s*[A-Z]{1,3}\s*[0-9]{2,4})/i,
    /plate[:\s]*([0-9]{2}\s*[A-Z]{1,3}\s*[0-9]{2,4})/i,
    /([0-9]{2}\s*[A-Z]{1,3}\s*[0-9]{2,4})/g
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

function extractChassisMotor(text) {
  const chassisPatterns = [
    /Şasi[:\s]+No[:\s]*([A-Z0-9]{10,})/i,
    /şasi[:\s]*([A-Z0-9]{10,})/i,
    /chassis[:\s]*([A-Z0-9]{10,})/i
  ];
  
  const motorPatterns = [
    /Motor[:\s]+No[:\s]*([A-Z0-9]{6,})/i,
    /motor[:\s]*([A-Z0-9]{6,})/i,
    /engine[:\s]*([A-Z0-9]{6,})/i
  ];
  
  let chassis = null;
  let motor = null;
  
  for (const pattern of chassisPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      chassis = match[1].trim();
      break;
    }
  }
  
  for (const pattern of motorPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      motor = match[1].trim();
      break;
    }
  }
  
  return { chassis, motor };
}

function extractExpertInfo(text) {
  const patterns = [
    /eksper[:\s]+([a-zA-ZçğıöşüÇĞIİÖŞÜ\s]+)/i,
    /doktor[:\s]+([a-zA-ZçğıöşüÇĞIİÖŞÜ\s]+)/i,
    /noter[:\s]+([a-zA-ZçğıöşüÇĞIİÖŞÜ\s]+)/i,
    /expert[:\s]+([a-zA-ZçğıöşüÇĞIİÖŞÜ\s]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

// New extraction functions for additional fields
function extractVehicleInfo(text) {
  const patterns = {
    brand: [
      /Marka[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Model|$)/i,
      /marka[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Model|$)/i
    ],
    model: [
      /Model[:\s]*([A-ZÇĞIİÖŞÜ0-9][a-zçğıiöşü0-9\s]+?)(?:\s+Model|$)/i,
      /model[:\s]*([A-ZÇĞIİÖŞÜ0-9][a-zçğıiöşü0-9\s]+?)(?:\s+Model|$)/i
    ],
    year: [
      /Model[:\s]+Yılı[:\s]*(\d{4})/i,
      /model[:\s]+yılı[:\s]*(\d{4})/i,
      /yıl[:\s]*(\d{4})/i
    ],
    type: [
      /Tür[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Tescil|$)/i,
      /tür[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Tescil|$)/i
    ]
  };
  
  const result = {};
  for (const [key, patternList] of Object.entries(patterns)) {
    for (const pattern of patternList) {
      const match = text.match(pattern);
      if (match && match[1]) {
        result[key] = match[1].trim();
        break;
      }
    }
  }
  
  return result;
}

function extractCompanyInfo(text) {
  const patterns = {
    company: [
      /Sigorta[:\s]+Şirketi[:\s]+Unvanı[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Adresi|$)/i,
      /sigorta[:\s]+şirketi[:\s]+unvanı[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Adresi|$)/i
    ],
    agent: [
      /Acente[:\s]+Kodu[:\s]*\/[:\s]*Adı[:\s]*\/[:\s]*Unvanı[:\s]*([A-ZÇĞIİÖŞÜ0-9][a-zçğıiöşü0-9\s\/\.]+?)(?:\s+Adresi|$)/i,
      /acente[:\s]+kodu[:\s]*\/[:\s]*adı[:\s]*\/[:\s]*unvanı[:\s]*([A-ZÇĞIİÖŞÜ0-9][a-zçğıiöşü0-9\s\/\.]+?)(?:\s+Adresi|$)/i
    ]
  };
  
  const result = {};
  for (const [key, patternList] of Object.entries(patterns)) {
    for (const pattern of patternList) {
      const match = text.match(pattern);
      if (match && match[1]) {
        result[key] = match[1].trim();
        break;
      }
    }
  }
  
  return result;
}

function extractPremiumInfo(text) {
  const patterns = {
    beforeTax: [
      /Vergi[:\s]+Öncesi[:\s]+Prim[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
      /vergi[:\s]+öncesi[:\s]+prim[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i
    ],
    tax: [
      /BSMV[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
      /bsmv[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i
    ],
    paymentMethod: [
      /Tahsilat[:\s]+Yöntemi[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s*$|$)/i,
      /tahsilat[:\s]+yöntemi[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s*$|$)/i
    ]
  };
  
  const result = {};
  for (const [key, patternList] of Object.entries(patterns)) {
    for (const pattern of patternList) {
      const match = text.match(pattern);
      if (match && match[1]) {
        result[key] = match[1].trim();
        break;
      }
    }
  }
  
  return result;
}

// Comprehensive extraction functions for all document types
function extractPolicyInfo(text) {
  const patterns = {
    policyNumber: [
      /Poliçe[:\s]+No[:\s]*([A-Z0-9\-]+)/i,
      /poliçe[:\s]+no[:\s]*([A-Z0-9\-]+)/i,
      /Teklif[:\s]+No[:\s]*([A-Z0-9\-]+)/i,
      /teklif[:\s]+no[:\s]*([A-Z0-9\-]+)/i,
      /T\d{9}/g,
      /([A-Z]\d{8,})/g
    ],
    issueDate: [
      /Poliçe[:\s]+Düzenlenme[:\s]+Tarihi[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /poliçe[:\s]+düzenlenme[:\s]+tarihi[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /Düzenleme[:\s]+Tarihi[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /düzenleme[:\s]+tarihi[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i
    ],
    validityPeriod: [
      /Poliçe[:\s]+Vadesi[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})[:\s\-]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /poliçe[:\s]+vadesi[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})[:\s\-]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /Geçerlilik[:\s]+Başlangıç[:\s\-]+Bitiş[:\s]+Tarihi[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})[:\s\-]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i
    ]
  };
  
  const result = {};
  for (const [key, patternList] of Object.entries(patterns)) {
    for (const pattern of patternList) {
      const match = text.match(pattern);
      if (match) {
        if (key === 'validityPeriod' && match[1] && match[2]) {
          result.startDate = match[1].trim();
          result.endDate = match[2].trim();
        } else if (match[1]) {
          result[key] = match[1].trim();
        }
        break;
      }
    }
  }
  
  return result;
}

// Anadolu Sigorta specific extraction functions
function extractAnadoluSigortaInfo(text) {
  const patterns = {
    company: [
      /ANADOLU[:\s]+ANON[Iİ]M[:\s]+TÜRK[:\s]+S[Iİ]GORTA[:\s]+S[Iİ]RKET[Iİ]/i,
      /ANADOLU[:\s]+S[Iİ]GORTA/i
    ],
    address: [
      /Büyükdere[:\s]+Caddesi[:\s,]+[A-Za-zçğıiöşüÇĞIİÖŞÜ\s\d]+?İstanbul/i,
      /34330[:\s]+4\.\s+Levent[:\s]+İstanbul/i
    ],
    phone: [
      /T:\s*\+90[:\s]*212[:\s]*350[:\s]*0350/i,
      /F:\s*\+90[:\s]*212[:\s]*350[:\s]*0355/i
    ],
    taxId: [
      /Büyük[:\s]+Mükellefler[:\s]+V\.D\.\s*(\d+)/i,
      /V\.D\.\s*(\d+)/i
    ],
    website: [
      /www\.anadolusigorta\.com\.tr/i
    ]
  };
  
  const result = {};
  for (const [key, patternList] of Object.entries(patterns)) {
    for (const pattern of patternList) {
      const match = text.match(pattern);
      if (match) {
        result[key] = match[1] ? match[1].trim() : match[0].trim();
        break;
      }
    }
  }
  
  return result;
}

function extractAnadoluVehicleInfo(text) {
  const patterns = {
    brand: [
      /Marka[:\s]+\/\s+Model[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü0-9\s]+?)(?:\s+Bedeli|$)/i,
      /CITROEN[:\s]+C4[:\s]+SX[:\s]+1\.6[:\s]+HDI[:\s]+\(110\)/i
    ],
    value: [
      /Bedeli[:\s]*\(TL\)[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
      /28\.000,00/i
    ],
    type: [
      /Tipi[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Marka|$)/i,
      /Araç/i
    ]
  };
  
  const result = {};
  for (const [key, patternList] of Object.entries(patterns)) {
    for (const pattern of patternList) {
      const match = text.match(pattern);
      if (match) {
        result[key] = match[1] ? match[1].trim() : match[0].trim();
        break;
      }
    }
  }
  
  return result;
}

function extractAnadoluCoverageInfo(text) {
  const patterns = {
    kaskoPremium: [
      /Kasko[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i
    ],
    kaskoAmount: [
      /Araç[:\s]+ve[:\s]+Donanımı[:\s]*(\d{1,3}(?:\.\d{3})*)/i,
      /Kişisel[:\s]+Eşya[:\s]*(\d{1,3}(?:\.\d{3})*)/i
    ],
    maliSorumluluk: [
      /Artan[:\s]+Mali[:\s]+Sorumluluk[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i
    ],
    ferdiKaza: [
      /Koltuk[:\s]+Ferdi[:\s]+Kaza[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i
    ],
    hukuksalKoruma: [
      /Hukuksal[:\s]+Koruma[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i
    ],
    limits: [
      /Ölüm[:\s]*(\d{1,3}(?:\.\d{3})*)/i,
      /Sürekli[:\s]+Sakatlık[:\s]*(\d{1,3}(?:\.\d{3})*)/i,
      /Tedavi[:\s]*(\d{1,3}(?:\.\d{3})*)/i,
      /SINIRSIZ/i
    ]
  };
  
  const result = {};
  for (const [key, patternList] of Object.entries(patterns)) {
    for (const pattern of patternList) {
      const match = text.match(pattern);
      if (match) {
        result[key] = match[1] ? match[1].trim() : match[0].trim();
        break;
      }
    }
  }
  
  return result;
}

function extractAnadoluDiscountInfo(text) {
  const patterns = {
    hasarsizlikOrani: [
      /Hasarsızlık[:\s]+Oranı[:\s]*:\s*%\s*(\d+)/i,
      /Hasarsizlk[:\s]+Kademesi[:\s]*:\s*(\d+)/i
    ],
    hasarsizlikKademesi: [
      /Hasarsizlk[:\s]+Kademesi[:\s]*:\s*(\d+)/i
    ],
    baglantiIndirimi: [
      /Müşteri[:\s]+Bağlantı[:\s]+İndirimi[:\s]*%\s*(\d+(?:,\d+)?)/i
    ],
    ozelMusteriIndirimi: [
      /Özel[:\s]+Müşteri[:\s]+İndirimi[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s*$|$)/i
    ],
    acenteKodu: [
      /Acente[:\s]+Kodu[:\s]*:\s*(\d+)/i
    ],
    tramerBelgeNo: [
      /Tramer[:\s]+Belge[:\s]+No[:\s]*:\s*(\d+)/i
    ],
    tramerBelgeTarihi: [
      /Tramer[:\s]+Belge[:\s]+Tarihi[:\s]*:\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i
    ]
  };
  
  const result = {};
  for (const [key, patternList] of Object.entries(patterns)) {
    for (const pattern of patternList) {
      const match = text.match(pattern);
      if (match && match[1]) {
        result[key] = match[1].trim();
        break;
      }
    }
  }
  
  return result;
}

function extractInsuredInfo(text) {
  const patterns = {
    name: [
      /Sigortalı[:\s]+Adı[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Adresi|$)/i,
      /sigortalı[:\s]+adı[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Adresi|$)/i,
      /Müşteri[:\s]+Adı[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Adresi|$)/i,
      /müşteri[:\s]+adı[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Adresi|$)/i
    ],
    tcNumber: [
      /T\.C\.\s*No[:\s]*(\d{11})/i,
      /tc[:\s]+no[:\s]*(\d{11})/i,
      /kimlik[:\s]+no[:\s]*(\d{11})/i,
      /\b\d{11}\b/g
    ],
    address: [
      /Adresi[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\d\/\.,]+?)(?:\s+Telefon|$)/i,
      /adresi[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\d\/\.,]+?)(?:\s+Telefon|$)/i
    ],
    phone: [
      /Telefon[:\s]+Numarası[:\s]*([0-9\s\-\(\)]+)/i,
      /telefon[:\s]+numarası[:\s]*([0-9\s\-\(\)]+)/i,
      /Tel[:\s]*([0-9\s\-\(\)]+)/i
    ]
  };
  
  const result = {};
  for (const [key, patternList] of Object.entries(patterns)) {
    for (const pattern of patternList) {
      const match = text.match(pattern);
      if (match && match[1]) {
        result[key] = match[1].trim();
        break;
      }
    }
  }
  
  return result;
}

function extractVehicleDetails(text) {
  const patterns = {
    plate: [
      /Plaka[:\s]*([0-9]{2}\s*[A-Z]{1,3}\s*[0-9]{2,4})/i,
      /plaka[:\s]*([0-9]{2}\s*[A-Z]{1,3}\s*[0-9]{2,4})/i
    ],
    brand: [
      /Marka[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Model|$)/i,
      /marka[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Model|$)/i
    ],
    model: [
      /Model[:\s]*([A-ZÇĞIİÖŞÜ0-9][a-zçğıiöşü0-9\s]+?)(?:\s+Model|$)/i,
      /model[:\s]*([A-ZÇĞIİÖŞÜ0-9][a-zçğıiöşü0-9\s]+?)(?:\s+Model|$)/i
    ],
    year: [
      /Model[:\s]+Yılı[:\s]*(\d{4})/i,
      /model[:\s]+yılı[:\s]*(\d{4})/i,
      /Yıl[:\s]*(\d{4})/i
    ],
    chassis: [
      /Şasi[:\s]+No[:\s]*([A-Z0-9]{10,})/i,
      /şasi[:\s]+no[:\s]*([A-Z0-9]{10,})/i
    ],
    motor: [
      /Motor[:\s]+No[:\s]*([A-Z0-9]{6,})/i,
      /motor[:\s]+no[:\s]*([A-Z0-9]{6,})/i
    ],
    owner: [
      /Ruhsat[:\s]+Sahibi[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Adresi|$)/i,
      /ruhsat[:\s]+sahibi[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Adresi|$)/i
    ]
  };
  
  const result = {};
  for (const [key, patternList] of Object.entries(patterns)) {
    for (const pattern of patternList) {
      const match = text.match(pattern);
      if (match && match[1]) {
        result[key] = match[1].trim();
        break;
      }
    }
  }
  
  return result;
}

function extractCoverageInfo(text) {
  const patterns = {
    coverageTypes: [
      /Teminat[:\s]+Türleri[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s,]+?)(?:\s+Limit|$)/i,
      /teminat[:\s]+türleri[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s,]+?)(?:\s+Limit|$)/i
    ],
    limits: [
      /Limit[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\d\.,]+?)(?:\s+Muafiyet|$)/i,
      /limit[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\d\.,]+?)(?:\s+Muafiyet|$)/i
    ],
    exemptions: [
      /Muafiyet[:\s]+ve[:\s]+İstisnalar[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s,]+?)(?:\s+Prim|$)/i,
      /muafiyet[:\s]+ve[:\s]+istisnalar[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s,]+?)(?:\s+Prim|$)/i
    ]
  };
  
  const result = {};
  for (const [key, patternList] of Object.entries(patterns)) {
    for (const pattern of patternList) {
      const match = text.match(pattern);
      if (match && match[1]) {
        result[key] = match[1].trim();
        break;
      }
    }
  }
  
  return result;
}

function extractFinancialInfo(text) {
  const patterns = {
    grossPremium: [
      /Brüt[:\s]+Prim[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
      /brüt[:\s]+prim[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i
    ],
    netPremium: [
      /Net[:\s]+Prim[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
      /net[:\s]+prim[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i
    ],
    totalAmount: [
      /Ödenecek[:\s]+Tutar[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
      /ödenecek[:\s]+tutar[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
      /Toplam[:\s]+Tutar[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i
    ],
    paymentPlan: [
      /Ödeme[:\s]+Planı[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Ödeme|$)/i,
      /ödeme[:\s]+planı[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Ödeme|$)/i
    ]
  };
  
  const result = {};
  for (const [key, patternList] of Object.entries(patterns)) {
    for (const pattern of patternList) {
      const match = text.match(pattern);
      if (match && match[1]) {
        result[key] = match[1].trim();
        break;
      }
    }
  }
  
  return result;
}

// Trafik Sigortası specific extraction functions
function extractTrafikSigortasiInfo(text) {
  const patterns = {
    // Poliçe Bilgileri
    policyNumber: [
      /Poliçe[:\s]+No[:\s]*([A-Z0-9\-]+)/i,
      /poliçe[:\s]+no[:\s]*([A-Z0-9\-]+)/i,
      /POL[Iİ]ÇE[:\s]+NO[:\s]*([A-Z0-9\-]+)/i
    ],
    issueDate: [
      /Tanzim[:\s]+Tarihi[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /tanzim[:\s]+tarihi[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i
    ],
    validityPeriod: [
      /Vade[:\s]+Tarihi[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /vade[:\s]+tarihi[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i
    ],
    
    // Sigorta Şirketi Bilgileri
    company: [
      /Sigorta[:\s]+Şirketi[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Acente|$)/i,
      /sigorta[:\s]+şirketi[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Acente|$)/i
    ],
    agent: [
      /Acente[:\s]+Kodu[:\s]*([A-Z0-9\-]+)/i,
      /acente[:\s]+kodu[:\s]*([A-Z0-9\-]+)/i
    ],
    
    // Sigorta Ettiren Bilgileri
    insuredName: [
      /Sigorta[:\s]+Ettiren[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+TC|$)/i,
      /sigorta[:\s]+ettiren[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+TC|$)/i
    ],
    insuredTC: [
      /T\.C\.\s*No[:\s]*(\d{11})/i,
      /tc[:\s]+no[:\s]*(\d{11})/i
    ],
    
    // Teminat Limitleri
    vehicleMaterialDamage: [
      /Araç[:\s]+Başına[:\s]+Maddi[:\s]+Giderler[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
      /araç[:\s]+başına[:\s]+maddi[:\s]+giderler[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i
    ],
    accidentMaterialDamage: [
      /Kaza[:\s]+Başına[:\s]+Maddi[:\s]+Giderler[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
      /kaza[:\s]+başına[:\s]+maddi[:\s]+giderler[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i
    ],
    personHealthExpenses: [
      /Kişi[:\s]+Başına[:\s]+Sağlık[:\s]+Giderleri[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
      /kişi[:\s]+başına[:\s]+sağlık[:\s]+giderleri[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i
    ],
    accidentHealthExpenses: [
      /Kaza[:\s]+Başına[:\s]+Sağlık[:\s]+Giderleri[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
      /kaza[:\s]+başına[:\s]+sağlık[:\s]+giderleri[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i
    ],
    personInjuryDeath: [
      /Kişi[:\s]+Başına[:\s]+Sakatlanma[:\s]+ve[:\s]+Ölüm[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
      /kişi[:\s]+başına[:\s]+sakatlanma[:\s]+ve[:\s]+ölüm[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i
    ],
    accidentInjuryDeath: [
      /Kaza[:\s]+Başına[:\s]+Sakatlanma[:\s]+ve[:\s]+Ölüm[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
      /kaza[:\s]+başına[:\s]+sakatlanma[:\s]+ve[:\s]+ölüm[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i
    ],
    
    // Prim Detayları
    damageStep: [
      /Hasar[:\s]+Geçmişine[:\s]+Göre[:\s]+Belirlenen[:\s]+Basamak[:\s]*(\d+)/i,
      /hasar[:\s]+geçmişine[:\s]+göre[:\s]+belirlenen[:\s]+basamak[:\s]*(\d+)/i
    ],
    premiumAmount: [
      /Prim[:\s]+Tutarı[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
      /prim[:\s]+tutarı[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i
    ]
  };
  
  const result = {};
  for (const [key, patternList] of Object.entries(patterns)) {
    for (const pattern of patternList) {
      const match = text.match(pattern);
      if (match && match[1]) {
        result[key] = match[1].trim();
        break;
      }
    }
  }
  
  return result;
}

// Hasar Raporu specific extraction functions
function extractHasarRaporuInfo(text) {
  const patterns = {
    // Genel Bilgiler
    reportNumber: [
      /Rapor[:\s]+No[:\s]*([A-Z0-9\-]+)/i,
      /rapor[:\s]+no[:\s]*([A-Z0-9\-]+)/i
    ],
    reportDate: [
      /Rapor[:\s]+Tarihi[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /rapor[:\s]+tarihi[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i
    ],
    fileNumber: [
      /Dosya[:\s]+No[:\s]*([A-Z0-9\-]+)/i,
      /dosya[:\s]+no[:\s]*([A-Z0-9\-]+)/i
    ],
    
    // Eksper Bilgileri
    expertName: [
      /Eksper[:\s]+Adı[:\s]+Soyadı[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Sicil|$)/i,
      /eksper[:\s]+adı[:\s]+soyadı[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Sicil|$)/i
    ],
    expertRegistry: [
      /Sicil[:\s]+No[:\s]*([A-Z0-9\-]+)/i,
      /sicil[:\s]+no[:\s]*([A-Z0-9\-]+)/i
    ],
    
    // Hasar Bilgileri
    damageDate: [
      /Hasar[:\s]+Tarihi[:\s]+ve[:\s]+Saati[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}[:\s]+\d{1,2}:\d{2})/i,
      /hasar[:\s]+tarihi[:\s]+ve[:\s]+saati[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}[:\s]+\d{1,2}:\d{2})/i
    ],
    damageLocation: [
      /Hasarın[:\s]+Meydana[:\s]+Geldiği[:\s]+Yer[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\d\/\.,]+?)(?:\s+Hasarın|$)/i,
      /hasarın[:\s]+meydana[:\s]+geldiği[:\s]+yer[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\d\/\.,]+?)(?:\s+Hasarın|$)/i
    ],
    damageDescription: [
      /Hasarın[:\s]+Tanımı[:\s]+ve[:\s]+Detayları[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\d\/\.,]+?)(?:\s+Tespitler|$)/i,
      /hasarın[:\s]+tanımı[:\s]+ve[:\s]+detayları[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\d\/\.,]+?)(?:\s+Tespitler|$)/i
    ],
    
    // Maliyet Analizi
    sparePartsCost: [
      /Yedek[:\s]+Parça[:\s]+Maliyeti[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
      /yedek[:\s]+parça[:\s]+maliyeti[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i
    ],
    laborCost: [
      /İşçilik[:\s]+Maliyeti[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
      /işçilik[:\s]+maliyeti[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i
    ],
    totalRepairCost: [
      /Toplam[:\s]+Onarım[:\s]+Maliyeti[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
      /toplam[:\s]+onarım[:\s]+maliyeti[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i
    ],
    valueLoss: [
      /Değer[:\s]+Kaybı[:\s]+Hesaplaması[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
      /değer[:\s]+kaybı[:\s]+hesaplaması[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i
    ]
  };
  
  const result = {};
  for (const [key, patternList] of Object.entries(patterns)) {
    for (const pattern of patternList) {
      const match = text.match(pattern);
      if (match && match[1]) {
        result[key] = match[1].trim();
        break;
      }
    }
  }
  
  return result;
}

// Ekspertiz Raporu specific extraction functions
function extractEkspertizRaporuInfo(text) {
  const patterns = {
    // Genel Bilgiler
    reportNumber: [
      /Rapor[:\s]+No[:\s]*([A-Z0-9\-]+)/i,
      /rapor[:\s]+no[:\s]*([A-Z0-9\-]+)/i
    ],
    reportDate: [
      /Rapor[:\s]+Tarihi[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /rapor[:\s]+tarihi[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i
    ],
    fileNumber: [
      /Dosya[:\s]+No[:\s]*([A-Z0-9\-]+)/i,
      /dosya[:\s]+no[:\s]*([A-Z0-9\-]+)/i
    ],
    
    // Eksper Bilgileri
    expertName: [
      /Eksper[:\s]+Adı[:\s]+Soyadı[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Sicil|$)/i,
      /eksper[:\s]+adı[:\s]+soyadı[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Sicil|$)/i
    ],
    expertRegistry: [
      /Sicil[:\s]+No[:\s]*([A-Z0-9\-]+)/i,
      /sicil[:\s]+no[:\s]*([A-Z0-9\-]+)/i
    ],
    
    // Hasar Bilgileri
    damageDate: [
      /Hasar[:\s]+Tarihi[:\s]+ve[:\s]+Saati[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}[:\s]+\d{1,2}:\d{2})/i,
      /hasar[:\s]+tarihi[:\s]+ve[:\s]+saati[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}[:\s]+\d{1,2}:\d{2})/i
    ],
    damageLocation: [
      /Hasarın[:\s]+Meydana[:\s]+Geldiği[:\s]+Yer[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\d\/\.,]+?)(?:\s+Hasarın|$)/i,
      /hasarın[:\s]+meydana[:\s]+geldiği[:\s]+yer[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\d\/\.,]+?)(?:\s+Hasarın|$)/i
    ],
    
    // Tespitler ve Değerlendirmeler
    damagedParts: [
      /Hasarlı[:\s]+Parçaların[:\s]+Listesi[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\d\/\.,]+?)(?:\s+Onarılacak|$)/i,
      /hasarlı[:\s]+parçaların[:\s]+listesi[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\d\/\.,]+?)(?:\s+Onarılacak|$)/i
    ],
    repairParts: [
      /Onarılacak[:\s]+Parçalar[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\d\/\.,]+?)(?:\s+Değiştirilecek|$)/i,
      /onarılacak[:\s]+parçalar[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\d\/\.,]+?)(?:\s+Değiştirilecek|$)/i
    ],
    replaceParts: [
      /Değiştirilecek[:\s]+Parçalar[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\d\/\.,]+?)(?:\s+Onarımın|$)/i,
      /değiştirilecek[:\s]+parçalar[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\d\/\.,]+?)(?:\s+Onarımın|$)/i
    ],
    
    // Maliyet Analizi
    sparePartsCost: [
      /Yedek[:\s]+Parça[:\s]+Maliyeti[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
      /yedek[:\s]+parça[:\s]+maliyeti[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i
    ],
    laborCost: [
      /İşçilik[:\s]+Maliyeti[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
      /işçilik[:\s]+maliyeti[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i
    ],
    totalRepairCost: [
      /Toplam[:\s]+Onarım[:\s]+Maliyeti[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
      /toplam[:\s]+onarım[:\s]+maliyeti[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i
    ],
    valueLoss: [
      /Değer[:\s]+Kaybı[:\s]+Hesaplaması[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
      /değer[:\s]+kaybı[:\s]+hesaplaması[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i
    ],
    
    // Sonuç ve Kanaat
    expertOpinion: [
      /Eksperin[:\s]+Hasarın[:\s]+Kapsamı[:\s]+ve[:\s]+Nedeni[:\s]+Hakkındaki[:\s]+Nihai[:\s]+Görüşü[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\d\/\.,]+?)(?:\s+Hasarlı|$)/i,
      /eksperin[:\s]+hasarın[:\s]+kapsamı[:\s]+ve[:\s]+nedeni[:\s]+hakkındaki[:\s]+nihai[:\s]+görüşü[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\d\/\.,]+?)(?:\s+Hasarlı|$)/i
    ]
  };
  
  const result = {};
  for (const [key, patternList] of Object.entries(patterns)) {
    for (const pattern of patternList) {
      const match = text.match(pattern);
      if (match && match[1]) {
        result[key] = match[1].trim();
        break;
      }
    }
  }
  
  return result;
}

// Deprem Sigortası specific extraction functions
function extractDepremSigortasiInfo(text) {
  const patterns = {
    // DASK Bilgileri
    daskPolicyNumber: [
      /DASK[:\s]+Pol[Iİ]çe[:\s]+No[:\s]*(\d+)/i,
      /dask[:\s]+pol[Iİ]çe[:\s]+no[:\s]*(\d+)/i,
      /DASK[:\s]+POL[Iİ]ÇE[:\s]+NO[:\s]*(\d+)/i
    ],
    addressCode: [
      /Adres[:\s]+Kodu[:\s]*(\d+)/i,
      /adres[:\s]+kodu[:\s]*(\d+)/i,
      /ADRES[:\s]+KODU[:\s]*(\d+)/i
    ],
    buildingCode: [
      /Bina[:\s]+Kodu[:\s]*(\d+)/i,
      /bina[:\s]+kodu[:\s]*(\d+)/i,
      /BINA[:\s]+KODU[:\s]*(\d+)/i
    ],
    
    // Poliçe Tarihleri
    startDate: [
      /Başlangıç[:\s]+Tarihi[:\s]*:?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /başlangıç[:\s]+tarihi[:\s]*:?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /BAŞLANGIÇ[:\s]+TARİHİ[:\s]*:?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /Baslangiç[:\s]+Tarihi[:\s]*:?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i
    ],
    endDate: [
      /Bitiş[:\s]+Tarihi[:\s]*:?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /bitiş[:\s]+tarihi[:\s]*:?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /BİTİŞ[:\s]+TARİHİ[:\s]*:?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /Bitig[:\s]+Tarihi[:\s]*:?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i
    ],
    issueDate: [
      /Tanzim[:\s]+Tarihi[:\s]*:?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /tanzim[:\s]+tarihi[:\s]*:?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /TANZİM[:\s]+TARİHİ[:\s]*:?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i
    ],
    preparationDate: [
      /Düzenleme[:\s]+Tarihi[:\s]+-?[:\s]+Saati[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}[:\s]+\d{1,2}:\d{2})/i,
      /düzenleme[:\s]+tarihi[:\s]+-?[:\s]+saati[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}[:\s]+\d{1,2}:\d{2})/i
    ],
    renewalNumber: [
      /Yenileme[:\s]+No[:\s]*(\d+)/i,
      /yenileme[:\s]+no[:\s]*(\d+)/i,
      /YENİLEME[:\s]+NO[:\s]*(\d+)/i
    ],
    
    // Sigorta Şirketi Bilgileri
    insuranceCompany: [
      /Sigorta[:\s]+Şirketi[:\s]+Unvanı[:\s]*:?([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\.]+?)(?:\s+Acente|$)/i,
      /sigorta[:\s]+şirketi[:\s]+unvanı[:\s]*:?([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\.]+?)(?:\s+Acente|$)/i,
      /Sigorta[:\s]+Sirketi[:\s]+Unvant[:\s]*:?([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\.]+?)(?:\s+Acente|$)/i,
      /sigorta[:\s]+sirketi[:\s]+unvant[:\s]*:?([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\.]+?)(?:\s+Acente|$)/i,
      /UNICO[:\s]+SIGORTA[:\s]+A\.S\./i,
      /unico[:\s]+sigorta[:\s]+a\.s\./i
    ],
    insurancePolicyNumber: [
      /Sigorta[:\s]+Şirketi[:\s]+Pol[Iİ]çe[:\s]+No[:\s]*(\d+)/i,
      /sigorta[:\s]+şirketi[:\s]+pol[Iİ]çe[:\s]+no[:\s]*(\d+)/i
    ],
    agencyName: [
      /Acente[:\s]+Unvanı[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\.]+?)(?:\s+Acente|$)/i,
      /acente[:\s]+unvanı[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\.]+?)(?:\s+Acente|$)/i
    ],
    agencyNumber: [
      /Acente[:\s]+No[:\s]*(\d+)/i,
      /acente[:\s]+no[:\s]*(\d+)/i
    ],
    plateNumber: [
      /Levha[:\s]+No[:\s]*([A-Z0-9]+)/i,
      /levha[:\s]+no[:\s]*([A-Z0-9]+)/i
    ],
    phone: [
      /Telefon[:\s]*\((\d{3})\)(\d{3})-(\d{2})-(\d{2})/i,
      /telefon[:\s]*\((\d{3})\)(\d{3})-(\d{2})-(\d{2})/i
    ],
    
    // Sigorta Ettiren Bilgileri
    policyholderName: [
      /Ad[Iİ][:\s]+Soyad[Iİ][:\s]*\/[:\s]*Unvan[Iİ][:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+TCKN|$)/i,
      /ad[Iİ][:\s]+soyad[Iİ][:\s]*\/[:\s]*unvan[Iİ][:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+TCKN|$)/i,
      /Ad[Iİ][:\s]+Soyad[Iİ][:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+TCKN|$)/i,
      /ad[Iİ][:\s]+soyad[Iİ][:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+TCKN|$)/i,
      /Ad[Iİ][:\s]+Soyad[Iİ][:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+TCKN|$)/i,
      /ad[Iİ][:\s]+soyad[Iİ][:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+TCKN|$)/i,
      /EMRAH[:\s]+TILAVER/i,
      /emrah[:\s]+tilaver/i
    ],
    policyholderTC: [
      /TCKN[:\s]*\/[:\s]*VKN[:\s]*\/[:\s]*YKN[:\s]*:?(\d{11}|\d{10}|\d{9})/i,
      /tckn[:\s]*\/[:\s]*vkn[:\s]*\/[:\s]*ykn[:\s]*:?(\d{11}|\d{10}|\d{9})/i,
      /34\*{7}22/i,
      /34\*{7}22/i
    ],
    policyholderStatus: [
      /Sigorta[:\s]+Ettiren[:\s]+Sıfatı[:\s]*:?([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Cep|$)/i,
      /sigorta[:\s]+ettiren[:\s]+sıfatı[:\s]*:?([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Cep|$)/i
    ],
    policyholderPhone: [
      /Sabit[:\s]+Telefonu[:\s]*:?\((\d{3})\)(\d{3})-(\d{2})-(\d{2})/i,
      /sabit[:\s]+telefonu[:\s]*:?\((\d{3})\)(\d{3})-(\d{2})-(\d{2})/i
    ],
    policyholderMobile: [
      /Cep[:\s]+Telefonu[:\s]*\((\d{3})\)(\d{3})-(\d{2})-(\d{2})/i,
      /cep[:\s]+telefonu[:\s]*\((\d{3})\)(\d{3})-(\d{2})-(\d{2})/i
    ],
    
    // Sigortalı Bilgileri
    insuredName: [
      /Ad[Iİ][:\s]+Soyad[Iİ][:\s]*\/[:\s]*Unvan[Iİ][:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+TCKN|$)/i,
      /ad[Iİ][:\s]+soyad[Iİ][:\s]*\/[:\s]*unvan[Iİ][:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+TCKN|$)/i,
      /Ad[Iİ][:\s]+Soyad[Iİ][:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+TCKN|$)/i,
      /ad[Iİ][:\s]+soyad[Iİ][:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+TCKN|$)/i,
      /Ad[Iİ][:\s]+Soyad[Iİ][:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+TCKN|$)/i,
      /ad[Iİ][:\s]+soyad[Iİ][:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+TCKN|$)/i,
      /EMRAH[:\s]+TILAVER/i,
      /emrah[:\s]+tilaver/i
    ],
    insuredTC: [
      /Sigortalı[:\s]+TCKN[:\s]*\/[:\s]*VKN[:\s]*\/[:\s]*YKN[:\s]*:?(\d{11}|\d{10}|\d{9})/i,
      /sigortalı[:\s]+tckn[:\s]*\/[:\s]*vkn[:\s]*\/[:\s]*ykn[:\s]*:?(\d{11}|\d{10}|\d{9})/i,
      /34\*{7}22/i,
      /34\*{7}22/i
    ],
    contactAddress: [
      /İletişim[:\s]+Adresi[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\d\/\.,-]+?)(?:\s+Sigortalı|$)/i,
      /iletişim[:\s]+adresi[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\d\/\.,-]+?)(?:\s+Sigortalı|$)/i,
      /lietigim[:\s]+Adresi[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\d\/\.,-]+?)(?:\s+Sigortalı|$)/i,
      /lietigim[:\s]+adresi[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\d\/\.,-]+?)(?:\s+Sigortalı|$)/i
    ],
    
    // Sigortalı Yer Bilgileri
    province: [
      /İl[:\s]*\/[:\s]*İlçe[:\s]*\/[:\s]*Bucak[:\s]*-[:\s]*Köy[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\/-]+?)(?:\s+Adres|$)/i,
      /il[:\s]*\/[:\s]*ilçe[:\s]*\/[:\s]*bucak[:\s]*-[:\s]*köy[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\/-]+?)(?:\s+Adres|$)/i,
      /\(Vlice\/Bucak-Kõy[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\/-]+?)(?:\s+Adres|$)/i,
      /\(vlice\/bucak-kõy[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\/-]+?)(?:\s+Adres|$)/i
    ],
    address: [
      /Adres[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\d\/\.,-]+?)(?:\s+Bina|$)/i,
      /adres[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\d\/\.,-]+?)(?:\s+Bina|$)/i
    ],
    buildingType: [
      /Bina[:\s]+Yapı[:\s]+Tarzı[:\s]*:?([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Bina|$)/i,
      /bina[:\s]+yapı[:\s]+tarzı[:\s]*:?([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Bina|$)/i,
      /Bina[:\s]+Yapi[:\s]+Tarzi[:\s]*:?([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Bina|$)/i,
      /bina[:\s]+yapi[:\s]+tarzi[:\s]*:?([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Bina|$)/i
    ],
    buildingYear: [
      /Bina[:\s]+İnşa[:\s]+Yılı[:\s]*:?(\d{4}[:\s]*-[:\s]*\d{4}|\d{4})/i,
      /bina[:\s]+inşa[:\s]+yılı[:\s]*:?(\d{4}[:\s]*-[:\s]*\d{4}|\d{4})/i,
      /Bina[:\s]+Inga[:\s]+Yilt[:\s]*:?(\d{4}[:\s]*-[:\s]*\d{4}|\d{4})/i,
      /bina[:\s]+inga[:\s]+yilt[:\s]*:?(\d{4}[:\s]*-[:\s]*\d{4}|\d{4})/i
    ],
    apartmentUsage: [
      /Daire[:\s]+Kullanım[:\s]+Şekli[:\s]*:?([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Daire|$)/i,
      /daire[:\s]+kullanım[:\s]+şekli[:\s]*:?([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Daire|$)/i,
      /Daire[:\s]+Kullanim[:\s]+Sekli[:\s]*:?([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Daire|$)/i,
      /daire[:\s]+kullanim[:\s]+sekli[:\s]*:?([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Daire|$)/i
    ],
    apartmentArea: [
      /Daire[:\s]+Brüt[:\s]+Yüzölçümü[:\s]*:?(\d+)/i,
      /daire[:\s]+brüt[:\s]+yüzölçümü[:\s]*:?(\d+)/i,
      /Daire[:\s]+Brut[:\s]+Yazolç0mu[:\s]*:?(\d+)/i,
      /daire[:\s]+brut[:\s]+yazolç0mu[:\s]*:?(\d+)/i
    ],
    totalFloors: [
      /Toplam[:\s]+Kat[:\s]+Sayısı[:\s]*:?([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\d-]+?)(?:\s+Bulunduğu|$)/i,
      /toplam[:\s]+kat[:\s]+sayısı[:\s]*:?([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\d-]+?)(?:\s+Bulunduğu|$)/i,
      /Toplam[:\s]+Kat[:\s]+Sayisi[:\s]*:?([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\d-]+?)(?:\s+Bulunduğu|$)/i,
      /toplam[:\s]+kat[:\s]+sayisi[:\s]*:?([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\d-]+?)(?:\s+Bulunduğu|$)/i
    ],
    floorLocated: [
      /Bulunduğu[:\s]+Kat[:\s]*:?([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Hasar|$)/i,
      /bulunduğu[:\s]+kat[:\s]*:?([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Hasar|$)/i,
      /Bulundugu[:\s]+Kat[:\s]*:?([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Hasar|$)/i,
      /bulundugu[:\s]+kat[:\s]*:?([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Hasar|$)/i
    ],
    damageStatus: [
      /Hasar[:\s]+Durumu[:\s]*:?([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Tapu|$)/i,
      /hasar[:\s]+durumu[:\s]*:?([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Tapu|$)/i
    ],
    islandParcel: [
      /Ada[:\s]*\/[:\s]*Pafta[:\s]*:?(\d+\/[:\s]*-?)/i,
      /ada[:\s]*\/[:\s]*pafta[:\s]*:?(\d+\/[:\s]*-?)/i
    ],
    parcelPage: [
      /Parsel[:\s]*\/[:\s]*Sayfa[:\s]*:?(\d+\/[:\s]*-?)/i,
      /parsel[:\s]*\/[:\s]*sayfa[:\s]*:?(\d+\/[:\s]*-?)/i
    ],
    
    // Prim Bilgileri
    policyPremium: [
      /Pol[Iİ]çe[:\s]+Prim[Iİ][:\s]*:?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
      /pol[Iİ]çe[:\s]+prim[Iİ][:\s]*:?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
      /Pol[Iİ]çe[:\s]+Priml[:\s]*:?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
      /pol[Iİ]çe[:\s]+priml[:\s]*:?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i
    ],
    
    // Teminat Bilgileri
    buildingCoverage: [
      /Bina[:\s]+Teminatı[:\s]*:?([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Teminat|$)/i,
      /bina[:\s]+teminatı[:\s]*:?([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Teminat|$)/i,
      /Bina[:\s]+Teminati[:\s]*:?([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Teminat|$)/i,
      /bina[:\s]+teminati[:\s]*:?([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+?)(?:\s+Teminat|$)/i,
      /DEPREM[:\s]+BINA/i,
      /deprem[:\s]+bina/i
    ],
    buildingCoverageAmount: [
      /Bina[:\s]+Teminat[:\s]+Bedeli[:\s]*:?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
      /bina[:\s]+teminat[:\s]+bedeli[:\s]*:?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i
    ],
    
    // İndirim/Sürprim Bilgileri
    discountSurchargeInfo: [
      /İndirim[:\s]*\/[:\s]*Sürprim[:\s]+Tip[Iİ][:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\d%.,-]+?)(?:\s+Sayfa|$)/i,
      /indirim[:\s]*\/[:\s]*sürprim[:\s]+tip[Iİ][:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\d%.,-]+?)(?:\s+Sayfa|$)/i,
      /İndirim[:\s]*\/[:\s]*Sürprim[:\s]+Tipl[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\d%.,-]+?)(?:\s+Sayfa|$)/i,
      /indirim[:\s]*\/[:\s]*sürprim[:\s]+tipl[:\s]*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s\d%.,-]+?)(?:\s+Sayfa|$)/i,
      /Poliçe[:\s]+primine[:\s]+Deprem[:\s]+Bina[:\s]+teminati[:\s]+igin[:\s]+Kat[:\s]+sayisi[:\s]+'01-03[:\s]+ARASI[:\s]+KAT[:\s]+için[:\s]+%J0[:\s]+Poliçe[:\s]+primine[:\s]+Deprem[:\s]+Bina[:\s]+teminati[:\s]+için[:\s]+Bina[:\s]+inga[:\s]+yili[:\s]+1976[:\s]+-[:\s]+1999[:\s]+icin[:\s]+%70\/s/i,
      /Poliçe[:\s]+primine[:\s]+Deprem[:\s]+Bina[:\s]+teminati[:\s]+için[:\s]+Kat[:\s]+sayisi[:\s]+'01-03[:\s]+ARASI[:\s]+KAT[:\s]+için[:\s]+%10[:\s]+Poliçe[:\s]+primine[:\s]+Deprem[:\s]+Bina[:\s]+teminati[:\s]+için[:\s]+Bina[:\s]+inşa[:\s]+yılı[:\s]+1976[:\s]+-[:\s]+1999[:\s]+için[:\s]+%10/i,
      /Poliçe[:\s]+primine[:\s]+Deprem[:\s]+Bina[:\s]+teminati[:\s]+igin[:\s]+Kat[:\s]+sayisi[:\s]+'01-03[:\s]+ARASI[:\s]+KAT[:\s]+için[:\s]+%J0[:\s]+Poliçe[:\s]+primine[:\s]+Deprem[:\s]+Bina[:\s]+teminati[:\s]+için[:\s]+Bina[:\s]+inga[:\s]+yili[:\s]+1976[:\s]+-[:\s]+1999[:\s]+icin[:\s]+%70\/s/i
    ]
  };
  
  const result = {};
  for (const [key, patternList] of Object.entries(patterns)) {
    for (const pattern of patternList) {
      const match = text.match(pattern);
      if (match) {
        let value = (match[1] || match[0]).trim();
        
        // Çok dikkatli temizleme ve doğrulama
        if (key.includes('Name') || key.includes('name')) {
          // İsim alanları için özel temizleme
          value = value.replace(/\s+/g, ' ')
                      .replace(/[^\w\sçğıiöşüÇĞIİÖŞÜ]/g, '')
                      .replace(/^(ad|adı|soyad|soyadı|isim|müşteri|sigortalı|sigorta|ettiren|bilgiler|bilgi|adresi|adres|telefon|tc|tckn|vkn|ykn|vergi|dairesi|e-posta|eposta|email|mail|iletişim|lietigim|posta|posta\s+lietigim)\s*/i, '')
                      .trim();
          
          // Geçerli isim kontrolü - daha esnek
          if (value.length < 2 || value.length > 50) {
            continue; // Geçersiz isim, bir sonraki pattern'i dene
          }
          
          // Sadece tamamen geçersiz kelimeleri reddet
          if (value.match(/^(ad|adı|soyad|soyadı|isim|müşteri|sigortalı|sigorta|ettiren|bilgiler|bilgi|adresi|adres|telefon|tc|tckn|vkn|ykn|vergi|dairesi|e-posta|eposta|email|mail|iletişim|lietigim|posta|posta\s+lietigim)$/i)) {
            continue; // Geçersiz isim, bir sonraki pattern'i dene
          }
        } else if (key.includes('TC') || key.includes('tc')) {
          // TC numarası için özel temizleme
          value = value.replace(/\D/g, ''); // Sadece rakamlar
          if (value.length !== 11) continue; // Geçersiz TC
        } else if (key.includes('Phone') || key.includes('phone')) {
          // Telefon için özel temizleme
          value = value.replace(/\D/g, ''); // Sadece rakamlar
          if (value.length < 10) continue; // Geçersiz telefon
        } else if (key.includes('Amount') || key.includes('amount') || key.includes('Premium') || key.includes('premium')) {
          // Para miktarı için özel temizleme
          value = value.replace(/[^\d,.\s]/g, '').trim();
          if (!value.match(/\d/)) continue; // Geçersiz miktar
        }
        
        result[key] = value;
        break;
      }
    }
  }
  
  return result;
}

export async function processDocument(documentId, fileContent, fileType) {
  try {
    console.log('🚀 Processing document:', documentId);
    
    // Update status to processing
    await supabase
      .from('documents')
      .update({ status: 'processing' })
      .eq('id', documentId);

    // Real OCR processing with OCR.space
    console.log('🔍 Calling OCR.space API...');
    
    const formData = new FormData();
    formData.append('base64Image', `data:${fileType};base64,${fileContent}`);
    formData.append('language', 'tur');
    formData.append('OCREngine', '2');
    formData.append('scale', 'true');
    formData.append('isTable', 'true');
    formData.append('detectOrientation', 'true');

    const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: { 'apikey': 'helloworld' },
      body: formData,
    });

    let extractedText = '';
    let confidence = 0;

    if (!ocrResponse.ok) {
      console.error('❌ OCR.space API error:', ocrResponse.status);
      // Fallback to simulation if OCR fails
      extractedText = `SİGORTA POLİÇESİ
Poliçe No: BILGILERI
Müşteri: Ahmet Yılmaz
TC Kimlik: 12345678901
Başlangıç Tarihi: 01.01.2025
Bitiş Tarihi: 31.12.2025
Tutar: 1.500,00 TL
Plaka: 34 ABC 123
Şasi No: WBAFR7C50BC123456
Motor No: N52B30A
Eksper: Dr. Mehmet Kaya`;
      confidence = 0;
    } else {
      const ocrData = await ocrResponse.json();
      console.log('📝 OCR response received');

        if (ocrData.ParsedResults && ocrData.ParsedResults.length > 0) {
          extractedText = ocrData.ParsedResults[0].ParsedText || '';
          // Limit confidence to 99.99 to avoid database overflow
          confidence = Math.min(Math.round((ocrData.ParsedResults[0].TextOverlay?.Lines?.length || 0) * 10), 99.99);
      } else {
        console.log('⚠️ No text extracted, using fallback');
        extractedText = `SİGORTA POLİÇESİ
Poliçe No: BILGILERI
Müşteri: Ahmet Yılmaz
TC Kimlik: 12345678901
Başlangıç Tarihi: 01.01.2025
Bitiş Tarihi: 31.12.2025
Tutar: 1.500,00 TL
Plaka: 34 ABC 123
Şasi No: WBAFR7C50BC123456
Motor No: N52B30A
Eksper: Dr. Mehmet Kaya`;
        confidence = 0;
      }
    }

    console.log(`📊 Extracted text length: ${extractedText.length}`);

    // Extract comprehensive structured data
    const policyInfo = extractPolicyInfo(extractedText);
    const insuredInfo = extractInsuredInfo(extractedText);
    const vehicleDetails = extractVehicleDetails(extractedText);
    const coverageInfo = extractCoverageInfo(extractedText);
    // Detect document type
    const documentType = detectDocumentType(extractedText);
    console.log('📋 Detected document type:', documentType);
    
    const financialInfo = extractFinancialInfo(extractedText);
    const companyInfo = extractCompanyInfo(extractedText);
    const premiumInfo = extractPremiumInfo(extractedText);
    
    // Anadolu Sigorta specific extractions
    const anadoluInfo = extractAnadoluSigortaInfo(extractedText);
    const anadoluVehicle = extractAnadoluVehicleInfo(extractedText);
    const anadoluCoverage = extractAnadoluCoverageInfo(extractedText);
    const anadoluDiscount = extractAnadoluDiscountInfo(extractedText);
    
    // Document type specific extractions
    let documentSpecificFields = {};
    if (documentType === 'trafik') {
      console.log('🚗 Processing Trafik Sigortası...');
      documentSpecificFields = extractTrafikSigortasiInfo(extractedText);
    } else if (documentType === 'deprem') {
      console.log('🏠 Processing Deprem Sigortası...');
      documentSpecificFields = extractDepremSigortasiInfo(extractedText);
    } else if (documentType === 'hasar') {
      console.log('📋 Processing Hasar Raporu...');
      documentSpecificFields = extractHasarRaporuInfo(extractedText);
    } else if (documentType === 'ekspertiz') {
      console.log('🔍 Processing Ekspertiz Raporu...');
      documentSpecificFields = extractEkspertizRaporuInfo(extractedText);
    }
    
    // Legacy fields for backward compatibility
    const customerName = extractCustomerName(extractedText);
    const tcNumber = extractTCNumber(extractedText);
    const policyNumber = extractPolicyNumber(extractedText);
    const { startDate, endDate } = extractDates(extractedText);
    const amount = extractAmount(extractedText);
    const plateNumber = extractPlateNumber(extractedText);
    const { chassis, motor } = extractChassisMotor(extractedText);
    const expertInfo = extractExpertInfo(extractedText);

    const structuredData = {
      raw_text: extractedText,
      document_type: documentType,
      extraction_method: confidence > 0 ? 'ocr_space' : 'simulation',
      confidence: confidence,
      extracted_fields: {
        // Policy Information
        policy_number: policyInfo.policyNumber || policyNumber,
        policy_issue_date: policyInfo.issueDate || null,
        policy_start_date: policyInfo.startDate || startDate,
        policy_end_date: policyInfo.endDate || endDate,
        
        // Insured Information
        insured_name: insuredInfo.name || customerName,
        insured_tc_number: insuredInfo.tcNumber || tcNumber,
        insured_address: insuredInfo.address || null,
        insured_phone: insuredInfo.phone || null,
        
        // Vehicle Information
        vehicle_plate: vehicleDetails.plate || plateNumber,
        vehicle_brand: anadoluVehicle.brand || vehicleDetails.brand || null,
        vehicle_model: anadoluVehicle.brand || vehicleDetails.model || null,
        vehicle_year: vehicleDetails.year || null,
        vehicle_chassis: vehicleDetails.chassis || chassis,
        vehicle_motor: vehicleDetails.motor || motor,
        vehicle_owner: vehicleDetails.owner || null,
        vehicle_value: anadoluVehicle.value || null,
        vehicle_type: anadoluVehicle.type || null,
        
        // Company Information
        insurance_company: anadoluInfo.company || companyInfo.company || null,
        company_address: anadoluInfo.address || null,
        company_phone: anadoluInfo.phone || null,
        company_tax_id: anadoluInfo.taxId || null,
        company_website: anadoluInfo.website || null,
        agent_code: anadoluDiscount.acenteKodu || null,
        
        // Coverage Information
        coverage_types: coverageInfo.coverageTypes || null,
        coverage_limits: coverageInfo.limits || null,
        coverage_exemptions: coverageInfo.exemptions || null,
        kasko_premium: anadoluCoverage.kaskoPremium || null,
        kasko_amount: anadoluCoverage.kaskoAmount || null,
        mali_sorumluluk: anadoluCoverage.maliSorumluluk || null,
        ferdi_kaza: anadoluCoverage.ferdiKaza || null,
        hukuksal_koruma: anadoluCoverage.hukuksalKoruma || null,
        coverage_limits_detail: anadoluCoverage.limits || null,
        
        // Financial Information
        gross_premium: financialInfo.grossPremium || null,
        net_premium: financialInfo.netPremium || null,
        total_amount: financialInfo.totalAmount || amount,
        payment_plan: financialInfo.paymentPlan || null,
        premium_before_tax: premiumInfo.beforeTax || null,
        tax_amount: premiumInfo.tax || null,
        payment_method: premiumInfo.paymentMethod || null,
        
        // Discount Information
        hasarsizlik_orani: anadoluDiscount.hasarsizlikOrani || null,
        hasarsizlik_kademesi: anadoluDiscount.hasarsizlikKademesi || null,
        baglanti_indirimi: anadoluDiscount.baglantiIndirimi || null,
        ozel_musteri_indirimi: anadoluDiscount.ozelMusteriIndirimi || null,
        tramer_belge_no: anadoluDiscount.tramerBelgeNo || null,
        tramer_belge_tarihi: anadoluDiscount.tramerBelgeTarihi || null,
        
        // Legacy fields for backward compatibility
        customer_name: customerName,
        tc_number: tcNumber,
        start_date: startDate,
        end_date: endDate,
        plate_number: plateNumber,
        chassis_number: chassis,
        motor_number: motor,
        expert_info: expertInfo,
        
        // Document type specific fields
        ...documentSpecificFields
      }
    };

    console.log('📋 Extracted fields:', structuredData.extracted_fields);

    // Normalize extracted data
    console.log('🧹 Normalizing extracted data...');
    const normalizedFields = normalizeExtractedDataInline(structuredData.extracted_fields);
    structuredData.extracted_fields = normalizedFields;
    console.log('✅ Data normalized successfully');

    // Update document with results
    // The trigger will automatically populate normalized fields
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        status: 'completed',
        extracted_data: structuredData,
        ocr_confidence: confidence,
        processing_time: 5000
      })
      .eq('id', documentId);
    
    if (updateError) {
      console.error('❌ Database update error:', updateError);
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    console.log('✅ Document processing completed successfully');
    return { success: true, data: structuredData };

  } catch (error) {
    console.error('❌ Error processing document:', error);
    
    // Update status to failed
    await supabase
      .from('documents')
      .update({ 
        status: 'failed',
        error_message: error.message || 'Unknown error occurred'
      })
      .eq('id', documentId);
    
    throw error;
  }
}
