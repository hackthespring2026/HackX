import os
import json
from pathlib import Path
from loaders.pdf_loader import load_all_pdfs, load_single_pdf
from loaders.txt_loader import load_all_txts, load_single_txt
from preprocessing.chunker import chunk_documents
from vectorstore.faiss_store import build_faiss_index, save_faiss_index, load_faiss_index, add_documents_to_index
from config.settings import RAW_DATA_DIR, VECTOR_DB_DIR

# Metadata file to track indexed documents
METADATA_FILE = os.path.join(VECTOR_DB_DIR, "indexed_files.json")


def get_indexed_files():
    """
    Load the list of previously indexed files from metadata.
    Returns an empty dict if metadata file doesn't exist.
    """
    if os.path.exists(METADATA_FILE):
        with open(METADATA_FILE, "r") as f:
            return json.load(f)
    return {}


def save_indexed_files(indexed_files):
    """
    Save the list of indexed files to metadata for future reference.
    This allows incremental indexing on next upload.
    """
    os.makedirs(VECTOR_DB_DIR, exist_ok=True)
    with open(METADATA_FILE, "w") as f:
        json.dump(indexed_files, f, indent=2)


def get_new_files():
    """
    Compare files in data/raw with indexed_files.json to find new documents.
    Returns lists of new PDFs and new TXTs.
    
    WHY: Prevents re-processing the same documents on every upload,
    dramatically improving performance when adding new documents.
    """
    indexed_files = get_indexed_files()
    previously_indexed = set(indexed_files.keys())
    
    # Get all current files in raw directory
    current_files = set()
    new_pdfs = []
    new_txts = []
    
    if os.path.exists(RAW_DATA_DIR):
        for filename in os.listdir(RAW_DATA_DIR):
            file_path = os.path.join(RAW_DATA_DIR, filename)
            if os.path.isfile(file_path):
                current_files.add(filename)
                
                # Check if file is new (not in indexed_files)
                if filename not in previously_indexed:
                    if filename.lower().endswith(".pdf"):
                        new_pdfs.append(file_path)
                    elif filename.lower().endswith(".txt"):
                        new_txts.append(file_path)
    
    return new_pdfs, new_txts, current_files


def run_indexing_pipeline(incremental=True):
    """
    Build or update FAISS index for RAG system.
    
    Args:
        incremental (bool): If True, only index new files. If False, rebuild entire index.
    
    WHY INCREMENTAL INDEXING:
    - On first upload: Creates new index
    - On subsequent uploads: Only processes NEW files and adds them to existing index
    - Performance: Avoids re-processing previously indexed documents
    - Efficiency: Significantly faster for large document sets
    """
    print("Starting RAG indexing pipeline...")
    
    if not incremental or not os.path.exists(VECTOR_DB_DIR):
        # FULL REBUILD MODE: Used on first initialization
        print("Mode: FULL REBUILD (first time or force rebuild)")
        
        pdf_documents = load_all_pdfs()
        txt_documents = load_all_txts()
        documents = pdf_documents + txt_documents
        
        if not documents:
            print("No documents found!")
            return
        
        chunks = chunk_documents(documents)
        db = build_faiss_index(chunks)
        save_faiss_index(db)
        
        # Track all indexed files
        indexed_files = {}
        if os.path.exists(RAW_DATA_DIR):
            for filename in os.listdir(RAW_DATA_DIR):
                if filename.endswith((".pdf", ".txt")):
                    indexed_files[filename] = {"status": "indexed"}
        
        save_indexed_files(indexed_files)
        print("RAG indexing pipeline completed successfully!")
        
    else:
        # INCREMENTAL MODE: Only process new files
        print("Mode: INCREMENTAL (processing only new documents)")
        
        new_pdfs, new_txts, current_files = get_new_files()
        
        if not new_pdfs and not new_txts:
            print("No new documents found. Index is up-to-date!")
            return
        
        print(f"Found {len(new_pdfs)} new PDFs and {len(new_txts)} new TXTs")
        
        # Load new documents
        new_documents = []
        
        for pdf_path in new_pdfs:
            print(f"Loading new PDF: {os.path.basename(pdf_path)}")
            new_documents.extend(load_single_pdf(pdf_path))
        
        for txt_path in new_txts:
            print(f"Loading new TXT: {os.path.basename(txt_path)}")
            new_documents.extend(load_single_txt(txt_path))
        
        if not new_documents:
            print("No documents extracted from new files!")
            return
        
        # Chunk new documents
        new_chunks = chunk_documents(new_documents)
        
        # Load existing index and add new chunks
        print("Loading existing index...")
        db = load_faiss_index()
        
        print("Adding new documents to index...")
        db = add_documents_to_index(db, new_chunks)
        
        save_faiss_index(db)
        
        # Update metadata with newly indexed files
        indexed_files = get_indexed_files()
        for filename in current_files:
            if filename.endswith((".pdf", ".txt")) and filename not in indexed_files:
                indexed_files[filename] = {"status": "indexed"}
        
        save_indexed_files(indexed_files)
        print(f"Successfully indexed {len(new_documents)} new documents!")
        print("RAG indexing pipeline completed successfully!")


if __name__ == "__main__":
    run_indexing_pipeline()
