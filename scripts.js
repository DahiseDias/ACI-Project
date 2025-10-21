// Variável global para armazenar histórico de conversas
let conversation_history = [];

// Configuração da URL da API para fácil manutenção e deploy
const API_BASE_URL = 'http://127.0.0.1:8000/agents/echo';

// Função para buscar dados MTTR da API
async function fetchMTTRData() {
    try {
        const response = await fetch('http://127.0.0.1:8000/metrics/mttr');
        const data = await response.json();
        
        // Sort by MTTR hours in descending order and get top 10
        const top10Data = data
            .sort((a, b) => b.mttr_horas - a.mttr_horas)
            .slice(0, 10);

        return {
            labels: top10Data.map(item => item.subsistema),
            values: top10Data.map(item => item.mttr_horas)
        };
    } catch (error) {
        console.error('Erro ao buscar dados MTTR:', error);
        return null;
    }
}

// Função para buscar dados MTTF da API
async function fetchMTTFData() {
    try {
        const response = await fetch('http://127.0.0.1:8000/metrics/mttf');
        const data = await response.json();
        
        // Sort by MTTF days in descending order and get top 10
        const top10Data = data
            .sort((a, b) => b.mttf_dias - a.mttf_dias)
            .slice(0, 10);

        return {
            labels: top10Data.map(item => item.subsistema),
            // Convertendo dias para horas (1 dia = 24 horas)
            values: top10Data.map(item => item.mttf_dias * 24)
        };
    } catch (error) {
        console.error('Erro ao buscar dados MTTF:', error);
        return null;
    }
}

// Função para buscar dados de disponibilidade da API
async function fetchAvailabilityData() {
    try {
        const response = await fetch('http://127.0.0.1:8000/metrics/disponibilidade');
        const data = await response.json();
        
        // Sort by availability in descending order and get top 10
        const top10Data = data
            .sort((a, b) => b.disponibilidade - a.disponibilidade)
            .slice(0, 10);

        return {
            labels: top10Data.map(item => item.subsistema),
            values: top10Data.map(item => item.disponibilidade)
        };
    } catch (error) {
        console.error('Erro ao buscar dados de disponibilidade:', error);
        return null;
    }
}

// Função para buscar dados de falhas da API
async function fetchFailureData() {
    try {
        const response = await fetch('http://127.0.0.1:8000/metrics/falhas');
        const data = await response.json();
        
        // Sort by number of failures in descending order and get top 10
        const top10Data = data
            .sort((a, b) => b.quantidade_falhas - a.quantidade_falhas)
            .slice(0, 10);

        return {
            labels: top10Data.map(item => item.subsistema),
            values: top10Data.map(item => item.quantidade_falhas)
        };
    } catch (error) {
        console.error('Erro ao buscar dados de falhas:', error);
        return null;
    }
}

// Função para criar dados de exemplo garantidos para os gráficos
function createSampleChartData() {
    return {
        mttf_data: {
            labels: [],
            values: [],
            title: 'MTTF por Subsistema (horas)'
        },
        mttr_data: {
            labels: [],
            values: [],
            title: 'MTTR por Subsistema (horas)'
        },
        availability_data: {
            labels: [],
            values: [],
            title: 'Disponibilidade por Subsistema (%)'
        },
        failure_systems: {
            labels: [],
            values: [],
            title: 'Subsistemas que Mais Falham'
        }
    };
}

// Função para retornar métricas específicas de um subsistema
function getSubsystemMetrics(subsystemName) {
    const metrics = {
        'SINCDVROD': {
            mttf: 2840,
            mttr: 4.2,
            availability: 99.85,
            occurrences: 32,
            percentage: 19.4
        },
        'CIRCUITO VIA': {
            mttf: 3200,
            mttr: 6.8,
            availability: 99.78,
            occurrences: 45,
            percentage: 27.3
        },
        'SINALIZAÇÃO': {
            mttf: 2950,
            mttr: 5.1,
            availability: 99.83,
            occurrences: 38,
            percentage: 23.0
        },
        'TELECOMUNICAÇÃO': {
            mttf: 4100,
            mttr: 3.9,
            availability: 99.90,
            occurrences: 22,
            percentage: 13.3
        },
        'ENERGIA': {
            mttf: 3650,
            mttr: 7.2,
            availability: 99.80,
            occurrences: 28,
            percentage: 17.0
        }
    };

    return metrics[subsystemName.toUpperCase()] || {
        mttf: 3000,
        mttr: 5.0,
        availability: 99.80,
        occurrences: 25,
        percentage: 15.0
    };
}

// Usar dados de exemplo garantidos
chart_data = createSampleChartData();

// Exemplo de uso:
// console.log(createSampleChartData());
// console.log(getSubsystemMetrics("energia"));

const chartData = chart_data;
let charts = {};


function waitForChartJS(callback) {
    if (typeof Chart !== 'undefined') {
        callback();
    } else {
        setTimeout(() => waitForChartJS(callback), 100);
    }
}

