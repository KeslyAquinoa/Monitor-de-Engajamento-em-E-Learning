// scripts/js/student_session.js

// ===============================
// ELEMENTOS DA TELA
// ===============================
const video = document.getElementById("video");
const overlay = document.getElementById("overlay");
const popup = document.getElementById("popup");
const successModal = document.getElementById('successModal');

// Botões de controle
const endSessionBtn = document.getElementById('endSessionBtn');
const startSessionBtn = document.getElementById('startSessionBtn');
const studentStatus = document.getElementById('studentStatus');

// ===============================
// VARIÁVEIS DE BACKEND E GRAVAÇÃO
// ===============================
const BACKEND_URL = "http://localhost:3000";

let mediaRecorder = null;
let recordedChunks = [];
let mediaStream = null;
let isRecording = false;

let uploadStarted = false;

// ===============================
// EXPRESSÕES TRADUZIDAS
// ===============================
const expressoesTraduzidas = {
    neutral: "Neutro",
    happy: "Feliz",
    sad: "Triste",
    angry: "Raiva",
    fearful: "Medo",
    disgusted: "Nojo",
    surprised: "Surpresa"
};

// ===============================
// VARIÁVEIS DE ENGAJAMENTO (Heurísticas de popup)
// ===============================
let ultimaExpressao = null;
let repeticoes = 0;
let tempoInicioExpressao = Date.now();

const REPEAT_LIMIT = 3;    // Quantidade de detecções iguais para considerar um evento
const TIME_LIMIT = 5000;   // Tempo limite para a mesma expressão (5s)
const COOLDOWN = 15000;    // Tempo mínimo entre popups (15s)

let ultimoPopup = 0;

// ===============================
// POPUP DE FEEDBACK
// ===============================
function showPopup(message) {
    const agora = Date.now();
    if (agora - ultimoPopup < COOLDOWN) return;

    ultimoPopup = agora;

    popup.innerText = message;
    popup.classList.remove("hidden");
    popup.classList.add("show");

    // Exibição por 5 segundos
    setTimeout(() => {
        popup.classList.remove("show");
        setTimeout(() => popup.classList.add("hidden"), 300);
    }, 500);
}

// ===============================
// FUNÇÃO AUXILIAR PARA SUCESSO E REDIRECIONAMENTO
// ===============================
function handleUploadSuccess(fileName) {
    localStorage.setItem('ultimaGravacao', fileName);

    // Mostra o modal de sucesso (30 segundos)
    successModal.classList.add('show');

    setTimeout(() => {
        successModal.classList.remove('show');
        window.location.href = 'login.html';
    }, 30000); 
}

// ===============================
// ENVIO DO VÍDEO AO BACKEND
// ===============================
async function uploadToServer(blob) {
    if (uploadStarted) {
        return; 
    }
    
    uploadStarted = true; 
    
    const formData = new FormData();
    formData.append("webcamVideo", blob, "sessao_aluno.webm");

    try {
        endSessionBtn.textContent = "Enviando gravação...";
        endSessionBtn.disabled = true;
        studentStatus.textContent = "Finalizando (upload...)";

        const response = await fetch(`${BACKEND_URL}/upload-video`, {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            handleUploadSuccess(data.fileName); 
            return; 
        } else {
            alert(`❌ Erro: ${data.message}`);
            uploadStarted = false; 
        }
    } catch (e) {
        // console.error("ERRO NO UPLOAD:", e); // Removido console.error
        alert("❌ Não foi possível enviar o vídeo. Servidor está rodando?");
        uploadStarted = false; 
        
    } finally {
        // Reverte o estado em caso de falha.
        if (uploadStarted === false) {
             endSessionBtn.textContent = "⏹️ Finalizar Sessão"; 
             endSessionBtn.disabled = false;
             studentStatus.textContent = "Falha no envio. Tente novamente.";
        }
    }
}

// ===============================
// INICIAR GRAVAÇÃO
// ===============================
function startRecording() {
    if (isRecording) return;

    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            mediaStream = stream;
            video.srcObject = stream;

            video.onloadedmetadata = () => video.play();

            const options = [
                "video/webm;codecs=vp9",
                "video/webm;codecs=vp8",
                "video/webm"
            ].find(type => MediaRecorder.isTypeSupported(type));

            mediaRecorder = new MediaRecorder(stream, { mimeType: options });

            recordedChunks.length = 0;

            mediaRecorder.ondataavailable = e => {
                if (e.data.size > 0) {
                    recordedChunks.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunks, { type: "video/webm" });
                uploadToServer(blob);
            };

            mediaRecorder.start(1000);
            isRecording = true;

            studentStatus.textContent = "Monitoramento ativo (gravando...)";
            startSessionBtn.style.display = "none";
            endSessionBtn.style.display = "block";
        })
        .catch(err => {
            // console.error("Erro webcam:", err); // Removido console.error
            alert("❌ Permissão da webcam negada ou indisponível.");
        });
}

