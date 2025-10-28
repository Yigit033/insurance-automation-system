# Insurance Automation System - Setup Guide

## 🚀 Quick Start Guide

This guide will help you set up the complete Insurance Automation System with the new custom Python OCR service.

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+
- **Tesseract OCR** installed
- **Git**

## Part 1: Frontend Setup (React + Vite)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

Edit `.env`:
```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Custom OCR Service
VITE_USE_CUSTOM_OCR=true
VITE_OCR_API_URL=http://localhost:8000

# Fallback OCR.space (optional)
VITE_OCR_PRIMARY_API_KEY=your_ocr_space_key
```

### 3. Run Development Server
```bash
npm run dev
```

Frontend will be available at: `http://localhost:5173`

## Part 2: Python OCR Service Setup

### 1. Install Tesseract OCR

#### Windows
1. Download installer: https://github.com/UB-Mannheim/tesseract/wiki
2. Install to default location: `C:\Program Files\Tesseract-OCR`
3. Add to PATH:
   - Search "Environment Variables" in Windows
   - Add `C:\Program Files\Tesseract-OCR` to PATH
4. Download Turkish language data:
   - Download `tur.traineddata` from https://github.com/tesseract-ocr/tessdata
   - Place in `C:\Program Files\Tesseract-OCR\tessdata\`

#### macOS
```bash
brew install tesseract
brew install tesseract-lang
```

#### Linux
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr tesseract-ocr-tur
```

### 2. Verify Tesseract Installation
```bash
tesseract --version
tesseract --list-langs  # Should show 'tur' for Turkish
```

### 3. Set Up Python Environment
```bash
cd ocr_service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Note:** Installation may take 5-10 minutes due to large packages (PyTorch, PaddleOCR).

### 4. Run OCR Service
```bash
# Make sure you're in ocr_service directory with venv activated
uvicorn app:app --reload --port 8000
```

OCR service will be available at: `http://localhost:8000`

### 5. Test OCR Service
Open a new terminal:
```bash
# Test health endpoint
curl http://localhost:8000/health

# Test with an image
curl -X POST "http://localhost:8000/ocr" \
  -F "file=@path/to/test_image.jpg"
```

## Part 3: Running Both Services Together

### Terminal 1 - OCR Service
```bash
cd ocr_service
venv\Scripts\activate  # or source venv/bin/activate on macOS/Linux
uvicorn app:app --reload --port 8000
```

### Terminal 2 - React Frontend
```bash
npm run dev
```

### Terminal 3 - Testing (Optional)
```bash
# Test the complete flow
curl http://localhost:8000/health
```

## Part 4: Testing the Integration

1. **Open the application**: Navigate to `http://localhost:5173`
2. **Upload a document**: Use the upload interface
3. **Check console logs**: 
   - Browser console should show: "Using custom Python OCR service"
   - OCR service terminal should show processing logs
4. **Verify results**: Check that text is extracted and displayed

## Deployment

### Frontend Deployment (Vercel)

1. **Push to GitHub**
```bash
git add .
git commit -m "Add custom OCR service"
git push
```

2. **Deploy to Vercel**
```bash
npm install -g vercel
vercel
```

3. **Set Environment Variables** in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_USE_CUSTOM_OCR=true`
   - `VITE_OCR_API_URL=https://your-ocr-service.com`

### OCR Service Deployment (Render.com)

**Option 1: Using render.yaml (Recommended)**

1. **Push to GitHub** with `render.yaml` file in root
2. **Create New Web Service** on Render.com
3. **Connect Repository**: Select `Yigit033/insurance-automation-system`
4. **Auto-detect**: Render will use `render.yaml` configuration
5. **Deploy**

**Option 2: Manual Configuration**

1. **Create New Web Service** on Render.com
2. **Connect Repository**: `Yigit033/insurance-automation-system`
3. **Configure Settings**:
   - **Name**: `insurance-ocr-service`
   - **Runtime**: `Python 3`
   - **Build Command**: `cd ocr_service && pip install -r requirements.txt`
   - **Start Command**: `cd ocr_service && uvicorn app:app --host 0.0.0.0 --port $PORT`
