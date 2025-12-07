// scripts/js/teacher_dashboard.js

// ===============================
// ELEMENTOS DA TELA
// ===============================
const video = document.getElementById("video");
const overlay = document.getElementById("overlay");
const analysisStatus = document.getElementById("analysisStatus");
const focusSemaphore = document.getElementById("focusSemaphore");
const focusScore = document.getElementById("focusScore");
const dominantEmotion = document.getElementById("dominantEmotion");
const fileNameDisplay = document.getElementById("fileNameDisplay");
const eventLog = document.getElementById("eventLog");
const videoListContainer = document.getElementById("videoListContainer"); 
const galleryToggleBtn = document.getElementById("galleryToggleBtn"); 
const toggleIcon = document.getElementById("toggleIcon"); 

// ===============================
// VARIÁVEIS DE CONFIGURAÇÃO E ESTADO
// ===============================
const BACKEND_URL = 'http://localhost:3000';
const FACE_DETECTION_INTERVAL = 100;
const CHART_UPDATE_INTERVAL = 2000;

let chartInstance = null;
let chartLabels = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised'];
let emotionHistory = chartLabels.map(() => 0); 
let analysisIntervalId = null; 
let logList = [];
let confusionCount = 0;

// ===============================
// INICIALIZAÇÃO E SETUP
// ===============================
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri("scripts/models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("scripts/models"),
    faceapi.nets.faceExpressionNet.loadFromUri("scripts/models"),
    faceapi.nets.ageGenderNet.loadFromUri("scripts/models")
])
    .then(setupControls)
    .catch(err => analysisStatus.textContent = 'ERRO: Falha ao carregar modelos de análise.');

function setupControls() {
    analysisStatus.textContent = 'Modelos de análise carregados.';
    listAvailableVideos(); 
    
    // Configura o botão da galeria
    galleryToggleBtn.addEventListener('click', toggleGallery);
}

// Gerencia o estado EXPANDIDO/RECOLHIDO da galeria
function toggleGallery() {
    const isExpanded = videoListContainer.classList.contains('expanded');

    if (isExpanded) {
        videoListContainer.classList.remove('expanded');
        toggleIcon.classList.remove('rotated');
    } else {
        videoListContainer.classList.add('expanded');
        toggleIcon.classList.add('rotated');
    }
}

// ===============================
// LÓGICA DE GALERIA E CARREGAMENTO
// ===============================

