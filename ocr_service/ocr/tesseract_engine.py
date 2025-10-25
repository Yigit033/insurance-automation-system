from PIL import Image
import pytesseract
import io
import logging

logger = logging.getLogger(__name__)

def extract_text(file_bytes: bytes) -> str:
    """
    Extract text from image using Tesseract OCR with Turkish language support
    
    Args:
        file_bytes: Image file content as bytes
    
    Returns:
        Extracted text string
    """
    try:
        # Open image from bytes
        image = Image.open(io.BytesIO(file_bytes))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Configure Tesseract for Turkish language with custom settings
        custom_config = r'--oem 3 --psm 6'
        
        # Extract text with Turkish language support
        text = pytesseract.image_to_string(
            image, 
            lang='tur+eng',  # Turkish + English
            config=custom_config
        )
        
        logger.info(f"Tesseract extracted {len(text)} characters")
        
        return text.strip()
        
    except Exception as e:
        logger.error(f"Tesseract extraction error: {str(e)}")
        raise Exception(f"Tesseract OCR failed: {str(e)}")
