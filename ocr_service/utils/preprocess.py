import cv2
import numpy as np
from PIL import Image
import io
import logging

logger = logging.getLogger(__name__)

def preprocess_image(file_bytes: bytes) -> bytes:
    """
    Preprocess image to improve OCR accuracy
    Supports both images and PDFs
    
    Args:
        file_bytes: Original image or PDF bytes
    
    Returns:
        Preprocessed image bytes
    """
    try:
        # Check if it's a PDF
        if file_bytes[:4] == b'%PDF':
            logger.info("Detected PDF file, converting to image...")
            try:
                from pdf2image import convert_from_bytes
                # Convert PDF to images (first page only)
                images = convert_from_bytes(file_bytes, first_page=1, last_page=1)
                if images:
                    # Convert PIL Image to bytes
                    img_byte_arr = io.BytesIO()
                    images[0].save(img_byte_arr, format='PNG')
                    file_bytes = img_byte_arr.getvalue()
                    logger.info("PDF converted to image successfully")
            except ImportError:
                logger.error("pdf2image not installed. Install with: pip install pdf2image")
                return file_bytes
            except Exception as e:
                logger.error(f"PDF conversion error: {str(e)}")
                return file_bytes
        
        # Convert bytes to numpy array
        nparr = np.frombuffer(file_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            logger.warning("Could not decode image, returning original")
            return file_bytes
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Apply denoising
        denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
        
        # Apply adaptive thresholding
        thresh = cv2.adaptiveThreshold(
            denoised, 255, 
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )
        
        # Deskew if needed
        coords = np.column_stack(np.where(thresh > 0))
        if len(coords) > 0:
            angle = cv2.minAreaRect(coords)[-1]
            if angle < -45:
                angle = -(90 + angle)
            else:
                angle = -angle
            
            if abs(angle) > 0.5:  # Only deskew if angle is significant
                (h, w) = thresh.shape[:2]
                center = (w // 2, h // 2)
                M = cv2.getRotationMatrix2D(center, angle, 1.0)
                thresh = cv2.warpAffine(
                    thresh, M, (w, h),
                    flags=cv2.INTER_CUBIC,
                    borderMode=cv2.BORDER_REPLICATE
                )
        
        # Convert back to bytes
        is_success, buffer = cv2.imencode(".png", thresh)
        if is_success:
            logger.info("Image preprocessing completed")
            return buffer.tobytes()
        else:
            logger.warning("Could not encode processed image, returning original")
            return file_bytes
            
    except Exception as e:
        logger.error(f"Preprocessing error: {str(e)}")
        return file_bytes
