from langchain_ollama import OllamaEmbeddings

def get_embedding_function():
    embedding = OllamaEmbeddings(model="bge-m3:latest")
    return embedding