// Este código configura o servidor para receber o upload do vídeo e servir os arquivos estaticamente para o Front-End do Professor.

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const uploadDir = path.join(__dirname, 'uploads');

// 1. MIDDLEWARES ESSENCIAIS
// Permite que o Front-End (rodando em outra porta ou local) se comunique com o Back-End
app.use(cors());

// Garante que a pasta de uploads exista. Se não existir, ele a cria.
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// 2. CONFIGURAÇÃO DE ARQUIVOS ESTÁTICOS
// Qualquer requisição para /videos/NOME_ARQUIVO.webm será buscada na pasta /uploads
// O middleware (função com res.setHeader) garante que o navegador não bloqueie o WebGL.
app.use('/videos', (req, res, next) => {
    // Permite acesso de qualquer origem (*), necessário para WebGL (face-api.js)
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    next(); // Continua para servir o arquivo estático
}, express.static(uploadDir));

// 3. CONFIGURAÇÃO DO MULTER (Upload)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); 
    },
    filename: (req, file, cb) => {
        // Gera um nome único baseado no timestamp para evitar conflitos
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname) || '.webm';
        cb(null, 'sessao-gravada-' + uniqueSuffix + ext);
    }
});

// Middleware para upload de um único arquivo (com o nome do campo 'webcamVideo')
const upload = multer({ storage: storage }).single('webcamVideo'); 

// 4. ROTA DE UPLOAD (POST /upload-video)
app.post('/upload-video', (req, res) => {
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error("Multer Error:", err);
            return res.status(500).json({ message: 'Erro no processamento do arquivo.', error: err.message });
        } else if (err) {
            console.error("Erro Desconhecido:", err);
            return res.status(500).json({ message: 'Erro desconhecido ao fazer upload.', error: err.message });
        }
        
        if (req.file) {
            console.log(`✅ Arquivo salvo: ${req.file.filename}`);
            // Retorna o nome do arquivo para o Front-End para registro no localStorage
            res.json({ 
                message: 'Upload bem-sucedido', 
                fileName: req.file.filename 
            });
        } else {
            res.status(400).json({ message: 'Nenhum arquivo de vídeo enviado.' });
        }
    });
});

// Rota para LISTAR todos os vídeos disponíveis na pasta 'uploads'
app.get('/list-videos', (req, res) => {
    // Garante que o CORS seja aplicado na resposta de listagem
    res.setHeader('Access-Control-Allow-Origin', '*'); 

    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            console.error("Erro ao ler diretório de uploads:", err);
            return res.status(500).json({ error: 'Não foi possível listar os arquivos de vídeo.' });
        }

        // Filtra para mostrar apenas arquivos .webm
        const videoFiles = files.filter(file => file.endsWith('.webm'));

        res.json({ files: videoFiles });
    });
});


// 5. INICIALIZAÇÃO DO SERVIDOR
app.listen(PORT, () => {
    console.log(`🌐 Servidor de Upload rodando em: http://localhost:${PORT}`);
    console.log(`Pasta de arquivos estáticos: http://localhost:${PORT}/videos/`);
});