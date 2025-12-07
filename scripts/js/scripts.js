// const video = document.getElementById('video');

// // Tradução das expressões faciais para o português
// const expressoesTraduzidas = {
//     'neutral': 'Neutro',
//     'happy': 'Feliz',
//     'sad': 'Triste',
//     'angry': 'Raiva',
//     'fearful': 'Medo',
//     'disgusted': 'Nojo',
//     'surprised': 'Surpresa'
// };

// Promise.all([
//     faceapi.nets.tinyFaceDetector.loadFromUri('/scripts/models'),
//     faceapi.nets.faceLandmark68Net.loadFromUri('/scripts/models'),
//     faceapi.nets.faceRecognitionNet.loadFromUri('/scripts/models'),
//     faceapi.nets.faceExpressionNet.loadFromUri('/scripts/models'),
//     faceapi.nets.ageGenderNet.loadFromUri('/scripts/models')
// ]).then(startVideo);

// function startVideo() {
//     navigator.mediaDevices.getUserMedia(
//         { video: {} }
//     )
//     .then(stream => {
//         video.srcObject = stream;
//     })
//     .catch(err => console.error(err));
// }

// // Evento que inicia a detecção quando o vídeo começa a ser reproduzido
// video.addEventListener('play', () => {
//     const canvas = faceapi.createCanvasFromMedia(video);
//     document.body.append(canvas);
//     const displaySize = { width: video.width, height: video.height };
//     faceapi.matchDimensions(canvas, displaySize);

//     // Loop de detecção a cada 100ms
//     // Fechamento correto: (funcao_anonima, tempo_em_ms)
//     setInterval(async () => {
//         const detections = await faceapi
//             .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
//             .withFaceLandmarks()
//             .withFaceExpressions()
//             .withAgeAndGender();

//         // Redimensiona os resultados e limpa o canvas a cada iteração
//         const resizedDetections = faceapi.resizeResults(detections, displaySize);
//         canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

//         // Itera sobre CADA detecção (rosto)
//         resizedDetections.forEach(detection => {
//             if (!detection) return;

//             // TRADUÇÃO DOS DADOS
//             const age = Math.round(detection.age);
//             const expressaoIngles = detection.expressions.asSortedArray()[0].expression;
//             const expressaoPortugues = expressoesTraduzidas[expressaoIngles] || expressaoIngles;
//             const generoTraduzido = detection.gender === 'male' ? 'Homem' : 'Mulher';

//             // CRIAÇÃO DO RÓTULO UNIFICADO
//             const label = `${expressaoPortugues} | ${generoTraduzido} | ${age} anos`;

//             // CRIAÇÃO E ESTILIZAÇÃO DO DRAWBOX (CAIXA DELIMITADORA)
//             // Acesso corrigido ao box: detection.detection.box
//             const drawBox = new faceapi.draw.DrawBox(detection.detection.box, {
//                 label: label,
//                 boxColor: 'rgba(205, 24, 115, 1)',
//                 // labelBackgroundColor: 'rgba(254, 134, 208, 0.8)',
//                 labelColor: 'white'
//             });
//             drawBox.draw(canvas);

//             // Desenha as probabilidades de expressão lateral
//             faceapi.draw.drawFaceExpressions(canvas, detection);
//         });
//     }, 100); 

// }); 