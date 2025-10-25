# Custom OCR Service - Insurance Automation System

## Overview

This is a Python-based AI-powered OCR microservice designed specifically for processing Turkish insurance documents. It replaces the OCR.space API with a custom solution that provides:

- **Better Turkish language support** using Tesseract and PaddleOCR
- **AI-powered text cleaning** for improved accuracy
- **Flexible engine selection** (automatic, Tesseract, or PaddleOCR)
- **Image preprocessing** for better OCR results
- **Structured data extraction** for insurance documents

## Architecture

```
ocr_service/
├── app.py                    # FastAPI main application
├── requirements.txt          # Python dependencies
├── ocr/
│   ├── tesseract_engine.py  # Tesseract OCR implementation
│   ├── paddleocr_engine.py  # PaddleOCR implementation
│   └── model_selector.py    # Automatic engine selection
└── utils/
    ├── preprocess.py         # Image preprocessing
    ├── postprocess.py        # Text cleaning and normalization
    └── text_cleaner.py       # Structured data extraction
```

## Prerequisites

### System Requirements

1. **Python 3.9+**
2. **Tesseract OCR** installed on your system
3. **Turkish language data** for Tesseract

### Installing Tesseract

#### Windows
```bash
# Download and install from:
# https://github.com/UB-Mannheim/tesseract/wiki

# Add Tesseract to PATH
# Default location: C:\Program Files\Tesseract-OCR
```

#### macOS
```bash
brew install tesseract
brew install tesseract-lang  # For Turkish support
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr
sudo apt-get install tesseract-ocr-tur  # Turkish language pack
```

## Installation

### 1. Navigate to OCR Service Directory
```bash
cd ocr_service
```

### 2. Create Virtual Environment (Recommended)
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

**Note:** Installation may take 5-10 minutes due to large dependencies (PyTorch, PaddleOCR).

### 4. Verify Installation
```bash
python -c "import pytesseract; print('Tesseract OK')"
python -c "from paddleocr import PaddleOCR; print('PaddleOCR OK')"
```

## Running the Service

### Development Mode
```bash
cd ocr_service
uvicorn app:app --reload --port 8000
```

The service will be available at: `http://localhost:8000`

### Production Mode
```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --workers 4
```

### Using Gunicorn (Production)
```bash
pip install gunicorn
gunicorn app:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## API Endpoints

### 1. Health Check
```bash
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": 1234567890.123
}
```

### 2. Process OCR
```bash
POST /ocr
```

**Parameters:**
- `file` (required): Image file to process
- `engine` (optional): OCR engine ('tesseract', 'paddle', or 'auto')
- `clean` (optional): Apply AI text cleaning (default: true)

**Example using cURL:**
```bash
curl -X POST "http://localhost:8000/ocr" \
  -F "file=@document.jpg" \
  -F "engine=auto" \
  -F "clean=true"
```

**Response:**
```json
{
  "success": true,
  "text": "Extracted text content...",
  "engine": "tesseract",
  "processing_time": 2.34,
  "filename": "document.jpg"
}
```

## Frontend Integration

### 1. Update Environment Variables

Add to your `.env` file:
```env
VITE_USE_CUSTOM_OCR=true
VITE_OCR_API_URL=http://localhost:8000
```

### 2. The Integration is Already Done

The frontend (`src/hooks/useDocuments.ts`) has been updated to:
- Use custom OCR service when `VITE_USE_CUSTOM_OCR=true`
- Automatically fall back to OCR.space if custom service fails
- Check service health before processing

## Testing

### Test with Sample Image
```bash
# From project root
curl -X POST "http://localhost:8000/ocr" \
  -F "file=@test_document.jpg"
```

### Test Health Endpoint
```bash
curl http://localhost:8000/health
```

### Test from Frontend
1. Start the OCR service: `cd ocr_service && uvicorn app:app --reload`
2. Start the React app: `npm run dev`
3. Upload a document through the UI
4. Check browser console for OCR service logs

## Deployment

### Option 1: Render.com

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `pip install -r ocr_service/requirements.txt`
4. Set start command: `cd ocr_service && uvicorn app:app --host 0.0.0.0 --port $PORT`
5. Add environment variables if needed

### Option 2: Railway.app

1. Create new project on Railway
2. Connect repository
3. Railway will auto-detect Python and install dependencies
4. Set start command in `Procfile`:
```
web: cd ocr_service && uvicorn app:app --host 0.0.0.0 --port $PORT
```

### Option 3: Hugging Face Spaces

1. Create a new Space (Gradio or Streamlit)
2. Upload your code
3. Add `requirements.txt`
4. Hugging Face will handle deployment

### Option 4: Docker

Create `Dockerfile` in `ocr_service/`:
```dockerfile
FROM python:3.9-slim

# Install Tesseract
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-tur \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:
```bash
docker build -t insurance-ocr .
docker run -p 8000:8000 insurance-ocr
```

## Performance Optimization

### 1. Use GPU (if available)
In `paddleocr_engine.py`, change:
```python
ocr = PaddleOCR(use_gpu=True, ...)
```

### 2. Adjust Worker Count
```bash
uvicorn app:app --workers 4  # Adjust based on CPU cores
```

### 3. Enable Caching
Add Redis caching for frequently processed documents.

## Troubleshooting

### Issue: "Tesseract not found"
**Solution:** 
- Ensure Tesseract is installed and in PATH
- On Windows, add `C:\Program Files\Tesseract-OCR` to PATH

### Issue: "Turkish language not available"
**Solution:**
```bash
# Download Turkish language data
# https://github.com/tesseract-ocr/tessdata
# Place tur.traineddata in Tesseract's tessdata folder
```

### Issue: "PaddleOCR installation fails"
**Solution:**
```bash
# Install CPU version only
pip install paddlepaddle==2.6.0 -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### Issue: "CORS errors in browser"
**Solution:** The service already has CORS enabled. Ensure the frontend URL is in the `allow_origins` list in `app.py`.

## Future Enhancements

- [ ] Add document classification (policy type detection)
- [ ] Implement LayoutLMv3 for layout-aware parsing
- [ ] Add batch processing endpoint
- [ ] Implement caching with Redis
- [ ] Add support for PDF documents
- [ ] Create admin dashboard for monitoring
- [ ] Add authentication/API keys
- [ ] Implement rate limiting

## Support

For issues or questions:
1. Check the logs: `uvicorn app:app --log-level debug`
2. Verify Tesseract installation: `tesseract --version`
3. Test with simple images first
4. Check network connectivity between frontend and OCR service

## License

This OCR service is part of the Insurance Automation System project.
