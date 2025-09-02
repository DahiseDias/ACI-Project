import argparse, os, shutil
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema.document import Document
from langchain.vectorstores.chroma import Chroma
from get_embedding_function import get_embedding_function
import PyPDF2 as pypdf
import fitz  # PyMuPDF
from PIL import Image
import pytesseract

CHROMA_PATH = "chroma"
DATA_PATH = "data"
pytesseract.pytesseract.tesseract_cmd = r"C:\\Program Files\\Tesseract-OCR\\tesseract.exe"

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true", help="Reset the Chroma database")
    parser.add_argument("--query", type=str, help="Test a query against the database")
    args = parser.parse_args()

    if args.reset:
        print("Resetting Chroma database...")
        clear_database()
    
    documents = load_documents()
    chunks = split_documents(documents)
    add_to_chroma(chunks)

    # if args.query:
    #     query_chroma(args.query, top_k=6)

def load_documents():
    documents = []
    for file_name in os.listdir(DATA_PATH):
        file_path = os.path.join(DATA_PATH, file_name)
        if file_name.lower().endswith(".pdf"):
            try:
                pdf_docs = parse_file(file_path)
                if pdf_docs:
                    print(f"[OK] PDF processado: {file_name}")
                    for i, text in enumerate(pdf_docs):
                        clean_text = " ".join(text.split()).lower()
                        if clean_text.strip():
                            documents.append(Document(
                                page_content=clean_text,
                                metadata={"source": file_name, "page": i}
                            ))
                else:
                    print(f"[Vazio] PDF sem texto: {file_name}")
            except Exception as e:
                print(f"[ERRO] Não foi possível processar {file_name}: {e}")
        elif file_name.lower().endswith(".txt"):
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    lines = f.readlines()
                paragraphs = []
                buffer = []
                for line in lines:
                    line = line.strip()
                    if line:
                        buffer.append(line)
                    elif buffer:
                        paragraphs.append(" ".join(buffer))
                        buffer = []
                if buffer:
                    paragraphs.append(" ".join(buffer))
                if paragraphs:
                    print(f"[OK] TXT processado: {file_name}")
                    for i, text in enumerate(paragraphs):
                        clean_text = " ".join(text.split()).lower()
                        if clean_text.strip():
                            documents.append(Document(
                                page_content=clean_text,
                                metadata={"source": file_name, "page": i}
                            ))
                else:
                    print(f"[Vazio] TXT sem texto: {file_name}")
            except Exception as e:
                print(f"[ERRO] Não foi possível processar {file_name}: {e}")
    return documents

def parse_file(filename):
    paragraphs = []
    buffer = []
    found_text = False

    # 1. Tentar extrair texto com PyPDF2
    with open(filename, 'rb') as file:
        reader = pypdf.PdfReader(file)
        for page in reader.pages:
            text = page.extract_text()
            if text:
                found_text = True
                for line in text.split("\n"):
                    line = line.strip()
                    if line:
                        buffer.append(line)
                    elif buffer:
                        paragraphs.append(" ".join(buffer))
                        buffer = []
    if buffer:
        paragraphs.append(" ".join(buffer))

    # 2. Se não encontrou texto, usar OCR
    if not found_text:
        print(f"⚠️ Nenhum texto embutido encontrado. Usando OCR para {os.path.basename(filename)}...")
        paragraphs = []
        buffer = []
        with fitz.open(filename) as doc:
            for page in doc:
                pix = page.get_pixmap()
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                text = pytesseract.image_to_string(img, lang="por")
                if text.strip():
                    for line in text.split("\n"):
                        line = line.strip()
                        if line:
                            buffer.append(line)
                        elif buffer:
                            paragraphs.append(" ".join(buffer))
                            buffer = []
        if buffer:
            paragraphs.append(" ".join(buffer))

    return paragraphs

def split_documents(documents: list[Document]):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500, 
        chunk_overlap=30,
        length_function=len,
        is_separator_regex=False
    )
    return text_splitter.split_documents(documents)

def add_to_chroma(chunks: list[Document], batch_size: int = 10000):
    db = Chroma(
        persist_directory=CHROMA_PATH,
        embedding_function=get_embedding_function(),
    )

    chunks_with_ids = calculate_chunk_ids(chunks)

    existing_items = db.get(include=[])
    existing_ids = set(existing_items["ids"])
    print(f"Existing IDs in Chroma: {len(existing_ids)}")

    new_chunks = [chunk for chunk in chunks_with_ids if chunk.metadata["id"] not in existing_ids]

    if new_chunks:
        print(f"Adding {len(new_chunks)} new chunks to Chroma")

        for i in range(0, len(new_chunks), batch_size):
            batch = new_chunks[i:i+batch_size]
            batch_ids = [chunk.metadata["id"] for chunk in batch]
            db.add_documents(batch, ids=batch_ids)
            print(f"Added batch {i // batch_size + 1} with {len(batch)} documents")

        # db.persist()
    else:
        print("No new chunks to add to Chroma")

def query_chroma(query: str, top_k: int = 6):
    print(f"\n🔎 Consulta: {query}")
    db = Chroma(
        persist_directory=CHROMA_PATH,
        embedding_function=get_embedding_function(),
    )
    results = db.similarity_search(query, k=top_k)
    print(f"\n📌 {len(results)} chunks recuperados:")
    for i, doc in enumerate(results, start=1):
        snippet = doc.page_content[:200].replace("\n", " ")
        print(f"\n[{i}] Fonte: {doc.metadata.get('source')} (pág {doc.metadata.get('page')})")
        print(f"Trecho: {snippet}...")

def calculate_chunk_ids(chunks):
    last_page_id = None
    current_chunk_index = 0
    for chunk in chunks:
        source = chunk.metadata.get("source")
        page = chunk.metadata.get("page")
        current_page_id = f"{source}_{page}"

        if current_page_id == last_page_id:
            current_chunk_index += 1
        else:
            current_chunk_index = 0

        chunk_id = f"{current_page_id}:{current_chunk_index}"
        last_page_id = current_page_id

        chunk.metadata["id"] = chunk_id

    return chunks

def clear_database():
    if os.path.exists(CHROMA_PATH):
        shutil.rmtree(CHROMA_PATH)

if __name__ == "__main__":
    main()
