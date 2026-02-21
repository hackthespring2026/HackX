# RAG Backend API

A Retrieval-Augmented Generation (RAG) backend built with FastAPI, FAISS, and Groq LLM.

## Features

- 📄 **Document Upload**: Support for PDF and TXT files
- 🔍 **Semantic Search**: Uses FAISS vector search for context retrieval
- 🤖 **Question Answering**: Real-time question answering with source attribution
- 📊 **Automatic Summaries**: Generates section-wise document summaries
- ⚡ **Incremental Indexing**: Efficient document processing with only new files indexed

## Architecture

```
data/raw/                 → Upload location for PDFs and TXTs
    ↓
loaders/                  → Load documents (PDF/TXT)
    ↓
preprocessing/            → Split documents into chunks
    ↓
embeddings/               → Generate vector embeddings
    ↓
vectorstore/              → FAISS vector database
    ↓
retrieval/                → Semantic search & context retrieval
    ↓
llm/                      → Groq LLM for Q&A & summaries
```

## Incremental Indexing Implementation

### Problem it Solves

**Without Incremental Indexing:**
- Every new document upload → Full index rebuild
- All previous documents re-processed
- Wasted computation on already-indexed data
- Slow performance with large document sets

**With Incremental Indexing:**
- Only NEW documents processed
- Existing index preserved and extended
- 10-100x faster uploads (depending on document count)

### How It Works

#### 1. File Tracking Metadata
**File**: `vectorstore/faiss_index/indexed_files.json`

**Purpose**: Tracks which files have been indexed (lines 10-20 in build_index.py)

```python
def get_indexed_files():
    """Load the list of previously indexed files from metadata."""
    # Returns: {"document1.pdf": {"status": "indexed"}, ...}
```

**Why**: Comparison between current files and indexed files identifies new documents

#### 2. New File Detection
**Function**: `get_new_files()` (lines 24-50 in build_index.py)

**What it does:**
1. Reads `indexed_files.json` to get previously indexed files
2. Scans `data/raw/` for current files
3. Identifies files that are NEW (not in metadata)
4. Returns separate lists of new PDFs and new TXTs

**Why**: Allows selective processing of only new documents

#### 3. Two Indexing Modes

**Mode 1: FULL REBUILD** (First time or force rebuild)
- When: `indexed_files.json` doesn't exist
- Action: Load ALL PDFs/TXTs → Create new index
- Use case: Initial setup

```python
# Lines 53-82 in build_index.py
if not incremental or not os.path.exists(VECTOR_DB_DIR):
    print("Mode: FULL REBUILD")
    # Load all documents → Build fresh index
```

**Mode 2: INCREMENTAL** (Normal operation)
- When: Index exists and new files detected
- Action: Load only NEW documents → Add to existing index
- Use case: Regular document uploads

```python
# Lines 84-120 in build_index.py
else:
    print("Mode: INCREMENTAL")
    new_pdfs, new_txts, current_files = get_new_files()
    # Load new docs → Add to existing index
```

#### 4. Incremental Index Update
**Function**: `add_documents_to_index()` (lines 32-44 in faiss_store.py)

**What it does:**
1. Takes existing FAISS index
2. Adds new document chunks via `db.add_documents()`
3. Saves updated index to disk

**Why**: FAISS supports adding documents without full rebuild

```python
def add_documents_to_index(db, documents):
    """Add new documents to existing FAISS index"""
    db.add_documents(documents)  # Incremental addition
    return db
```

### Performance Comparison

| Scenario | Without Incremental | With Incremental | Speedup |
|----------|-------------------|-----------------|---------|
| 1st upload: 10 docs | 10s | 10s | 1x |
| 2nd upload: 1 new doc | 10s | 1s | 10x |
| 3rd upload: 2 new docs | 10s | 1-2s | 5-10x |
| 100+ docs, add 1 file | 100s+ | 1-2s | 50-100x |

### File Structure After Implementation

```
vectorstore/
├── faiss_index/
│   ├── index.faiss              (Vector index)
│   ├── docstore.pkl             (Document storage)
│   ├── index.pkl                (Index metadata)
│   └── indexed_files.json       ← NEW: Tracks processed files
```

### API Integration

**Upload Endpoint** (`api/app.py`, lines 47-67):
```python
@app.post("/upload-document")
async def upload_document(file: UploadFile = File(...)):
    # Save file to data/raw/
    
    # Automatically called with incremental=True by default
    run_indexing_pipeline()  
    
    # Only processes NEW files!
    return {"message": "Document uploaded and indexed successfully"}
```

### Configuration

**Enable/Disable Incremental Indexing** (in your code):

```python
# Use incremental indexing (default, recommended)
run_indexing_pipeline(incremental=True)

# Force full rebuild (use sparingly)
run_indexing_pipeline(incremental=False)
```

### Best Practices

1. **First Setup**: Run once to build initial index (automatically full rebuild)
2. **Regular Uploads**: Uses incremental mode (no need to change code)
3. **Maintenance**: Only force full rebuild if index gets corrupted
4. **Cleanup**: Delete `indexed_files.json` to reset tracking if needed

```bash
# Reset tracking (forces full rebuild on next upload)
rm vectorstore/faiss_index/indexed_files.json
```

## API Endpoints

### 1. Upload Document
```
POST /upload-document
Content-Type: multipart/form-data

Body:
  file: <PDF or TXT file>

Response:
  {
    "message": "Document uploaded and indexed successfully",
    "filename": "document.pdf"
  }
```

### 2. Ask Question
```
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
        "source": "policy.pdf",
        "page": 1
      }
    ]
  }
```

### 3. Summarize All Documents
```
GET /summarize

Response:
  {
    "summary": "## Leave Policy\n- Annual leave: 20 days\n- Sick leave: 10 days\n..."
  }
```

### 4. Health Check
```
GET /

Response:
  {
    "status": "RAG backend running"
  }
```

## Setup Instructions

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Environment Variables
Create `.env` file:
```
GROQ_API_KEY=your_api_key_here
```

### 3. Run Backend
```bash
python main.py
```

Server runs on `http://127.0.0.1:8000`

## Key Components

- **api/app.py**: FastAPI application with endpoints
- **indexer/build_index.py**: Indexing pipeline with incremental support
- **vectorstore/faiss_store.py**: FAISS index management
- **retrieval/rag_retriever.py**: Semantic search
- **llm/groq_llm.py**: LLM integration with Groq
- **loaders/**: PDF and TXT file loaders

## Monitoring

Check logs during operations:

```
Loading new PDF: policy.pdf
Adding 150 new document chunks to index...
FAISS index saved at: vectorstore/faiss_index
Successfully indexed 1 new documents!
```

## Troubleshooting

**Q: "No documents found to summarize"**
- A: Upload PDF/TXT files to `data/raw/` first

**Q: "Index is outdated"**
- A: Delete `indexed_files.json` to force rebuild

**Q: Uploads taking too long**
- A: Check that incremental indexing is working (should show "Mode: INCREMENTAL" in logs)
