# 👁️ Monitor de Engajamento em E-Learning

Este é um Sistema Full-Stack que utiliza Visão Computacional (Machine Learning no navegador) para monitorar e analisar o nível de engajamento e as emoções de estudantes durante sessões de conteúdo online.

---

## 🎯 Objetivo do Projeto

O objetivo principal é solucionar a **falta de feedback não-verbal** em ambientes de Ensino à Distância (EAD). O sistema oferece:

1.  **Feedback em Tempo Real:** Alertas amigáveis para o aluno em momentos de aparente frustração ou dispersão.
2.  **Análise para o Professor:** Geração de métricas objetivas (Score de Foco, Logs de Eventos) para avaliar a eficácia do conteúdo da aula.

---

## 🚀 Demonstração (Assista o Vídeo!)

[INSIRA O LINK DO SEU VÍDEO DE DEMONSTRAÇÃO AQUI]

### 📌 Três Fluxos Principais

O sistema é dividido em três telas principais, representando o fluxo de dados:

1.  **Tela do Aluno (`student_session.html`):** Captura de vídeo da webcam, análise de emoções via `face-api.js` e gravação da sessão.
2.  **Dashboard do Professor (`teacher_dashboard.html`):** Galeria de vídeos, reanálise em tempo real do histórico da sessão (Bounding Box, Semáforo, Gráfico).
3.  **Relatório Final (`report.html`):** Consolidação dos dados de foco, emoções acumuladas e exportação do relatório em PDF.

---

## 🛠️ Tecnologias Utilizadas

Este projeto demonstra proficiência em desenvolvimento Full-Stack com foco em Web APIs e Integração de ML.

### Frontend (Browser)
* **Visão Computacional:** `face-api.js` (detecção facial, landmarks, e análise de emoções).
* **Gráficos:** `Chart.js` (para dashboards e relatórios).
* **Web APIs:** `MediaRecorder API` (para gravação da webcam) e `Web Storage API` (para persistência de dados da sessão).
* **Exportação:** `html2canvas` e `jsPDF` (para gerar relatórios em PDF).

### Backend (Servidor)
* **Linguagem:** Node.js
* **Framework:** Express (para criar rotas RESTful).
* **Funcionalidade:** Armazenamento e listagem de vídeos gravados (`.webm`).

---

## ⚙️ Como Executar o Projeto Localmente

Para rodar o Monitor de Engajamento, você precisa iniciar o Back-End e o Front-End separadamente.

### Pré-requisitos
* Node.js (versão 14+)
* Navegador moderno (Chrome ou Firefox são recomendados)

### Passo 1: Iniciar o Servidor Back-End (Node.js)

1.  Navegue até o diretório `backend` do projeto no seu terminal.
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Inicie o servidor:
    ```bash
    npm start
    ```
    *O servidor deve iniciar na porta `http://localhost:3000`.*

### Passo 2: Iniciar o Front-End (Interface do Usuário)

1.  Abra o diretório raiz do projeto no VS Code.
2.  Use a extensão **"Live Server"** (ou similar) para abrir o arquivo `login.html`.
3.  O projeto estará acessível em `http://127.0.0.1:5500/login.html` (ou endereço similar).

**Observação:** Certifique-se de que o servidor Node.js esteja rodando antes de iniciar a análise de sessões.

---

## 💡 Próximos Passos e Oportunidades de Evolução

* Implementação de um banco de dados real (ex: MongoDB) para persistência de dados de usuários e sessões a longo prazo.
* Adicionar lógica de **rastreamento ocular (Gaze Tracking)** para medir foco com mais precisão.
* **Captação de Microexpressões:** Explorar modelos mais sensíveis ou técnicas de processamento de imagem em alta frequência para identificar **microexpressões** faciais, aumentando a precisão na detecção de emoções sutis e rápidas.
* Implementar autenticação de usuário (Login/Senha) para separar perfis de Aluno e Professor.

---

Desenvolvido por Kesly Aquinoã