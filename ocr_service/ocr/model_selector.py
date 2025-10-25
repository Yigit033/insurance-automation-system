import logging

logger = logging.getLogger(__name__)

def select_best_engine(filename: str) -> str:
    """
    Select the best OCR engine based on file type and characteristics
    
    Args:
        filename: Name of the uploaded file
    
    Returns:
        Engine name ('tesseract' or 'paddle')
    """
    filename_lower = filename.lower()
    
    # Use Tesseract for Turkish documents (better Turkish support)
    if any(ext in filename_lower for ext in ['.pdf', '.tif', '.tiff']):
        logger.info("Selected Tesseract for document file")
        return 'tesseract'
    
    # Use PaddleOCR for photos and scanned images (better for complex layouts)
    if any(ext in filename_lower for ext in ['.jpg', '.jpeg', '.png']):
        logger.info("Selected PaddleOCR for image file")
        return 'paddle'
    
    # Default to Tesseract
    logger.info("Selected Tesseract as default")
    return 'tesseract'