// ===============================
// PARAR GRAVAÇÃO
// ===============================
function stopRecording() {
    if (!isRecording) {
        window.location.href = "login.html";
        return;
    }

    isRecording = false;

    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
    }

    if (mediaStream) {
        mediaStream.getTracks().forEach(t => t.stop());
        video.srcObject = null;
    }
}

// ===============================
// CARREGAR MODELOS FACE-API
// ===============================
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri("scripts/models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("scripts/models"),
    faceapi.nets.faceExpressionNet.loadFromUri("scripts/models"),
    faceapi.nets.ageGenderNet.loadFromUri("scripts/models")
])
    .then(() => {
        studentStatus.textContent = "Modelos carregados. Clique em Iniciar.";
        startSessionBtn.addEventListener("click", startRecording);
        endSessionBtn.addEventListener("click", stopRecording);
    })
    .catch(err => alert("Erro carregando modelos. Verifique a pasta 'models'.")); // Simplificada a mensagem de erro

// ===============================
// LOOP DA FACE-API
// ===============================
video.addEventListener("play", () => {
    overlay.width = video.width;
    overlay.height = video.height;
    const ctx = overlay.getContext("2d");

    // Loop de detecção facial a cada 600ms
    setInterval(async () => {
        ctx.clearRect(0, 0, overlay.width, overlay.height);

        const detection = await faceapi
            .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions()
            .withAgeAndGender();

        if (!detection) return;

        const expressions = detection.expressions.asSortedArray()[0].expression;

        // Lógica de repetição e tempo para disparar o popup
        if (expressions === ultimaExpressao) {
            repeticoes++;

            const agora = Date.now();
            const decorrido = agora - tempoInicioExpressao;

            if (repeticoes >= REPEAT_LIMIT || decorrido >= TIME_LIMIT) {
                processarEngajamento(expressions, expressoesTraduzidas[expressions]);
                repeticoes = 0;
                tempoInicioExpressao = agora;
            }
        } else {
            ultimaExpressao = expressions;
            repeticoes = 1;
            tempoInicioExpressao = Date.now();
        }

    }, 600);
});

// ===============================
// REGRAS DE ENGAJAMENTO
// ===============================
function processarEngajamento(en, pt) {
    const mensagens = {
        sad: "Percebi que você parece um pouco desmotivado 😔. Que tal dar uma pausa rápida ou revisar o conteúdo?",
        fearful: "Você parece um pouco inseguro 😟. Se estiver com dúvida, chame o tutor ou tente rever a explicação com calma.",
        angry: "Hmm… parece que você ficou frustrado 😣. Respire fundo e vamos tentar novamente. Você consegue!",
        happy: "Muito bom! Você está engajado e focado 😄 Continue assim!",
        surprised: "Ótimo! Parece que algo chamou sua atenção 🤩. Aproveite esse foco para avançar!"
    };

    const mensagem = mensagens[en];

    if (mensagem) {
        showPopup(mensagem);
    } 
}