4. **Add Environment Variables**:
   - `PYTHON_VERSION`: `3.11.9`
5. **Deploy**

**Important Files for Render.com:**
- `ocr_service/runtime.txt` → Python version (3.11.9)
- `ocr_service/apt-packages.txt` → System dependencies (tesseract, poppler)
- `ocr_service/requirements.txt` → Python packages
- `render.yaml` → Deployment configuration

Update frontend `.env` with deployed OCR service URL:
```env
VITE_OCR_API_URL=https://your-ocr-service.onrender.com
```

## Troubleshooting

### Issue: "Tesseract not found"
**Solution:**
- Verify installation: `tesseract --version`
- Check PATH includes Tesseract directory
- Restart terminal after PATH changes

### Issue: "Turkish language not available"
**Solution:**
- Download `tur.traineddata` from https://github.com/tesseract-ocr/tessdata
- Place in Tesseract's tessdata folder
- Verify: `tesseract --list-langs`

### Issue: "Module not found" in Python
**Solution:**
```bash
# Ensure virtual environment is activated
cd ocr_service
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# Reinstall dependencies
pip install -r requirements.txt
```

### Issue: "CORS error" in browser
**Solution:**
- Ensure OCR service is running on port 8000
- Check `app.py` has correct CORS origins
- Verify frontend is using correct OCR_API_URL

### Issue: "Connection refused" to OCR service
**Solution:**
- Verify OCR service is running: `curl http://localhost:8000/health`
- Check firewall settings
- Ensure correct port (8000)

### Issue: PaddleOCR installation fails
**Solution:**
```bash
# Install CPU-only version
pip install paddlepaddle==2.6.0 -i https://pypi.tuna.tsinghua.edu.cn/simple
pip install paddleocr==2.7.3
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend (Vite)                    │
│  - Upload Interface                                          │
│  - Document Management                                       │
│  - Data Visualization                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP Request (FormData)
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Python OCR Service (FastAPI)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  1. Image Preprocessing (OpenCV)                      │  │
│  │     - Grayscale conversion                            │  │
│  │     - Denoising                                       │  │
│  │     - Deskewing                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  2. OCR Engine Selection                              │  │
│  │     - Tesseract (Turkish support)                     │  │
│  │     - PaddleOCR (complex layouts)                     │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  3. Text Cleaning & Normalization                     │  │
│  │     - Remove noise                                    │  │
│  │     - Fix Turkish characters                          │  │
│  │     - Structured data extraction                      │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ JSON Response
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    Supabase Database                         │
│  - Store extracted text                                      │
│  - Store structured data                                     │
│  - Document metadata                                         │
└─────────────────────────────────────────────────────────────┘
```

## Features

### ✅ Implemented
- Custom Python OCR service with FastAPI
- Tesseract OCR with Turkish language support
- PaddleOCR for complex layouts
- Automatic engine selection
- Image preprocessing (denoising, deskewing)
- Text cleaning and normalization
- Fallback to OCR.space if custom service fails
- Health check endpoint
- CORS support for React frontend

### 🔄 Optional Enhancements
- Document classification (policy type detection)
- LayoutLMv3 for layout-aware parsing
- Batch processing
- Redis caching
- PDF support
- Admin dashboard
- API authentication
- Rate limiting

## Performance Tips

1. **Use GPU** (if available):
   - Edit `ocr_service/ocr/paddleocr_engine.py`
   - Change `use_gpu=False` to `use_gpu=True`

2. **Adjust Workers**:
   ```bash
   uvicorn app:app --workers 4
   ```

3. **Enable Production Mode**:
   ```bash
   uvicorn app:app --host 0.0.0.0 --port 8000 --workers 4 --no-access-log
   ```

## Next Steps

1. ✅ Set up development environment
2. ✅ Test OCR service locally
3. ✅ Integrate with frontend
4. 🔄 Deploy to production
5. 🔄 Monitor performance
6. 🔄 Add advanced features (document classification, etc.)

## Support

For issues or questions:
1. Check logs in both terminals
2. Verify all services are running
3. Test endpoints individually
4. Check environment variables

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract)
- [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR)
- [React + Vite](https://vitejs.dev/)
- [Supabase](https://supabase.com/docs)
