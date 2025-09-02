import time
from langchain_community.vectorstores import Chroma
from langchain.prompts import ChatPromptTemplate
from langchain_ollama import OllamaLLM, OllamaEmbeddings
from get_embedding_function import get_embedding_function

CHROMA_PATH = "chroma"

PROMPT_TEMPLATE = """
Você é um assistente de IA especializado em prestar suporte ao cliente, EXCLUSIVAMENTE sobre a base de conhecimento fornecida.
Utilize uma linguagem clara e objetiva, adaptando o tom para o publico alvo de idosos, com empatia e paciência.

priorize respostas sobre o site www.ipmjp.pb.gov.br
filtre o contexto para não incluir informações irrelevantes ou desatualizadas.

Pergunta: {question}

Responda as perguntas seguindo o seguinte contexto: 
{context}

Finalize a mensagem com "Posso ajudar em algo mais?"

Se não souber a resposta, responda "Desculpe, não sei a resposta para isso. Entre em contato com o suporte do IPM para mais informações."
"""

def query_rag(query_text: str):
    embedding_function = get_embedding_function()
    db = Chroma(
        embedding_function=embedding_function,
        persist_directory=CHROMA_PATH
    )

    results = db.similarity_search(query_text, k=5)
    context_text = "\n\n --- \n\n".join([doc.page_content for doc in results])
    prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)
    prompt = prompt_template.format(context=context_text, question=query_text)
    model = OllamaLLM(model="mistral")
    response_text = model.invoke(prompt)

    sources = [doc.metadata.get("id", None) for doc in results]
    return response_text, sources

def print_welcome_message():
    print("\n=== Bem-vindo ao Assistente IPM ===")
    print("Digite suas perguntas e pressione Enter para obter respostas.")
    print("Para sair, digite 'sair' ou 'exit'.\n")

def chat_loop():
    print_welcome_message()
    
    while True:
        try:
            # Input com formatação especial
            user_input = input("\n👤 Você: ")
            
            # Verificar comando de saída
            if user_input.lower() in ['sair', 'exit']:
                print("\n🤖 Assistente: Até logo! Tenha um ótimo dia!\n")
                break
                
            if not user_input.strip():
                continue
                
            # Mostrar indicador de processamento
            print("\n🤖 Assistente está pensando...")
            
            start = time.perf_counter()
            response, sources = query_rag(user_input)
            elapsed_time = time.perf_counter() - start
            
            # Exibir resposta com formatação
            print(f"\n🤖 Assistente: {response}")
            print(f"\n📚 Fontes consultadas: {', '.join(sources)}")
            print(f"⏱️  Tempo de resposta: {elapsed_time:.2f} segundos")
            
        except KeyboardInterrupt:
            print("\n\n🤖 Assistente: Encerrando o chat... Até logo!\n")
            break
        except Exception as e:
            print(f"\n❌ Erro: Ocorreu um problema: {str(e)}")
            continue

def main():
    chat_loop()

if __name__ == "__main__":
    main()