// Add this function after the conversation_history declaration at the top
async function getLlmResponseFromQA(userInput) {
    console.log(`Processing question with QA: ${userInput}`);
    
    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: userInput })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Aguarda e lê o corpo da resposta
        const result = await response.json();
        console.log("Response from API:", result);

        // Retorna o conteúdo da resposta da API
        return result.text;

    } catch (error) {
        console.error(`Error calling QA: ${error}`);
        return { error: `Error processing your request: ${error.message}` };
    }
}


// Modify the processQuestion function to use the new QA function
async function processQuestion(question) {
    try {
        const result = await getLlmResponseFromQA(question);
        // If you want to keep the demo functionality while testing:
        //const demoResult = generateDemoAnswer(question);
        
        // Combine the LLM response with your existing display logic
        displayResult({
            answer: result,
            confidence: null,
            sources: null,
            subsystem: extractSubsystemFromQuestion(question)
        }, question);
    } catch (error) {
        console.error('Error processing question:', error);
        displayResult({
            error: true,
            answer: 'Sorry, there was an error processing your question.'
        }, question);
    }
}

// Update the sendQuestion function to handle async/await
async function sendQuestion() {
    const input = document.getElementById('questionInput');
    const question = input.value.trim();

    if (!question) {
        alert('Por favor, digite uma pergunta!');
        return;
    }

    // Adicionar pergunta do usuário
    addMessage(question, 'user');

    // Limpar input e mostrar loading
    input.value = '';
    showLoading(true);

    // Process question with await
    try {
        await processQuestion(question);
    } catch (error) {
        console.error('Error in sendQuestion:', error);
        showLoading(false);
        addMessage('Desculpe, ocorreu um erro ao processar sua pergunta.', 'ai');
    }
}

// Add this to your chart configuration options
const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom',
            labels: {
                boxWidth: 12,
                padding: 15,
                font: {
                    size: 12
                }
            }
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            ticks: {
                font: {
                    size: 11
                }
            }
        },
        x: {
            ticks: {
                font: {
                    size: 11
                }
            }
        }
    }
};

// Inicializar gráficos
async function initializeCharts() {
    // Gráfico MTTF - Agora usando dados da API
    const mttfData = await fetchMTTFData();
    if (mttfData) {
        chartData.mttf_data.labels = mttfData.labels;
        chartData.mttf_data.values = mttfData.values;
    }

    const ctx1 = document.getElementById('mttfChart').getContext('2d');
    charts.mttf = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: chartData.mttf_data.labels,
            datasets: [{
                label: 'MTTF (horas)',
                data: chartData.mttf_data.values,
                backgroundColor: 'rgba(79, 172, 254, 0.8)',
                borderColor: 'rgba(79, 172, 254, 1)',
                borderWidth: 2
            }]
        },
        options: chartOptions
    });

    // Gráfico MTTR - Agora usando dados da API
    const mttrData = await fetchMTTRData();
    if (mttrData) {
        chartData.mttr_data.labels = mttrData.labels;
        chartData.mttr_data.values = mttrData.values;
    }
    
    const ctx2 = document.getElementById('mttrChart').getContext('2d');
    charts.mttr = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: chartData.mttr_data.labels,
            datasets: [{
                label: 'MTTR (horas)',
                data: chartData.mttr_data.values,
                backgroundColor: 'rgba(255, 99, 132, 0.8)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 2
            }]
        },
        options: chartOptions
    });

    // Gráfico Disponibilidade - Agora usando dados da API
    const availabilityData = await fetchAvailabilityData();
    if (availabilityData) {
        chartData.availability_data.labels = availabilityData.labels;
        chartData.availability_data.values = availabilityData.values;
    }

    const ctx3 = document.getElementById('availabilityChart').getContext('2d');
    charts.availability = new Chart(ctx3, {
        type: 'line',
        data: {
            labels: chartData.availability_data.labels,
            datasets: [{
                label: 'Disponibilidade (%)',
                data: chartData.availability_data.values,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    min: Math.min(...(chartData.availability_data.values.length ? chartData.availability_data.values : [99.5])) - 0.1,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Percentual (%)'
                    }
                }
            }
        }
    });

    // Gráfico Falhas por Subsistema - Agora usando dados da API
    const failureData = await fetchFailureData();
    if (failureData) {
        chartData.failure_systems.labels = failureData.labels;
        chartData.failure_systems.values = failureData.values;
    }

    const ctx4 = document.getElementById('failureChart').getContext('2d');
    charts.failure = new Chart(ctx4, {
        type: 'doughnut',
        data: {
            labels: chartData.failure_systems.labels,
            datasets: [{
                label: 'Número de Falhas',
                data: chartData.failure_systems.values,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 205, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)',
                    'rgba(255, 159, 64, 0.8)',
                    'rgba(201, 203, 207, 0.8)',
                    'rgba(255, 99, 255, 0.8)',
                    'rgba(99, 255, 132, 0.8)',
                    'rgba(132, 99, 255, 0.8)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'right'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((acc, curr) => acc + curr, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} falhas (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    // Atualizar status
    document.getElementById('chartStatus').innerHTML = '✅ Todos os gráficos carregados com sucesso!';
    document.getElementById('chartStatus').style.background = '#d4edda';
}

function initializeTabs() {
    const tabs = document.querySelectorAll('.tab-button');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and sections
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding section
            tab.classList.add('active');
            const targetSection = document.getElementById(tab.dataset.tab + 'Section');
            targetSection.classList.add('active');
        });
    });
}