// Função auxiliar para formatar o nome do arquivo (timestamp) para data legível
function formatFileNameToDate(fileName) {
    const timestampMatch = fileName.match(/(\d+)/);
    if (timestampMatch && timestampMatch[0].length > 10) {
        const timestamp = parseInt(timestampMatch[0], 10);
        const date = new Date(timestamp);
        
        return date.toLocaleString('pt-BR', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    }
    return fileName;
}

// Busca a lista de arquivos no servidor Node.js
async function listAvailableVideos() {
    analysisStatus.textContent = 'Buscando gravações disponíveis...';
    videoListContainer.innerHTML = '<h3>Carregando...</h3>';
    
    try {
        const response = await fetch(`${BACKEND_URL}/list-videos`);
        const data = await response.json();

        if (response.ok && data.files && data.files.length > 0) {
            
            videoListContainer.innerHTML = '<h3>Gravações Encontradas:</h3>';

            // Ordena os arquivos pelo mais recente
            const sortedFiles = data.files.sort((a, b) => {
                const timeA = parseInt(a.match(/(\d+)/)?.[0] || 0, 10);
                const timeB = parseInt(b.match(/(\d+)/)?.[0] || 0, 10);
                return timeB - timeA; 
            });

            sortedFiles.forEach(fileName => {
                const displayLabel = formatFileNameToDate(fileName);
                
                const button = document.createElement('button');
                button.className = 'btn-gallery-item';
                button.textContent = displayLabel;
                
                button.addEventListener('click', () => {
                    loadVideoByFileName(fileName, displayLabel);
                });
                
                videoListContainer.appendChild(button);
            });

            analysisStatus.textContent = `${data.files.length} sessões prontas para análise. Clique para selecionar.`;
            
        } else {
            videoListContainer.innerHTML = '<h3>Nenhuma gravação encontrada no servidor.</h3>';
            analysisStatus.textContent = 'Nenhuma sessão disponível para análise.';
        }
    } catch (error) {
        // console.error("ERRO ao listar vídeos:", error); // Removido console.error
        videoListContainer.innerHTML = '<h3>Erro: Servidor de listagem indisponível.</h3>';
        analysisStatus.textContent = 'ERRO de conexão ao listar vídeos.';
    }
}

// Carrega o vídeo selecionado e inicia a análise (Substitui loadRecordedVideo)
function loadVideoByFileName(fileName, displayLabel) {
    // 1. Limpa o loop de análise anterior, se houver
    if (analysisIntervalId) {
        clearInterval(analysisIntervalId);
    }
    
    // 2. Acessa o vídeo salvo usando a rota estática do servidor Node.js
    const videoUrl = `${BACKEND_URL}/videos/${fileName}`;
    video.src = videoUrl;

    fileNameDisplay.textContent = displayLabel; 
    analysisStatus.textContent = 'Vídeo carregado. Pressione PLAY para reanálise.';
    
    // Configura o atributo crossorigin (essencial para resolver o erro CORS/WebGL)
    video.setAttribute('crossorigin', 'anonymous'); 
    video.load(); 
    
    // 3. Adiciona o listener para iniciar a análise quando o vídeo começar a ser reproduzido
    video.removeEventListener('playing', startAnalysisLoop);
    video.addEventListener('playing', startAnalysisLoop, { once: true });
}


// ===============================
// REGRAS DE INTERPRETAÇÃO EMOCIONAL (Regra 3)
// ===============================
function getFocusStatus(expressions) {
    const sorted = expressions.asSortedArray();
    const dominant = sorted[0];

    // Lógica para Score
    let score = dominant.probability * 100;
    const negativeScore = (expressions.sad + expressions.fearful + expressions.angry) * 100;
    score = Math.max(0, score - negativeScore * 0.5); 

    let status = 'Focado';
    let color = 'green';
    
    // Regra 3: Interpretação para Semáforo e Status
    if (dominant.expression === 'neutral' && dominant.probability > 0.8) {
        status = 'Neutro / Focado';
        color = 'green';
    } else if (dominant.expression === 'happy' || dominant.expression === 'surprise') {
        status = 'Engajado / Receptivo';
        color = 'yellow';
    } else if (negativeScore > 20 || expressions.disgusted > 0.4) {
        status = 'Dúvida / Frustrado';
        color = 'red';
    } else if (dominant.expression === 'neutral' && dominant.probability < 0.5) {
          status = 'Entediado / Disperso';
          color = 'yellow';
    }

    if (status === 'Dúvida / Frustrado' || status === 'Entediado / Disperso') {
          logEvent(`🚨 ${status} (${dominant.expression}) - Score: ${Math.round(score)}`);
    }

    return { score, status, color, dominantEmotion: dominant.expression };
}

// ===============================
// LOOP PRINCIPAL DE ANÁLISE NO VÍDEO (Regra 2)
// ===============================
function startAnalysisLoop() {
    
    if (!chartInstance) {
        initEmotionChart();
    }
    
    // Usa as dimensões renderizadas
    const displaySize = { width: video.offsetWidth, height: video.offsetHeight }; 
    faceapi.matchDimensions(overlay, displaySize);
    
    // Zera o histórico do gráfico e o log para a nova análise
    emotionHistory = emotionHistory.map(() => 0); 
    if (chartInstance) {
        chartInstance.data.datasets[0].data = emotionHistory;
        chartInstance.update();
    }
    eventLog.innerHTML = '<li>[00:00:00] - Análise de gravação iniciada.</li>';


    analysisIntervalId = setInterval(async () => {
        
        if (video.paused || video.ended) {
            clearInterval(analysisIntervalId);
            analysisStatus.textContent = 'Análise de gravação finalizada.';
            logEvent(`Fim da análise [${video.currentTime.toFixed(2)}s]`);

            saveFinalMetrics();

            return;
        }

        const detection = await faceapi
            .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions()
            .withAgeAndGender();
        
        const ctx = overlay.getContext('2d');
        ctx.clearRect(0, 0, overlay.width, overlay.height);

        if (detection) {
            
            // Redimensiona os resultados
            const resized = faceapi.resizeResults(detection, displaySize);
            
            const focusData = getFocusStatus(resized.expressions);
            
            updateMetrics(focusData);
            
            // Desenhar Bounding Box (Comentado para simplificação, mas pronto para uso)
            /*
            const age = Math.round(resized.age);
            const gender = resized.gender === 'male' ? 'H' : 'M';
            const label = `${focusData.dominantEmotion} | ${gender} | ${age}`;
            
            new faceapi.draw.DrawBox(resized.detection.box, {
                label: label,
                lineWidth: 2,
                boxColor: focusData.color 
            }).draw(overlay);
            */
            
            updateChartData(resized.expressions);

        }

    }, FACE_DETECTION_INTERVAL); 
}

// ===============================
// FUNÇÕES DE UTILIDADE (UI/Chart)
// ===============================

function updateMetrics(focusData) {
    focusScore.textContent = focusData.score.toFixed(2);
    dominantEmotion.textContent = focusData.dominantEmotion.toUpperCase();
    
    focusSemaphore.className = 'semaphore ' + focusData.color;
    analysisStatus.textContent = `Análise em tempo real: ${focusData.status}`;
}

let lastChartUpdate = 0;
function updateChartData(expressions) {
      const now = Date.now();
      if (now - lastChartUpdate < CHART_UPDATE_INTERVAL) return;
      lastChartUpdate = now;

      chartLabels.forEach((label, index) => {
          // Acumula em proporção ao tempo de detecção
          emotionHistory[index] += expressions[label] * (FACE_DETECTION_INTERVAL / 1000); 
      });
      
      if (chartInstance) {
          chartLabels.forEach((label, index) => {
              chartInstance.data.datasets[0].data[index] = emotionHistory[index];
          });
          chartInstance.update();
      }
}

function initEmotionChart() {
    const ctx = document.getElementById('emotionChart').getContext('2d');
    
    chartInstance = new Chart(ctx, {
        type: 'bar', 
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Ocorrência Acumulada (Segundos)',
                data: emotionHistory,
                backgroundColor: 'rgba(74, 122, 255, 0.6)',
                borderColor: 'rgba(74, 122, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Score Acumulado'
                    }
                }
            }
        }
    });
}

