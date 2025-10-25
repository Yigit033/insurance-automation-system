// Missing extraction functions to be added to useDocuments.ts

// Add these functions before the main useDocuments hook

function extractPolicyholderStatus(text: string): string | null {
  const patterns = [
    /Sigorta\s+Ettiren\s+Sıfatı?\s*:?\s*([A-ZÇĞİÖŞÜ\s\-]+)/i,
    /Poliçe\s+Sahibi\s+Sıfatı?\s*:?\s*([A-ZÇĞİÖŞÜ\s\-]+)/i,
    /(?:Mal\s+Sahibi|Owner)\s*:?\s*([A-ZÇĞİÖŞÜ\s\-]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const status = match[1].trim();
      if (status.length > 2) return status;
    }
  }
  
  return null;
}

function extractPolicyholderPhone(text: string): string | null {
  const patterns = [
    /Sigorta\s+Ettiren[\s\S]{0,100}?(?:Cep|Sabit)\s*Telefonu\s*:?\s*\(?([0-9\-\s\*\(\)]+)\)?/i,
    /Poliçe\s+Sahibi[\s\S]{0,100}?Telefon\s*:?\s*\(?([0-9\-\s\*\(\)]+)\)?/i,
    /(?:Cep|Mobile)\s*Telefonu\s*:?\s*\(?([0-9\-\s\*\(\)]+)\)?/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const phone = match[1].trim();
      const digitCount = phone.replace(/[^0-9]/g, '').length;
      if (digitCount >= 7) return phone;
    }
  }
  
  return null;
}

function extractCompanyPhone(text: string): string | null {
  const patterns = [
    /:\(([0-9]{3})\)([0-9]{3})-([0-9]{2})-([0-9]{2})/,
    /Telefon\s*:?\s*\(?0?(\d{3})\)?[\s\-]?(\d{3})[\s\-]?(\d{2})[\s\-]?(\d{2})/i,
    /Tel\s*:?\s*\(?0?(\d{3})\)?[\s\-]?(\d{3})[\s\-]?(\d{2})[\s\-]?(\d{2})/i,
    /\((\d{3})\)(\d{3})[\-]?(\d{2})[\-]?(\d{2})/,
    /Sabit\s*Telefonu\s*:?\s*\(?(\d{3})\)?[\s\-]?(\d{3,4})[\s\-]?(\d{2})[\s\-]?(\d{2})/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (match.length === 5) {
        return `(${match[1]})${match[2]}-${match[3]}-${match[4]}`;
      }
      if (match[1]) return match[1].trim();
    }
  }
  
  return null;
}

function extractBuildingCoverage(text: string): string | null {
  const patterns = [
    /Bina\s*Teminatı?\s*:?\s*([A-ZÇĞİÖŞÜ\s]+)/i,
    /DEPREM\s+BINA/i,
    /Building\s+Coverage\s*:?\s*([A-ZÇĞİÖŞÜ\s]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[0].includes('DEPREM BINA')) return 'DEPREM BINA';
      if (match[1]) return match[1].trim();
    }
  }
  
  return null;
}