function setQuestion(question) {
    document.getElementById('questionInput').value = question;
    document.getElementById('questionInput').focus();
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendQuestion();
    }
}

// function sendQuestion() {
//     const input = document.getElementById('questionInput');
//     const question = input.value.trim();

//     if (!question) {
//         alert('Por favor, digite uma pergunta!');
//         return;
//     }

//     // Adicionar pergunta do usuário
//     addMessage(question, 'user');

//     // Limpar input e mostrar loading
//     input.value = '';
//     showLoading(true);

//     // Processar pergunta
//     setTimeout(() => {
//         processQuestion(question);
//     }, 1000);
// }

function showLoading(show) {
    const loading = document.getElementById('loading');
    const sendButton = document.getElementById('sendButton');

    loading.style.display = show ? 'block' : 'none';
    sendButton.disabled = show;

    if (show) {
        const chatContainer = document.getElementById('chatContainer');
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}


function extractSubsystemFromQuestion(question) {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('sincdvrod')) return 'SINCDVROD';
    if (lowerQuestion.includes('circuito') || lowerQuestion.includes('via')) return 'CIRCUITO VIA';
    if (lowerQuestion.includes('sinalização')) return 'SINALIZAÇÃO';
    if (lowerQuestion.includes('telecomunicação')) return 'TELECOMUNICAÇÃO';
    if (lowerQuestion.includes('energia')) return 'ENERGIA';

    return null;
}

function displayResult(result, question) {
    showLoading(false);

    // Verificar se a pergunta é sobre métricas para destacar gráficos
    const isMetricQuestion = question.toLowerCase().includes('mttf') ||
        question.toLowerCase().includes('mttr') ||
        question.toLowerCase().includes('disponibilidade') ||
        question.toLowerCase().includes('falham');

    // Extrair subsistema da pergunta
    const subsystem = result.subsystem || extractSubsystemFromQuestion(question);

    if (result.error) {
        addMessage(`❌ ${result.answer}`, 'ai');
    } else {
        // SEMPRE passar o subsistema se detectado
        addMessage(result.answer, 'ai', result.confidence, result.sources, isMetricQuestion, subsystem);
    }

    // Destacar gráficos relevantes se for pergunta sobre métricas
    if (isMetricQuestion) {
        highlightRelevantCharts(question);
    }
}

function highlightRelevantCharts(question) {
    // Remover destaque anterior
    document.querySelectorAll('.chart-container').forEach(container => {
        container.classList.remove('highlighted');
    });
    const lowerQuestion = question.toLowerCase();
    if (lowerQuestion.includes('mttf')) {
        document.getElementById('mttfContainer').classList.add('highlighted');
    }
    if (lowerQuestion.includes('mttr')) {
        document.getElementById('mttrContainer').classList.add('highlighted');
    }
    if (lowerQuestion.includes('disponibilidade')) {
        document.getElementById('availabilityContainer').classList.add('highlighted');
    }
    if (lowerQuestion.includes('falham')) {
        document.getElementById('failureContainer').classList.add('highlighted');
    }
}

// Função para adicionar mensagens ao chat
function addMessage(text, sender, confidence = null, sources = null, isMetricQuestion = false, subsystem = null) {
    const chatContainer = document.getElementById('chatContainer');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(sender === 'user' ? 'user-message' : 'ai-message');

    let messageContent = '';
    
    if (sender === 'ai') {
        // Adiciona o perfil da IA em todas as mensagens do assistente
        messageContent += `
            <div class="ai-profile">
                <img src="Avatar.png" alt="AI Assistant" class="ai-avatar">
            </div>
        `;
    }

    messageContent += `<div class="bubble">`;
    messageContent += text;

    // Adiciona informações de confiança se disponíveis
    if (confidence !== null) {
        messageContent += `
            <div class="confidence-info">
                <small>Confiança: ${(confidence * 100).toFixed(1)}%</small>
            </div>
        `;
    }

    // Adiciona fontes se disponíveis
    if (sources && sources.length > 0) {
        messageContent += `
            <div class="sources-info">
                <small>Fontes: ${sources.join(', ')}</small>
            </div>
        `;
    }

    messageContent += `</div>`;
    messageDiv.innerHTML = messageContent;
    
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

window.onload = function() {
    waitForChartJS(async () => {
        await initializeCharts();
        initializeTabs();
    });
};