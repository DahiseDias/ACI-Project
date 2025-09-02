import streamlit as st
import pandas as pd
import os
from PIL import Image
from langchain_ollama import OllamaLLM
import time

# Crie o LLM informando o modelo
client = OllamaLLM(model="mistral", base_url="http://172.28.214.129:11434/")  # ou "mistral-7b"
# Set Streamlit layout to wide
st.set_page_config(layout="wide")

# ==============================
# Função para carregar dados
# ==============================
@st.cache_data
def load_data():
    print("[LOG] Iniciando carregamento do arquivo Excel...")
    df = pd.read_excel("D:\\Mestrado\\teste\\langchain_test\\data\\dados.xlsx", header=6)
    print(f"[LOG] Arquivo carregado com sucesso. Total de linhas: {len(df)}")

    df.columns = df.columns.str.strip()
    print(f"[LOG] Colunas carregadas: {list(df.columns)}")

    # Conversão de datas
    df['data_abertura'] = pd.to_datetime(df['data_abertura'], format="%d/%m/%Y", errors='coerce')
    df['Dt. Falha'] = pd.to_datetime(df['Dt. Falha'], format="%d/%m/%Y", errors='coerce')
    df['data_fechamento'] = pd.to_datetime(df['data_fechamento'], format="%d/%m/%Y", errors='coerce')

    # Limpeza de espaços
    for col in ['Hr. Abertura', 'Hr. Falha', 'Hora Enc.']:
        df[col] = df[col].astype(str).str.strip().str.replace(r'\s+', '', regex=True)
        df[col] = pd.to_datetime(df[col], format="%H:%M", errors='coerce').dt.time
        print(f"[LOG] Coluna '{col}' convertida para horário.")

    # Converter colunas numéricas
    df['Contador'] = pd.to_numeric(df['Contador'], errors='coerce')
    print("[LOG] Coluna 'Contador' convertida para numérico.")

    # Texto
    texto_cols = [
        'Solicitacao', 'Bem/Localiz.', 'Desc.Bem/Loc', 'Centro Trab.', 'Nome Locali.',
        'Ramal', 'Sublocal', 'Situacao S.S', 'Prioridade', 'Descricao',
        'Solucao SS', 'Ordem Servic', 'Solicitante', 'Reclamante', 'Executante',
        'Nome Exec.', 'Tipo de SS', 'Ret.Operacao', 'Vandalismo', 'Criticidade', 'Tipo Solicit'
    ]
    df[texto_cols] = df[texto_cols].astype("string")
    print("[LOG] Colunas de texto convertidas para string.")

    return df

data = load_data()
st.success("Dados carregados com sucesso!")

# ==============================
# CSS Customizado
# ==============================
st.markdown("""
    <style>
    body { background-color: #ffcccb; }
    .reportview-container .main .block-container { background-color: #ffcccb; }
    .sidebar .sidebar-content { background-color: #ffcccb; }
    .custom-card {
        background-color: white; padding: 5px; border-radius: 10px;
        border: 2px solid #d3d3d3; box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.1);
        text-align: center; margin-bottom: 10px;
    }
    .custom-card h3 { margin-bottom: 2px; }
    .custom-card p { color: #003366; font-size: 20px; font-weight: bold; }
    .card-container { display: flex; justify-content: space-between; margin-bottom: 10px; gap: 10px; }
    .centered-title { text-align: center; font-size: 32px; font-weight: bold; margin-bottom: 20px; }
    .stDataFrame div[data-testid="stHorizontalBlock"] { width: auto !important; min-width: 150px !important; }
    </style>
    """, unsafe_allow_html=True)

# ==============================
# Imagens
# ==============================
st.markdown('<h1 class="centered-title">FerrovIA Dashboard</h1>', unsafe_allow_html=True)

image2 = Image.open('AI Pic1.png')
st.sidebar.image(image2, use_column_width=True)

# ==============================
# Filtros na Sidebar
# ==============================
st.sidebar.header("Filter Options")

hotel_options = data["Bem/Localiz."].dropna().unique() if "Bem/Localiz." in data else []
year_options = data["data_abertura"].dropna().unique() if "data_abertura" in data else []
month_options = data["Hr. Abertura"].dropna().unique() if "Hr. Abertura" in data else []
market_segment_options = data["Prioridade"].dropna().unique() if "Prioridade" in data else []
country_options = data["Reclamante"].dropna().unique() if "Reclamante" in data else []

hotel_filter = st.sidebar.multiselect("Bem/Localiz.", hotel_options, default=list(hotel_options))
year_filter = st.sidebar.multiselect("data_abertura", year_options, default=list(year_options))
month_filter = st.sidebar.multiselect("Hr. Abertura", month_options, default=list(month_options))
market_segment_filter = st.sidebar.multiselect("Prioridade", market_segment_options, default=list(market_segment_options))
country_filter = st.sidebar.selectbox("Reclamante", ["All"] + list(country_options))

data_limit = st.sidebar.slider("Limit Data (Rows)", min_value=10, max_value=120000, value=200)

# ==============================
# Aplicando Filtros
# ==============================
filtered_data = data.copy()
print("[LOG] Aplicando filtros nos dados...")

if "Bem/Localiz." in filtered_data:
    filtered_data = filtered_data[filtered_data["Bem/Localiz."].isin(hotel_filter)]

if "data_abertura" in filtered_data:
    filtered_data = filtered_data[filtered_data["data_abertura"].isin(year_filter)]

