from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from typing import Optional
import time

from ocr.tesseract_engine import extract_text as tesseract_extract
from ocr.paddleocr_engine import extract_text as paddle_extract
from ocr.model_selector import select_best_engine
from utils.postprocess import clean_text
from utils.preprocess import preprocess_image

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Insurance OCR Service",
    description="AI-powered OCR service for Turkish insurance documents",
    version="1.0.0"
)

# CORS configuration for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "service": "Insurance OCR API",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": time.time()}

@app.post("/ocr")
async def process_ocr(
    file: UploadFile = File(...),
    engine: Optional[str] = "auto",
    clean: Optional[bool] = True
):
    """
    Process uploaded document with OCR
    
    Args:
        file: Uploaded image/PDF file
        engine: OCR engine to use ('tesseract', 'paddle', or 'auto')
        clean: Whether to apply AI text cleaning
    
    Returns:
        JSON with extracted and cleaned text
    """
    try:
        start_time = time.time()
        logger.info(f"Processing file: {file.filename}")
        
        # Read file content
        content = await file.read()
        
        # Check if content is base64 encoded
        import base64
        try:
            # Try to decode as base64 if it looks like base64
            if isinstance(content, bytes) and len(content) > 0:
                # Check if it starts with data:image or data:application
                if content.startswith(b'data:'):
                    # Extract base64 part after comma
                    base64_start = content.find(b',') + 1
                    if base64_start > 0:
                        content = base64.b64decode(content[base64_start:])
                        logger.info("Decoded base64 data URL")
                # Check if it's pure base64 (no binary header)
                elif not content.startswith(b'%PDF') and not content.startswith(b'\xff\xd8'):
                    try:
                        decoded = base64.b64decode(content)
                        # Verify it's valid image/PDF data
                        if decoded.startswith(b'%PDF') or decoded.startswith(b'\xff\xd8') or decoded.startswith(b'\x89PNG'):
                            content = decoded
                            logger.info("Decoded base64 content")
                    except:
                        pass  # Not base64, use as is
        except Exception as e:
            logger.warning(f"Base64 decode check failed: {e}, using content as-is")
        
        # Preprocess image
        processed_content = preprocess_image(content)
        
        # Select and run OCR engine
        if engine == "auto":
            engine = select_best_engine(file.filename)
        
        if engine == "tesseract":
            text = tesseract_extract(processed_content)
        elif engine == "paddle":
            text = paddle_extract(processed_content)
        else:
            text = tesseract_extract(processed_content)
        
        # Clean text with AI if requested
        if clean:
            text = clean_text(text)
        
        processing_time = time.time() - start_time
        
        logger.info(f"OCR completed in {processing_time:.2f}s")
        
        return {
            "success": True,
            "text": text,
            "engine": engine,
            "processing_time": processing_time,
            "filename": file.filename
        }
        
    except Exception as e:
        logger.error(f"OCR processing error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
