# FerrovIA Dashboard

Este projeto é um dashboard interativo desenvolvido em Python utilizando Streamlit para análise de dados de confiabilidade ferroviária, com integração a modelos de linguagem via LangChain e Ollama.

## Pré-requisitos

- Python 3.11 ou superior
- [Ollama](https://ollama.com/) rodando localmente ou em servidor (para uso do modelo Mistral)
- As bibliotecas listadas em [`requirements.txt`](requirements.txt)

## Instalação

1. Clone este repositório ou copie os arquivos para sua máquina.
2. Instale as dependências:
   ```sh
   pip install -r requirements.txt
   ```
3. Certifique-se de que o arquivo de dados `dados.xlsx` está na pasta `data/`.

## Como executar

1. Inicie o Ollama:
   ajuste o parâmetro `base_url` em [`FerroviaDashboard.py`](FerroviaDashboard.py) para o endereço correto do seu servidor Ollama.

2. Execute o dashboard:
   ```sh
   streamlit run FerroviaDashboard.py
   ```

3. Acesse o dashboard pelo navegador, normalmente em [http://localhost:8501](http://localhost:8501).

## Estrutura do Projeto

- [`FerroviaDashboard.py`](FerroviaDashboard.py): Código principal do dashboard.
- [`data/dados.xlsx`](data/dados.xlsx): Base de dados utilizada.
- [`requirements.txt`](requirements.txt): Dependências do projeto.

## Observações

- Para funcionamento completo, é necessário que o Ollama esteja rodando e acessível.
- As imagens utilizadas devem estar no mesmo diretório especificado no código.