function extractAgencyNumber(text: string): string | null {
  const patterns = [
    /Acente\s+(?:Kodu|No)\s*:?\s*(\d{5,10})/i,
    /Agency\s+(?:Code|Number)\s*:?\s*(\d{5,10})/i,
    /Acente\s+Numarası\s*:?\s*(\d{5,10})/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

function extractRenewalNumber(text: string): string | null {
  const patterns = [
    /Yenileme\s+No\s*:?\s*(\d+)/i,
    /Renewal\s+(?:No|Number)\s*:?\s*(\d+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

function extractDiscountInfo(text: string): string | null {
  const patterns = [
    /İndirim\/Süprim\s*:?\s*([^\n]+)/i,
    /Discount\s*:?\s*([^\n]+)/i,
    /İndirim\s+Bilgileri\s*:?\s*([^\n]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const info = match[1].trim();
      if (info.length > 2) return info;
    }
  }
  
  return null;
}

function extractBuildingCode(text: string): string | null {
  const patterns = [
    /Bina\s+Kodu\s*:?\s*(\d{6,10})/i,
    /Building\s+Code\s*:?\s*(\d{6,10})/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

function extractAddressCode(text: string): string | null {
  const patterns = [
    /Adres\s+Kodu\s*:?\s*(\d{8,12})/i,
    /Address\s+Code\s*:?\s*(\d{8,12})/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

function extractBuildingTypeAdvanced(text: string): string | null {
  const patterns = [
    /Yapı\s+Tarzı\s*:?\s*([A-ZÇĞİÖŞÜ\s]+)/i,
    /Bina\s+Kullanım\s+Şekli\s*:?\s*([A-ZÇĞİÖŞÜ\s]+)/i,
    /(?:MESKEN|İŞYERİ|TİCARİ)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[0].includes('MESKEN')) return 'MESKEN';
      if (match[1]) return match[1].trim();
    }
  }
  
  return null;
}

function extractBuildingYear(text: string): string | null {
  const patterns = [
    /Bina\s+İnşa\s+Yılı\s*:?\s*(\d{4})/i,
    /(?:1976|1977|1978|1979|1980|1981|1982|1983|1984|1985|1986|1987|1988|1989|1990|1991|1992|1993|1994|1995|1996|1997|1998|1999|2000|2001|2002|2003|2004|2005|2006|2007|2008|2009|2010|2011|2012|2013|2014|2015|2016|2017|2018|2019|2020|2021|2022|2023|2024|2025)\s*-\s*(\d{4})/
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[2]) return `${match[1]}-${match[2]}`;
      if (match[1]) return match[1].trim();
    }
  }
  
  return null;
}

function extractApartmentArea(text: string): string | null {
  const patterns = [
    /Daire\s+Brüt\s+Yüzölçümü\s*:?\s*(\d+)/i,
    /(?:Alan|Area)\s*:?\s*(\d+)\s*m2/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

function extractFloorLocation(text: string): string | null {
  const patterns = [
    /Bulunduğu\s+Kat\s*:?\s*([A-ZÇĞİÖŞÜ0-9\s]+)/i,
    /Kat\s*:?\s*(ZEMİN|BODRUM|\d+)/i,
    /Floor\s*:?\s*([A-Z0-9]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return null;
}

function extractDamageStatus(text: string): string | null {
  const patterns = [
    /Hasar\s+Durumu\s*:?\s*([A-ZÇĞİÖŞÜ\s]+)/i,
    /(?:HASARSIZ|HASARLI)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[0].includes('HASARSIZ')) return 'HASARSIZ';
      if (match[0].includes('HASARLI')) return 'HASARLI';
      if (match[1]) return match[1].trim();
    }
  }
  
  return null;
}

function extractProvince(text: string): string | null {
  const provinces = [
    'ADANA', 'ADIYAMAN', 'AFYONKARAHİSAR', 'AĞRI', 'AKSARAY', 'AMASYA', 'ANKARA', 'ANTALYA',
    'ARDAHAN', 'ARTVİN', 'AYDIN', 'BALIKESİR', 'BARTIN', 'BATMAN', 'BAYBURT', 'BİLECİK',
    'BİNGÖL', 'BİTLİS', 'BOLU', 'BURDUR', 'BURSA', 'ÇANAKKALE', 'ÇANKIRI', 'ÇORUM',
    'DENİZLİ', 'DİYARBAKIR', 'DÜZCE', 'EDİRNE', 'ELAZIĞ', 'ERZİNCAN', 'ERZURUM', 'ESKİŞEHİR',
    'GAZİANTEP', 'GİRESUN', 'GÜMÜŞHANE', 'HAKKARİ', 'HATAY', 'IĞDIR', 'ISPARTA', 'İSTANBUL',
    'İZMİR', 'KAHRAMANMARAŞ', 'KARABÜK', 'KARAMAN', 'KARS', 'KASTAMONU', 'KAYSERİ', 'KIRIKKALE',
    'KIRKLARELİ', 'KIRŞEHİR', 'KİLİS', 'KOCAELİ', 'KONYA', 'KÜTAHYA', 'MALATYA', 'MANİSA',
    'MARDİN', 'MERSİN', 'MUĞLA', 'MUŞ', 'NEVŞEHİR', 'NİĞDE', 'ORDU', 'OSMANİYE', 'RİZE',
    'SAKARYA', 'SAMSUN', 'SİİRT', 'SİNOP', 'SİVAS', 'ŞANLIURFA', 'ŞIRNAK', 'TEKİRDAĞ',
    'TOKAT', 'TRABZON', 'TUNCELİ', 'UŞAK', 'VAN', 'YALOVA', 'YOZGAT', 'ZONGULDAK'
  ];
  
  const textUpper = text.toUpperCase();
  for (const province of provinces) {
    if (textUpper.includes(province)) {
      return province;
    }
  }
  
  return null;
}

function extractInsuredAddress(text: string): string | null {
  const patterns = [
    /SİGORTALI\s+YERE\s+AİT\s+BİLGİLER[\s\S]{0,150}?Adres\s*\n\s*([A-ZÇĞIİÖŞÜ0-9\s\.\,\-\/]+?)(?=\s*\n\s*Bina)/i,
    /İletişim\s+Adresi\s*:?\s*([A-ZÇĞIİÖŞÜ0-9\s\.\,\-\/]+?)(?=\s*\n)/i,
    /Adres\s*:?\s*([A-ZÇĞIİÖŞÜ0-9\s\.\,\-\/]+?)(?=\s*\n)/i
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

function extractInsuredPhone(text: string): string | null {
  const patterns = [
    /SİGORTALI\s+BİLGİLERİ[\s\S]{0,200}?Cep\s+Telefonu\s*[\n:]+\s*\(?([0-9\-\s\*\(\)]+)\)?/i,
    /Cep\s+Telefonu\s*[\n:]+\s*\(?([0-9\-\s\*\(\)]+)\)?/i,
    /(?:Mobile|Cep Tel)\s*:?\s*\(?([0-9\-\s\*\(\)]+)\)?/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const phone = match[1].trim();
      const digitCount = phone.replace(/[^0-9]/g, '').length;
      if (digitCount >= 7) return phone;
    }
  }
  
  return null;
}
