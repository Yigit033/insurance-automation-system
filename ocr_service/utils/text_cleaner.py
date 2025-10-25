import re
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

def extract_structured_data(text: str) -> Dict[str, Any]:
    """
    Extract structured data from OCR text for insurance documents
    
    Args:
        text: Cleaned OCR text
    
    Returns:
        Dictionary with extracted fields
    """
    data = {}
    
    try:
        # Extract policy number
        policy_patterns = [
            r'Poliçe\s*No[:\s]+([A-Z0-9\-]+)',
            r'Policy\s*Number[:\s]+([A-Z0-9\-]+)',
            r'Poliçe\s*Numarası[:\s]+([A-Z0-9\-]+)'
        ]
        for pattern in policy_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                data['policy_number'] = match.group(1).strip()
                break
        
        # Extract TC number
        tc_pattern = r'\b([0-9]{11})\b'
        tc_matches = re.findall(tc_pattern, text)
        if tc_matches:
            data['tc_number'] = tc_matches[0]
        
        # Extract dates
        date_pattern = r'(\d{2}[\./-]\d{2}[\./-]\d{4})'
        dates = re.findall(date_pattern, text)
        if dates:
            data['dates'] = dates
        
        # Extract phone numbers
        phone_pattern = r'(\+?90\s?)?(\d{3})\s?(\d{3})\s?(\d{2})\s?(\d{2})'
        phones = re.findall(phone_pattern, text)
        if phones:
            data['phone_numbers'] = [''.join(p) for p in phones]
        
        # Extract amounts (currency)
        amount_pattern = r'(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(?:TL|₺)'
        amounts = re.findall(amount_pattern, text)
        if amounts:
            data['amounts'] = amounts
        
        # Extract names (simplified)
        name_pattern = r'(?:Adı?\s*Soyadı?|İsim)[:\s]+([A-ZÇĞİÖŞÜ][a-zçğıöşü]+(?:\s+[A-ZÇĞİÖŞÜ][a-zçğıöşü]+)+)'
        name_match = re.search(name_pattern, text, re.IGNORECASE)
        if name_match:
            data['name'] = name_match.group(1).strip()
        
        logger.info(f"Extracted {len(data)} structured fields")
        
    except Exception as e:
        logger.error(f"Structured data extraction error: {str(e)}")
    
    return data


def normalize_field(field_name: str, value: str) -> str:
    """
    Normalize specific field values
    
    Args:
        field_name: Name of the field
        value: Raw value
    
    Returns:
        Normalized value
    """
    if not value:
        return value
    
    # Normalize dates
    if 'date' in field_name.lower():
        value = re.sub(r'[\./-]', '.', value)
    
    # Normalize phone numbers
    if 'phone' in field_name.lower() or 'tel' in field_name.lower():
        value = re.sub(r'[^\d+]', '', value)
    
    # Normalize amounts
    if 'amount' in field_name.lower() or 'price' in field_name.lower():
        value = re.sub(r'[^\d,.]', '', value)
    
    return value.strip()
