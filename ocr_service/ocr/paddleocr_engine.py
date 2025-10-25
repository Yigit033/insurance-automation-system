from paddleocr import PaddleOCR
import io
from PIL import Image
import numpy as np
import logging

logger = logging.getLogger(__name__)

# Initialize PaddleOCR with Turkish language support
ocr = PaddleOCR(
    use_angle_cls=True,
    det_model_dir=r"C:\paddle_models\ocr\det\en_PP-OCRv3_det_infer",
    rec_model_dir=r"C:\paddle_models\ocr\rec\en_PP-OCRv3_rec_infer",
    cls_model_dir=r"C:\paddle_models\ocr\cls\ch_ppocr_mobile_v2.0_cls_infer",
    lang='en',
    use_gpu=False,
    show_log=False
)



def extract_text(file_bytes: bytes) -> str:
    """
    Extract text from image using PaddleOCR
    
    Args:
        file_bytes: Image file content as bytes
    
    Returns:
        Extracted text string
    """
    try:
        # Convert bytes to numpy array
        image = Image.open(io.BytesIO(file_bytes))
        img_array = np.array(image)
        
        # Run PaddleOCR
        result = ocr.ocr(img_array, cls=True)
        
        # Extract text from results
        text_lines = []
        if result and result[0]:
            for line in result[0]:
                if line and len(line) > 1:
                    text_lines.append(line[1][0])
        
        text = '\n'.join(text_lines)
        
        logger.info(f"PaddleOCR extracted {len(text)} characters")
        
        return text.strip()
        
    except Exception as e:
        logger.error(f"PaddleOCR extraction error: {str(e)}")
        raise Exception(f"PaddleOCR failed: {str(e)}")
