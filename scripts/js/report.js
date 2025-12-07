// scripts/js/report.js

// ===============================
// ELEMENTOS DA TELA
// ===============================
const finalEventLog = document.getElementById('finalEventLog');
const reportDate = document.getElementById('reportDate');
const exportPdfBtn = document.getElementById('exportPdfBtn');
const profObservations = document.getElementById('profObservations');

// ===============================
// DADOS MOCKADOS (Fallback)
// ===============================
const MOCK_METRICS = { 
    total_time_s: 30,
    emotion_breakdown: { neutral: 18, happy: 6, sad: 3, angry: 1, fearful: 2, disgusted: 0, surprised: 0 },
    avg_focus_score: 82.5,
    confusion_count: 4, 
    events: [
        { time: 5.5, message: "🚨 Dúvida (sad) - Score: 45" },
        { time: 12.0, message: "😊 Engajado (happy) - Score: 95" },
        { time: 25.0, message: "🚨 Dúvida (angry) - Score: 50" }
    ]
};

// ===============================
// FUNÇÕES DE EXIBIÇÃO E CÁLCULO
// ===============================

// Formata o nome do arquivo (timestamp) para data legível
function formatFileNameToDate(fileName) {
    const timestampMatch = fileName.match(/(\d+)/);
    if (timestampMatch && timestampMatch[0].length > 10) {
        const timestamp = parseInt(timestampMatch[0], 10);
        const date = new Date(timestamp);
        
        return date.toLocaleDateString('pt-BR', { 
            year: 'numeric', month: 'short', day: 'numeric', 
            hour: '2-digit', minute: '2-digit', second: '2-digit' 
        });
    }
    return fileName;
}

// Formata segundos em HH:MM:SS
function formatTimeDuration(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    
    return [hours, minutes, seconds]
        .map(v => String(v).padStart(2, '0'))
        .join(':');
}


function loadReportData() {
    const storedData = localStorage.getItem('sessionMetrics');
    const metrics = storedData ? JSON.parse(storedData) : MOCK_METRICS;
    
    const totalTimeSeconds = metrics.total_time_s || 0;
    
    // Exibir duração como HH:MM:SS
    const totalTimeFormatted = formatTimeDuration(totalTimeSeconds);
    
    const rawFileName = localStorage.getItem('ultimaGravacao') || 'N/A';
    const formattedFileName = formatFileNameToDate(rawFileName);
    
    // Injeta Métricas Simples no HTML
    document.getElementById('metricDuration').textContent = totalTimeFormatted;
    document.getElementById('metricAvgScore').textContent = metrics.avg_focus_score.toFixed(1) + '%'; 
    document.getElementById('metricConfusedCount').textContent = metrics.confusion_count; 
    document.getElementById('metricFileName').textContent = `Sessão: ${formattedFileName}`; 
    reportDate.textContent = 'Data da Análise: ' + new Date().toLocaleDateString('pt-BR');
    
    // Define a cor do score baseado no desempenho
    const scoreElement = document.getElementById('metricAvgScore');
    if (metrics.avg_focus_score < 70) {
        scoreElement.classList.add('score-low');
    } else if (metrics.avg_focus_score < 85) {
        scoreElement.classList.add('score-medium');
    } else {
        scoreElement.classList.add('score-high'); 
    }

    // Injeta Logs de Eventos
    finalEventLog.innerHTML = '';
    if (metrics.events && metrics.events.length > 0) {
        metrics.events.forEach(event => {
            // Converte segundos de evento para MM:SS
            const timeSeconds = Math.floor(event.time);
            const minutes = Math.floor(timeSeconds / 60);
            const seconds = timeSeconds % 60;
            const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

            const li = document.createElement('li');
            li.textContent = `[${timeFormatted}] - ${event.message}`;
            finalEventLog.appendChild(li);
        });
    } else {
        finalEventLog.innerHTML = '<li>Nenhum evento de dispersão ou dúvida registrado.</li>';
    }

    // Prepara e inicializa o Gráfico de Rosca
    const breakdownData = Object.values(metrics.emotion_breakdown);
    initPieChart(breakdownData);
}

function initPieChart(data) {
    const ctx = document.getElementById('emotionPieChart').getContext('2d');
    
    // Mapeamento das emoções para as 3 categorias do relatório (Foco, Positivo, Negativo)
    const totalNeutral = data[0];
    const totalPositive = data[1] + data[6]; 
    const totalNegative = data[2] + data[3] + data[4] + data[5]; 

    new Chart(ctx, { 
        type: 'doughnut', 
        data: {
            labels: ['Foco/Neutro', 'Engajamento/Positivo', 'Dúvida/Negativo'],
            datasets: [{
                data: [totalNeutral, totalPositive, totalNegative],
                backgroundColor: [
                    '#28a745', 
                    '#ffc107', 
                    '#dc3545'  
                ],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                title: {
                    display: false,
                }
            }
        }
    });
}

// ===============================
// LÓGICA DE EXPORTAÇÃO PARA PDF
// ===============================
function exportToPdf() {
    
    const reportElement = document.getElementById('reportContainer'); 
    
    // Desativa temporariamente a rolagem (necessário para o html2canvas capturar todo o conteúdo)
    finalEventLog.style.overflowY = 'hidden'; 
    
    // Captura o contêiner do relatório e converte para Canvas
    html2canvas(reportElement, { scale: 2, logging: false }).then(canvas => {
        
        const { jsPDF } = window.jspdf; 
        const pdf = new jsPDF('p', 'mm', 'a4'); 
        const imgData = canvas.toDataURL('image/png');

        const imgWidth = 210; 
        const pageHeight = 295; 
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;
        
        let position = 0;

        // Adiciona a primeira página
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Lógica de Paginação para relatórios longos
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        
        pdf.save("Relatorio_Engajamento_Aluno.pdf");
        
        // Restaura a rolagem após a captura
        finalEventLog.style.overflowY = 'auto'; 
    });
}

// ===============================
// INICIALIZAÇÃO FINAL
// ===============================

document.addEventListener('DOMContentLoaded', () => {
    loadReportData();
    // Adiciona o listener para o botão de exportação
    exportPdfBtn.addEventListener('click', exportToPdf);
});