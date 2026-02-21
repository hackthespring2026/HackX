# 🤖 LexoraAI - Intelligent Policy Assistant

**LexoraAI** is an intelligent document analysis and policy assistant powered by **RAG (Retrieval-Augmented Generation)** technology. Upload company policies, personnel manuals, or any documents, then ask natural language questions to get instant, context-aware answers.

> ✨ Transform your policy documents into an intelligent conversational assistant!

---

## 📋 Features

### Core Capabilities
- **📄 Document Upload** - Support for PDF and TXT files
- **🔍 Semantic Search** - Uses vector embeddings for intelligent document retrieval
- **💬 Q&A System** - Ask natural language questions about your documents
- **📊 Auto Summarization** - Generate section-wise summaries of uploaded documents
- **🎯 Source Attribution** - Know exactly which document your answers come from
- **⚡ Fast Retrieval** - FAISS vector database for millisecond search

### Advanced Features
- **🔄 Incremental Indexing** - Only new documents are processed (faster uploads)
- **📚 Multi-Document Support** - Search across all uploaded documents simultaneously
- **🧠 Context-Aware Responses** - LLM generates answers only from document content
- **🔐 API-First Design** - RESTful API for easy integration

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LEXORAAI SYSTEM                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend (React + Vite)                                    │
│  ├── Document Upload UI                                    │
│  ├── Chat Interface                                        │
│  ├── Source References Panel                              │
│  └── Responsive Dark Theme                                │
│                                                              │
│            ↓ HTTP/REST API (Port 8001)                     │
│                                                              │
│  Backend (FastAPI + Python)                                │
│  ├── Document Loading (PDF/TXT)                           │
│  ├── Text Chunking & Preprocessing                        │
│  ├── Vector Embedding Generation                          │
│  ├── FAISS Indexing & Search                              │
│  └── LLM Integration (Groq API)                           │
│                                                              │
│            ↓                                                 │
│                                                              │
│  Data Storage                                               │
│  ├── data/raw/ (Original documents)                        │
│  └── vectorstore/faiss_index/ (Vector database)            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

### Frontend
- **React 19** - UI Framework
- **Vite** - Build tool (fast development server)
- **Tailwind CSS** - Styling
- **JavaScript (ES6+)** - Client logic

### Backend
- **Python 3.11** - Core language
- **FastAPI** - Web framework
- **Uvicorn** - ASGI server
- **LangChain** - RAG pipeline orchestration
- **FAISS** - Vector similarity search
- **Sentence-Transformers** - Embeddings (all-MiniLM-L6-v2)
- **PyPDF** - PDF parsing
- **Groq API** - LLM (gpt-oss-120b)

### Infrastructure
- **Local Development** - Windows compatible
- **Port 5173** - Frontend (Vite)
- **Port 8001** - Backend API

---

## 📦 Installation

