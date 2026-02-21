# PolicyAssist — Technical Deep Dive

A detailed breakdown of every feature, the technology behind it, and why each design decision was made.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Document Upload & Indexing](#2-document-upload--indexing)
3. [Embeddings](#3-embeddings)
4. [Vector Store (ChromaDB)](#4-vector-store-chromadb)
5. [Query Classification](#5-query-classification)
6. [Grounded Q&A (Ask a Question)](#6-grounded-qa-ask-a-question)
7. [Gap Detection](#7-gap-detection)
8. [Compliance / Scenario Analysis](#8-compliance--scenario-analysis)
9. [Section Detection & Summarization](#9-section-detection--summarization)
10. [Table Extraction](#10-table-extraction)
11. [LLM Integration](#11-llm-integration)
12. [Frontend Architecture](#12-frontend-architecture)
13. [API Design](#13-api-design)

---

## 1. System Overview

PolicyAssist is a **Retrieval-Augmented Generation (RAG)** system. The core idea:

> Instead of asking an LLM to answer from memory (which causes hallucinations), we first retrieve the most relevant chunks from the user's own documents, then pass those chunks to the LLM as context. The LLM is only allowed to answer using that context.

**Full pipeline:**

```
[User uploads PDF/TXT]
        │
        ▼
[Parse → Chunk → Embed → Store in ChromaDB]
        │
        ▼
[User asks question / describes scenario]
        │
        ▼
[Classify query → Choose retrieval strategy]
        │
        ▼
[Semantic search: top-k most relevant chunks retrieved]
        │
        ▼
[Chunks + question sent to LLM with strict grounding prompt]
        │
        ▼
[Answer returned with page citations, confidence, gap flag]
```

---

## 2. Document Upload & Indexing

**File:** `backend/app/document.py`, `backend/app/main.py`

### Parsing

- **PDF:** LangChain's `PyPDFLoader` reads each page. Each page becomes a `Document` object with `page_content` (text) and `metadata` (page number, source filename).
- **TXT:** `TextLoader` reads the file as one big document.

### Chunking

Used LangChain's `RecursiveCharacterTextSplitter`:

```python
chunk_size=800, chunk_overlap=150
```

- **Why 800 chars?** Large enough to contain a complete policy clause (context), small enough to keep retrieval precise. Too large → irrelevant content bleeds in. Too small → clauses get cut in half.
- **Why 150 char overlap?** Prevents clauses that span chunk boundaries from being lost. If a sentence starts at chunk N's end, the overlap ensures it also appears in chunk N+1.

Each chunk gets metadata:
```python
{
  "source": "file_id",   # UUID of the uploaded file
  "page": 2,             # 0-indexed page from PyPDF (displayed as +1)
  "chunk_id": "uuid4"    # Unique ID for deduplication in Chroma
}
```

### Why `chunk_id` as Chroma document ID?

Chroma uses document IDs for upsert deduplication. Using a stable `chunk_id` means re-uploading the same file does not create duplicate vectors — Chroma just overwrites them.

---

## 3. Embeddings

**File:** `backend/app/embeddings.py`

Embeddings convert text into a high-dimensional vector (list of floats) that captures semantic meaning. Two sentences that *mean* the same thing will have vectors that are *close* in vector space, even if they use different words.

### Supported providers

| Provider | Model | Runs |
|---|---|---|
| **HuggingFace** (default) | `all-MiniLM-L6-v2` | Locally — no API cost |
| **OpenAI** | `text-embedding-3-small` | API call to OpenAI |

`all-MiniLM-L6-v2` produces **384-dimensional** vectors. It's fast, free, and performs well for English policy text.

### How they're used

Every chunk's text is embedded at upload time and stored alongside the chunk in ChromaDB. At query time, the question is also embedded using the same model, and ChromaDB finds chunk vectors nearest to the question vector.

---

## 4. Vector Store (ChromaDB)

**File:** `backend/app/vector_store.py`

ChromaDB is a local, disk-persisted vector database. It stores chunks as `(id, vector, text, metadata)` tuples.

### Collections

| Collection | Purpose |
|---|---|
| `policy_docs` | All normally uploaded documents |
| `compare_<uuid>` | Isolated collection per document in the compare feature (now removed from UI but backend still supports it) |

### Similarity search

```python
store.similarity_search(query, k=5)
store.similarity_search_with_relevance_scores(query, k=5)
```

ChromaDB uses **cosine similarity** between the query vector and stored chunk vectors. The `_with_relevance_scores` variant returns a `(Document, score)` tuple where score ∈ [0, 1]. This score is used to compute confidence level.

### Why ChromaDB over Pinecone/Weaviate?

- **Local + free** — no API key, no cloud dependency, works without internet
- **Simple setup** — single `pip install chromadb`, data persists to a local directory
- Sufficient for document sizes in a hackathon context

---

## 5. Query Classification

**File:** `backend/app/classifier.py`

Not all questions are the same. A question like *"How many leave days do I get?"* needs numeric precision; *"What is the leave policy?"* needs broader context. A classifier routes each query to the best retrieval strategy.

### Query types

| Label | Example | `top_k` | Special retrieval |
|---|---|---|---|
| `factual_lookup` | "What is the probation period?" | 5 | Standard semantic search |
| `numeric_lookup` | "How many overtime hours are allowed?" | 6 | Searches table chunks first |
| `procedural` | "How do I apply for annual leave?" | 6 | Standard |
| `comparative` | "What's the difference between sick and casual leave?" | 8 | Wider retrieval |
| `policy_existence` | "Do we have a remote work policy?" | 4 | Standard |

### How classification works

A simple keyword + pattern matching approach (no extra LLM call needed):

- Numbers, `how many`, `maximum`, `limit` → `numeric_lookup`
- `how to`, `steps`, `process`, `procedure` → `procedural`
- `difference`, `compare`, `vs`, `versus` → `comparative`
- `do we have`, `is there`, `does the company` → `policy_existence`
- Default → `factual_lookup`

**Why not use the LLM to classify?** Speed and cost. A keyword classifier runs in microseconds vs ~1 second for an LLM call.

---

## 6. Grounded Q&A (Ask a Question)

**File:** `backend/app/rag.py`

### Retrieval

Based on the query class, the system retrieves the top-k most relevant chunks:
- For `numeric_lookup`: first tries `search_tables()` which filters for chunks with `is_table=True` metadata; falls back to regular search if no table chunks match.
- For all others: `search_similar_with_scores()`.

### Context construction

Retrieved chunks are formatted with page tags:
```
[Page 3]
Employees are entitled to 15 days of annual leave per calendar year...

[Page 3]
Unused leave beyond 3 days shall not be carried forward...
```

### LLM prompting

The system prompt (`STRICT_SYSTEM_PROMPT`) enforces strict grounding with explicit rules:

1. Answer ONLY from provided context — no prior knowledge
2. Quote exact clauses and mention page numbers
3. If not in context → return exactly `"The document does not contain this information."`
4. No fabrication or inference
5. Never start with `"According to the context"`, `"Based on the provided document"`, or similar preambles — answer directly

**Rule 7 (no preambles)** was added specifically because LLMs trained on RLHF tend to hedge by default. The rule forces direct, professional answers.

### Confidence scoring

Computed from retrieval scores — not from the LLM output (LLMs are notoriously bad at knowing what they don't know):

| Score range | Confidence |
|---|---|
| ≥ 0.75 | **High** |
| ≥ 0.50 | **Medium** |
| < 0.50 | **Low** |

The top retrieved chunk's cosine similarity score is used as the confidence signal.

### Citations

Built server-side from chunk metadata — the LLM is never trusted to generate page numbers:

```python
sources = [
    {"page": doc.metadata["page"] + 1, "excerpt": doc.page_content[:200]}
    for doc in retrieved_chunks
]
```

This prevents the LLM from hallucinating nonexistent page numbers.

---

## 7. Gap Detection

**File:** `backend/app/rag.py`

When the LLM returns the fixed refusal string `"The document does not contain this information."`, the system:

1. Sets `gap_detected = True`
2. Generates a `suggestion` — a short recommendation for what policy should be added

The suggestion is generated by a secondary short LLM call with the prompt:
> *"The question was: '{question}'. No relevant policy was found. Suggest in one sentence what policy the company should add."*

**Why a separate detection step?** String matching the refusal is deterministic and reliable. Any other approach (asking the LLM "did you find an answer?") introduces ambiguity.

---

## 8. Compliance / Scenario Analysis

**File:** `backend/app/rag.py`

Uses the same RAG pipeline as Q&A, but with a different system prompt tailored for compliance reasoning:

```
You are a compliance advisor. Given the scenario and the policy context:
1. State clearly whether the employee is compliant or non-compliant.
2. Quote the exact policy clause that applies.
3. Explain the consequences if non-compliant.
4. If the policy does not cover this scenario, state it explicitly.
```

The scenario text is treated as the query for retrieval — semantically similar policy chunks are retrieved and used as context.

**Gap detection** works identically to Q&A — if no relevant policy is found, the system flags a gap and suggests what policy to add.

---

## 9. Section Detection & Summarization

**File:** `backend/app/sections.py`

### Why auto-detect sections?

Policy documents have a consistent structure (numbered headings, ALL CAPS titles). Instead of requiring users to manually define sections, the system detects them automatically.

### Heading detection — 3 patterns

```python
# 1. Numbered: "1.", "2.1", "3.1.2 Title"
_NUMBERED_RE = re.compile(r"^\d+(\.\d+)*\.?\s+\S")

# 2. ALL CAPS: "LEAVE POLICY", "MATERNITY BENEFITS"
_ALLCAPS_RE = re.compile(r"^[A-Z][A-Z\s\-&/,]{4,}[A-Z]$")

# 3. Title Case: "Annual Leave Entitlement", "Disciplinary Procedure"
_TITLECASE_RE = re.compile(r"^([A-Z][a-zA-Z]{0,}(\s+[A-Z][a-zA-Z]{0,}){2,})[^.,:;!?]*$")
```

Additional guards:
- Line must be ≤ 80 characters (headings are short)
- Must contain ≥ 2 words
- Must not end in `.?!;,` (real headings rarely end with sentence punctuation)

### Accumulation

Every line after a heading is accumulated into that section's text until the next heading is detected. Text before the first heading becomes `"Introduction / General"`.

### Page numbering

PyPDF stores pages as 0-indexed integers (page 0 = physical page 1). The system adds `+1` when reading page metadata to display human-readable page numbers.

Page range display is smart:
- Single page: `"Page 3"`
- Multi-page: `"Pages 3-7"`

### LLM summarization

Each detected section is summarized by passing its text (up to 3000 chars) to the LLM with a focused prompt:

> *"Summarize the following policy section in 2-4 concise sentences. Focus on key rules, conditions, and limits."*

Sections shorter than 50 characters are skipped (likely false positive headings).

### Caching

Summaries are cached to `data/sections/<file_id>.json` after upload so the `/sections` endpoint doesn't re-run LLM calls every time. All JSON files are loaded and merged when the endpoint is called.

---

## 10. Table Extraction

**File:** `backend/app/table_parser.py`

PDF tables (e.g., leave entitlement tables, reimbursement limits) don't parse well as raw text — PyPDF just dumps them as space-separated characters. `pdfplumber` extracts them as structured rows.

### How it works

```python
with pdfplumber.open(pdf_path) as pdf:
    for page in pdf.pages:
        tables = page.extract_tables()
        for table in tables:
            # Convert to readable text: "Col1: Val1 | Col2: Val2"
```

Each table row is converted to a pipe-separated string and stored as a separate chunk with `is_table=True` in its metadata.

### Why index tables separately?

Numeric queries like *"What is the reimbursement limit for Senior Managers?"* need the exact number from a table. Standard text chunking often loses table structure. By indexing tables as dedicated chunks with the `is_table` flag, the `numeric_lookup` classifier can filter for them specifically.

---

## 11. LLM Integration

**File:** `backend/app/llm.py`, `backend/app/config.py`

The LLM client is built on LangChain's `ChatOpenAI`, configured via environment variables. This makes the provider swappable without code changes:

```env
API_KEY=gsk-...                          # Groq key
BASE_URL=https://api.groq.com/openai/v1  # Groq endpoint (OpenAI-compatible)
LLM_MODEL=llama-3.1-70b-versatile        # Any model name
```

**Why Groq?** Groq's inference hardware (LPU) runs large models (70B) at ~500 tokens/second — much faster than standard GPU inference. This makes response times acceptable in a demo setting.

**Why not call the LLM directly with `requests`?** LangChain's `ChatPromptTemplate | LLM | StrOutputParser` chain handles:
- Message formatting (system + human roles)
- Token streaming (future-proofing)
- Retry logic
- Output parsing

---

## 12. Frontend Architecture

**Files:** `frontend/index.html`, `frontend/styles.css`, `frontend/app.js`

### Single Page Application (vanilla JS)

No React, no Vue — vanilla JS with a tab-switching pattern:

```javascript
const tabs = ['upload', 'ask', 'scenario', 'sections'];

document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
        tabs.forEach(t => {
            document.getElementById(`tab-${t}`).classList.toggle('active', t === target);
        });
    });
});
```

Only the active tab panel has `class="active"` (CSS `display: block`); others are `display: none`. No routing library needed.

### API communication

All API calls go through a single `apiFetch()` helper:

```javascript
async function apiFetch(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, options);
    const text = await res.text();
    let data = {};
    try { data = JSON.parse(text); } catch { data = { error: text }; }
    return { ok: res.ok, status: res.status, data };
}
```

This unified helper ensures:
- JSON parse errors are caught (API returns HTML on 500 errors sometimes)
- Both `ok` and `data` are always available to the caller regardless of status code

### Drag-and-drop upload

The upload zone listens for `dragover`, `dragleave`, and `drop` events. `drop` reads `event.dataTransfer.files[0]` and submits it the same way as a normal file input.

### Design

Dark theme with CSS custom properties (`--surface`, `--accent`, `--text-dim` etc.) defined on `:root`. This makes the palette easy to swap without hunting through the stylesheet.

---

## 13. API Design

**File:** `backend/app/main.py`

### FastAPI

FastAPI was chosen because:
- **Auto-generates OpenAPI docs** at `/docs` — useful for debugging during a hackathon
- **Pydantic models** for request/response validation — catches bad input before it hits the LLM
- **Async-ready** — can handle concurrent requests without blocking
- **Type hints** throughout → better IDE support

### CORS

`CORSMiddleware` with `allow_origins=["*"]` is set to allow the browser to call the API from any origin. In production this would be restricted to the specific frontend domain.

### Static file serving

The frontend is mounted as a static file directory at the root path:

```python
app.mount("/", StaticFiles(directory=str(_FRONTEND_DIR)), name="frontend")
```

This is done **after** all API routes are defined, so API routes always take priority over static files. A single `uvicorn` command serves both the API and the UI.

### Error handling

A global exception handler returns JSON for all uncaught exceptions:

```python
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(status_code=500, content={"detail": str(exc)})
```

Without this, FastAPI returns HTML error pages, which the frontend's `apiFetch` would fail to JSON-parse.

### `collection_name` query param on `/upload`

The upload endpoint accepts an optional `?collection_name=` query parameter (defaults to `policy_docs`). This was added to support isolated per-document Chroma collections for the document comparison feature, without breaking the standard upload flow.

---

## Summary of Key Technical Choices

| Decision | Why |
|---|---|
| RAG over pure LLM | Prevents hallucination; answers grounded in actual document text |
| ChromaDB | Free, local, disk-persistent; no cloud dependency |
| `all-MiniLM-L6-v2` | Fast, free, runs locally; good for English policy text |
| Groq + LLaMA 3.1 70B | ~500 tok/s inference; free tier; large context window |
| Confidence from retrieval scores | LLMs cannot reliably self-report uncertainty |
| Server-side citation construction | LLMs hallucinate page numbers; metadata is ground truth |
| Keyword query classifier | ~0ms latency vs ~1s for LLM-based classification |
| pdfplumber for tables | PyPDF loses table structure; pdfplumber preserves rows |
| Section cache to JSON | Avoid re-running LLM summarization on every `/sections` call |
| Vanilla JS SPA | Zero build tooling; serves directly from FastAPI's static mount |