if "Hr. Abertura" in filtered_data:
    filtered_data = filtered_data[filtered_data["Hr. Abertura"].isin(month_filter)]

if "Prioridade" in filtered_data:
    filtered_data = filtered_data[filtered_data["Prioridade"].isin(market_segment_filter)]

if country_filter != "All" and "Reclamante" in filtered_data:
    filtered_data = filtered_data[filtered_data["Reclamante"] == country_filter]

filtered_data = filtered_data.head(data_limit)
print(f"[LOG] Dados filtrados: {len(filtered_data)} linhas.")

# ==============================
# Métricas
# ==============================
num_rows = len(filtered_data)
num_countries = filtered_data['Reclamante'].nunique() if "Reclamante" in filtered_data else 0
num_cancellations = filtered_data['Contador'].astype(float).sum() if "Contador" in filtered_data else 0

st.markdown('<div class="card-container">', unsafe_allow_html=True)
col1, col2, col3 = st.columns(3)

with col1: st.markdown(f'<div class="custom-card"><h3>Numero de linhas</h3><p>{num_rows:,}</p></div>', unsafe_allow_html=True)
with col2: st.markdown(f'<div class="custom-card"><h3>Reclamantes</h3><p>{num_countries:,}</p></div>', unsafe_allow_html=True)
with col3: st.markdown(f'<div class="custom-card"><h3>Contador</h3><p>{num_cancellations:,}</p></div>', unsafe_allow_html=True)

st.markdown('</div>', unsafe_allow_html=True)

# ==============================
# Função para consultar modelo
# ==============================
def query_data(data_json, question):
    prompt = f"Based on the following relational data, answer the question:\n{data_json}\nQuestion: {question}"
    print("[LOG] Enviando prompt ao modelo...")
    chat_completion = client.invoke(prompt)
    print("[LOG] Resposta recebida do modelo.")
    return chat_completion

# ==============================
# Função para gerar relatório
# ==============================
def generate_report(data_json):
    
    prompt = f"""As a data analyst, your task is to generate a comprehensive reliability report for the SINCDVROD system based on the following JSON data:

{data_json}

The JSON contains failure events with these columns:
- "Falha": unique ID for each failure
- "Data de Falha": timestamp of the failure
- "Causa": root cause of failure
- "Data de Reparo": timestamp of repair

Your task is to calculate and fill in all the following fields based on the data:

RELIABILITY REPORT - SINCDVROD SYSTEM

1. INDICADORES DE CONFIABILIDADE (RELIABILITY INDICATORS)
MTTR (Mean Time To Repair)
- Average (hours): [calculate from data]
- Median (hours): [calculate from data]
- Minimum (hours): [calculate from data]
- Maximum (hours): [calculate from data]
- Average (days): [calculate from data]
- Minimum (days): [calculate from data]
- Maximum (days): [calculate from data]

MTTF (Mean Time To Failure)
- Average (hours): [calculate from data]
- Average (days): [calculate from data]
- Number of intervals used: [calculate from data]

2. DISPONIBILIDADE DO SISTEMA (SYSTEM AVAILABILITY)
- Availability (percentage): [calculate from MTTF and MTTR]
- Unavailability (percentage): [calculate from MTTF and MTTR]

3. PRINCIPAIS CAUSAS DE FALHA (TOP FAILURE CAUSES)
Rank	Cause	Number of Occurrences	Percentage of Total Failures
1	[fill with most frequent cause and stats]
2	[fill with second most frequent cause and stats]
...
15	[fill with fifteenth most frequent cause and stats]

4. RESUMEN (SUMMARY)
- Total Number of Failures: [total failures]
- Average Repair Time (MTTR): [hours and days]
- Average Time Between Failures (MTTF): [hours and days]
- Overall System Availability: [percentage]
- Most Common Cause of Failure: [most frequent cause]

5. RECOMENDACIONES (RECOMMENDATIONS)
- [list actionable recommendations to improve reliability]

Important: All fields must be **calculated using the JSON data**. Do not leave placeholders.
Use markdown formatting for clear headings and tables."""

    start = time.time()
    print("[LOG] Enviando prompt ao modelo...")
    chat_completion = client.invoke(prompt)
    print("[LOG] Resposta recebida do modelo.")
    end = time.time()
    print(f"[LOG] Tempo de resposta do modelo: {end - start:.2f} segundos")
    return chat_completion

# ==============================
# Layout com Perguntas e Tabela
# ==============================
col_left, col_right = st.columns(2)

# Perguntas (esquerda)
with col_left:
    st.subheader("Faça uma pergunta sobre o conjunto de dados")
    user_question = st.text_input("Digite sua pergunta:")


    if st.button("Perguntar a AI"):
        if user_question:
            with st.spinner("Consultando modelo..."):
                progress = st.progress(0)
                for i in range(100):
                    time.sleep(0.02)  # simulação de carregamento
                    progress.progress(i + 1)

                answer = query_data(filtered_data.to_json(orient="records"), user_question)

            st.subheader("AI Answer")
            st.write(answer)
            st.success("Resposta recebida com sucesso!")
        else:
            st.warning("Por favor, digite uma pergunta.")
    if st.button("Gerar Relatório", key="report_button"):
            with st.spinner("Gerando relatório..."):
                report = generate_report(filtered_data.to_json(orient="records"))
                st.write(report)
                st.success("Relatório gerado com sucesso!")
# Tabela (direita)
with col_right:
    st.subheader("Dados Filtrados de Reservas de Hotel")
    st.dataframe(filtered_data.astype(str))