### Prerequisites
- **Python 3.11+** 
- **Node.js 16+**
- **Groq API Key** (get free at https://console.groq.com)

### Backend Setup

```bash
cd rag-backend

# Install dependencies
pip install -r requirements.txt

# Create .env file with your Groq API key
echo "GROQ_API_KEY=your_api_key_here" > .env

# Build FAISS index (if documents exist)
python -c "from indexer.build_index import run_indexing_pipeline; run_indexing_pipeline()"
```

### Frontend Setup

```bash
cd rag-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 🚀 Running LexoraAI

### Start Backend
```bash
cd rag-backend
$env:PYTHONPATH = "."
python -m uvicorn api.app:app --host 127.0.0.1 --port 8001
```

### Start Frontend
```bash
cd rag-frontend
npm run dev
```

### Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://127.0.0.1:8001
- **API Docs**: http://127.0.0.1:8001/docs (Swagger)

---

## 📚 API Endpoints

### Upload Document
```http
POST /upload-document
Content-Type: multipart/form-data

Body:
  file: <PDF or TXT file>

Response:
  {
    "message": "✅ Document uploaded successfully",
    "filename": "policy.pdf",
    "path": "data/raw/policy.pdf",
    "note": "File saved. You can ask questions about it."
  }
```

### Ask Question
```http
POST /ask
Content-Type: application/json

Body:
  {
    "question": "What is the leave policy?"
  }

Response:
  {
    "answer": "Based on the documents...",
    "sources": [
      {
        "source": "Comprehensive_Company_Policy_Manual.pdf",
        "page": 1
      }
    ]
  }
```

### Get Summary
```http
GET /summarize

Response:
  {
    "summary": "## Company Policies\n- Leave: 20 days annual...\n- Attendance: 85% required..."
  }
```

### Health Check
```http
GET /

Response:
  {
    "status": "RAG backend running"
  }
```

---

## 📁 Project Structure

```
Policy-Assistant/
├── README.md
├── rag-backend/                          # Python FastAPI backend
│   ├── main.py                           # Entry point
│   ├── requirements.txt                  # Dependencies
│   ├── .env                              # API keys
│   ├── api/
│   │   └── app.py                        # FastAPI application
│   ├── config/
│   │   └── settings.py                   # Configuration
│   ├── data/
│   │   └── raw/                          # Uploaded documents
│   ├── embeddings/
│   │   └── embedder.py                   # Embedding generation
│   ├── indexer/
│   │   └── build_index.py                # FAISS indexing (with incremental support)
│   ├── llm/
│   │   └── groq_llm.py                   # Groq API integration
│   ├── loaders/
│   │   ├── pdf_loader.py                 # PDF parsing
│   │   └── txt_loader.py                 # TXT parsing
│   ├── pipelines/
│   │   ├── rag_pipeline.py               # Q&A pipeline
│   │   └── summarization_pipeline.py     # Summarization pipeline
│   ├── preprocessing/
│   │   └── chunker.py                    # Text chunking
│   ├── retrieval/
│   │   └── rag_retriever.py              # Vector search
│   └── vectorstore/
│       ├── faiss_store.py                # FAISS operations
│       └── faiss_index/                  # Vector database
│
└── rag-frontend/                         # React Vite frontend
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx
    │   ├── App.css
    │   ├── api/
    │   │   └── ragApi.js                 # Backend API calls
    │   ├── components/
    │   │   ├── ChatWindow.jsx             # Main chat interface
    │   │   ├── InputBox.jsx               # Question input
    │   │   ├── MessageBubble.jsx          # Chat message display
    │   │   ├── PdfUploader.jsx            # Document upload
    │   │   └── SourcePanel.jsx            # Source references
    │   ├── pages/
    │   │   └── ChatPage.jsx               # Main page
    │   └── styles/
    └── public/
```

---

## 🔄 How It Works

### Data Pipeline

```
1. UPLOAD DOCUMENT
   Document → Upload to /upload-document → Saved in data/raw/

2. INDEXING (Automatic on Upload)
   PDFs/TXTs → Load → Chunk (500 char) → Embed (384D vectors) → FAISS Index
   
3. SEARCH (When User Asks Question)
   Question → Embed → FAISS Similarity Search (top 3) → Retrieve Context
   
4. GENERATION (LLM Answer)
   Context + Question → Groq LLM → Answer
```

### Incremental Indexing

- **First Upload**: Builds complete FAISS index
- **Subsequent Uploads**: Only processes new documents
- **Tracking**: `indexed_files.json` tracks processed files
- **Performance**: 50-100x faster on repeated uploads

---

## 🔐 Environment Variables

Create `.env` file in `rag-backend/`:

```env
# Required: Groq API Key
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx

# Optional: Configuration
RAW_DATA_DIR=data/raw
VECTOR_DB_DIR=vectorstore/faiss_index
CHUNK_SIZE=500
CHUNK_OVERLAP=100
EMBEDDING_MODEL_NAME=all-MiniLM-L6-v2
```

---

## 📊 Data Storage

| Component | Location | Size | Format | Purpose |
|-----------|----------|------|--------|---------|
| Original Documents | `data/raw/` | ~10-50MB | PDF/TXT | Keep originals |
| Vector Index | `faiss_index/index.faiss` | ~90MB+ | Binary | Fast search |
| Metadata | `faiss_index/index.pkl` | ~2MB | Pickle | Index metadata |
| File Tracking | `indexed_files.json` | <1KB | JSON | Incremental indexing |

---

## 🔧 Troubleshooting

### PyTorch DLL Error (Windows)
```bash
pip uninstall torch -y
pip install torch==2.0.1 --index-url https://download.pytorch.org/whl/cpu
```

### FAISS Index Not Found
```bash
# Rebuild index
cd rag-backend
python -c "from indexer.build_index import run_indexing_pipeline; run_indexing_pipeline()"
```

### Port Already in Use
```bash
# Change port in backend (api/app.py, line 135)
# Or kill existing process:
netstat -ano | Select-String ":8001" | ForEach-Object { taskkill /PID $_.Split()[4] /F }
```

---

## 🎯 Usage Examples

### Example 1: Upload Policy Document
1. Click upload button
2. Select `Comprehensive_Company_Policy_Manual.pdf`
3. System indexes 69 pages in seconds

### Example 2: Ask About Leave Policy
```
User: "What is the annual leave policy?"
LexoraAI: "According to the Company Policy Manual, annual leave is 20 days 
          per employee..."
Source: Comprehensive_Company_Policy_Manual.pdf (Page 5)
```

### Example 3: Get Summary
```
User: Clicks "Summarize"
LexoraAI: Generates section-wise summary of all documents:
  - Leave Policy: 20 days annual...
  - Attendance: 85% required...
  - Work Hours: 9 AM - 6 PM...
```

---

## 🚀 Performance Metrics

- **Upload Speed**: 1-2 seconds for 10MB PDF
- **Search Speed**: <500ms per query
- **Indexing Speed**: ~100 chunks/second
- **Vector Dimension**: 384 (all-MiniLM-L6-v2)
- **Max Tokens**: ~4000 per response

---

## 📝 Development Notes

### Adding New Features
1. Backend changes → Restart backend (auto-reload enabled)
2. Frontend changes → Auto-refresh (Vite HMR)

### Disabling Features
- Q&A: Comment out `/ask` endpoint
- Summarization: Comment out `/summarize` endpoint
- Upload: Comment out `/upload-document` endpoint

### Extending Document Support
Add to `loaders/` and update `api/app.py` file type check:
```python
if not (file.filename.endswith((".pdf", ".txt", ".docx"))):
```

---

## 📄 License

This project is open source and available for educational and commercial use.

---

## 🤝 Support & Feedback

For issues or suggestions:
- Check troubleshooting section above
- Review backend logs for errors
- Ensure Groq API key is valid

---

## 🎉 Getting Started

```bash
# 1. Clone and setup
git clone <repo>
cd Policy-Assistant

# 2. Setup backend
cd rag-backend
pip install -r requirements.txt
echo "GROQ_API_KEY=your_key" > .env

# 3. Setup frontend
cd ../rag-frontend
npm install

# 4. Run in two terminals
# Terminal 1: Backend
cd rag-backend && python -m uvicorn api.app:app --host 127.0.0.1 --port 8001

# Terminal 2: Frontend
cd rag-frontend && npm run dev

# 5. Open http://localhost:5173
```

---

**Made with ❤️ by LexoraAI Team**

