from fastapi import FastAPI
from pydantic import BaseModel
from query_data import query_rag  # seu código de RAG
from fastapi.middleware.cors import CORSMiddleware

# Inicializa FastAPI
app = FastAPI(title="RAG API")

# Permitir requisições do Open Web UI (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ou a URL do Web UI
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelo de request
class QueryRequest(BaseModel):
    query_text: str

# Endpoint principal
@app.post("/rag")
def run_rag(request: QueryRequest):
    response_text = query_rag(request.query_text)
    return {"response": response_text}
