// Variável global para armazenar histórico de conversas
let conversation_history = [];

// Função para criar dados de exemplo garantidos para os gráficos
function createSampleChartData() {
    return {
        mttf_data: {
            labels: ['SINCDVROD', 'CIRCUITO VIA', 'SINALIZAÇÃO', 'TELECOMUNICAÇÃO', 'ENERGIA'],
            values: [2840, 3200, 2950, 4100, 3650],
            title: 'MTTF por Subsistema (horas)'
        },
        mttr_data: {
            labels: ['SINCDVROD', 'CIRCUITO VIA', 'SINALIZAÇÃO', 'TELECOMUNICAÇÃO', 'ENERGIA'],
            values: [4.2, 6.8, 5.1, 3.9, 7.2],
            title: 'MTTR por Subsistema (horas)'
        },
        availability_data: {
            labels: ['SINCDVROD', 'CIRCUITO VIA', 'SINALIZAÇÃO', 'TELECOMUNICAÇÃO', 'ENERGIA'],
            values: [99.85, 99.78, 99.83, 99.90, 99.80],
            title: 'Disponibilidade por Subsistema (%)'
        },
        failure_systems: {
            labels: ['CIRCUITO VIA', 'SINALIZAÇÃO', 'SINCDVROD', 'ENERGIA', 'TELECOMUNICAÇÃO'],
            values: [45, 38, 32, 28, 22],
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

// Lista de subsistemas para detecção GARANTIDA
const subsystems = [
    'SINCDVROD', 'CIRCUITO VIA', 'SINALIZAÇÃO', 'TELECOMUNICAÇÃO', 'ENERGIA',
    'sincdvrod', 'circuito via', 'sinalização', 'telecomunicação', 'energia'
];

function waitForChartJS(callback) {
    if (typeof Chart !== 'undefined') {
        callback();
    } else {
        setTimeout(() => waitForChartJS(callback), 100);
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
function initializeCharts() {
    // Gráfico MTTF
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

    // Gráfico MTTR
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

    // Gráfico Disponibilidade
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
                    min: 99.5,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Percentual (%)'
                    }
                }
            }
        }
    });

    // Gráfico Falhas por Subsistema
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
                    'rgba(153, 102, 255, 0.8)'
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

function sendQuestion() {
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

    // Processar pergunta
    setTimeout(() => {
        processQuestion(question);
    }, 1000);
}

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

function processQuestion(question) {
    // Simular processamento da pergunta
    setTimeout(() => {
        const result = generateDemoAnswer(question);
        displayResult(result, question);
    }, 2000);
}

function generateDemoAnswer(question) {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('sincdvrod')) {
        return {
            answer: "O SINCDVROD apresenta MTTF de 2.840 horas e MTTR de 4,2 horas, resultando em disponibilidade de 99,85%. Este subsistema representa 19,4% das ocorrências totais do sistema[...]",
            confidence: 89.5,
            sources: ["Documento 1", "Documento 2", "Documento 3"],
            subsystem: 'SINCDVROD'
        };
    } else if (lowerQuestion.includes('circuito') || lowerQuestion.includes('via')) {
        return {
            answer: "O CIRCUITO VIA é o subsistema com maior número de ocorrências (45 registros - 27,3% do total). Apresenta MTTF de 3.200 horas e MTTR de 6,8 horas, com disponibilidade de 99,78%.",
            confidence: 92.1,
            sources: ["Documento 1", "Documento 2"],
            subsystem: 'CIRCUITO VIA'
        };
    } else if (lowerQuestion.includes('sinalização')) {
        return {
            answer: "O sistema de SINALIZAÇÃO registra 38 ocorrências (23% do total), com MTTF de 2.950 horas e MTTR de 5,1 horas. A disponibilidade é de 99,83%. É o segundo subsistema em ocorrências.",
            confidence: 87.8,
            sources: ["Documento 1", "Documento 2", "Documento 3"],
            subsystem: 'SINALIZAÇÃO'
        };
    } else if (lowerQuestion.includes('telecomunicação')) {
        return {
            answer: "TELECOMUNICAÇÃO é o subsistema com melhor desempenho: maior MTTF (4.100h), menor MTTR (3,9h) e maior disponibilidade (99,90%). Apenas 22 ocorrências registradas (13,3%).",
            confidence: 94.2,
            sources: ["Documento 1", "Documento 2"],
            subsystem: 'TELECOMUNICAÇÃO'
        };
    } else if (lowerQuestion.includes('energia')) {
        return {
            answer: "O sistema de ENERGIA apresenta 28 ocorrências (17% do total), MTTF de 3.650 horas e o maior MTTR (7,2 horas). Disponibilidade de 99,80%. O alto MTTR indica necessidade de atenção.",
            confidence: 88.7,
            sources: ["Documento 1", "Documento 2", "Documento 3"],
            subsystem: 'ENERGIA'
        };
    } else {
        return {
            answer: "Esta é uma resposta de demonstração. Para ver o botão 'Mais Resultados', faça perguntas específicas sobre os subsistemas: SINCDVROD, CIRCUITO VIA, SINALIZAÇÃO, TELECOMUNICAÇÃO ou ENERGIA.",
            confidence: 75.0,
            sources: ["Documento 1"]
        };
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

    const bubbleDiv = document.createElement('div');
    bubbleDiv.classList.add('bubble');
    bubbleDiv.innerHTML = text;

    messageDiv.appendChild(bubbleDiv);
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

window.onload = function() {
    waitForChartJS(initializeCharts);
    initializeTabs();
};