function logEvent(message) {
    let timeFormatted = '00:00:00'; 
    
    // Captura o tempo numérico (em segundos)
    const timeSeconds = video.currentTime || 0; 
    
    if (timeSeconds) {
        // Formata o tempo para exibição [HH:MM:SS]
        timeFormatted = new Date(timeSeconds * 1000).toISOString().substr(11, 8);
    }
    
    // 1. Injeta no Log de Eventos (UI)
    const listItem = document.createElement('li');
    listItem.innerHTML = `[${timeFormatted}] - ${message}`;
    eventLog.prepend(listItem); 

    // 2. Salva no logList (Dados)
    logList.push({ time: timeSeconds, message: message });
    
    // 3. Contagem de Confusão
    if (message.includes('Dúvida') || message.includes('Disperso')) {
        confusionCount++;
    }
}

function saveFinalMetrics() {
    // Calcula o score médio (simulação)
    const mockAvgScore = Math.floor(Math.random() * (95 - 75 + 1)) + 75; 

    // Mapeia o emotionHistory para a estrutura do relatório
    const emotionBreakdown = {};
    chartLabels.forEach((label, index) => {
        emotionBreakdown[label] = emotionHistory[index];
    });

    const finalMetrics = {
        total_time_s: video.duration || 0,
        emotion_breakdown: emotionBreakdown,
        avg_focus_score: mockAvgScore, 
        confusion_count: confusionCount,
        events: logList
    };

    // Armazena o objeto como uma string JSON no localStorage
    localStorage.setItem('sessionMetrics', JSON.stringify(finalMetrics));
    
    // Limpa os logs/dados de estado para a próxima análise
    logList = []; 
    confusionCount = 0;
}