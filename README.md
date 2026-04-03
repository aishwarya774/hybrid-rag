# 🧠 HybridRAG

A fully portable, Dockerized RAG (Retrieval-Augmented Generation) system combining **local Ollama models** with **OpenAI** — with a smart router that picks the right LLM for every query.

---

## ✨ Features

- **Hybrid LLM routing** — auto-selects local or cloud based on privacy, complexity, cost
- **100% portable** — copy the folder to any machine and run one command
- **Local first** — works fully offline with Ollama (no API key needed)
- **OpenAI fallback** — for complex queries when an API key is provided
- **Document ingestion** — PDF, DOCX, TXT, Markdown via drag & drop
- **Vector search** — ChromaDB with nomic-embed-text embeddings
- **Modern UI** — React frontend with source citations and routing transparency
- **FastAPI backend** — with interactive docs at `/docs`

---

## 🚀 Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/get-started) installed and running
- That's it!

### Step 1 — Clone / Copy the project
```bash
# If using git:
git clone <your-repo-url>
cd hybrid-rag

# Or just copy the folder to the new machine
```

### Step 2 — Configure (optional)
```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY if you want cloud routing
# Without it, the system works 100% locally
```

### Step 3 — Launch
**Mac / Linux:**
```bash
./scripts/start.sh
```

**Windows:**
```
Double-click scripts\start.bat
```

**Or directly:**
```bash
docker compose up --build -d
```

### Step 4 — Open the UI
```
http://localhost:3000
```

---

## 📁 Project Structure

```
hybrid-rag/
├── docker-compose.yml          # Orchestrates all 4 services
├── .env.example                # Config template
├── scripts/
│   ├── start.sh                # Mac/Linux launcher
│   ├── start.bat               # Windows launcher
│   └── stop.sh                 # Shutdown script
├── backend/                    # FastAPI RAG engine
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py
│       ├── api/                # Routes: chat, documents, models, health
│       ├── core/               # Config, vectorstore init
│       └── services/           # RAG chain, router, ingestion
├── frontend/                   # React UI
│   ├── Dockerfile
│   ├── src/App.jsx             # Full single-file UI
│   └── ...
└── data/
    ├── uploads/                # Uploaded documents (persisted)
    └── vectorstore/            # Local vector cache
```

---

## 🌐 Service URLs

| Service       | URL                          |
|---------------|------------------------------|
| **UI**        | http://localhost:3000        |
| **API**       | http://localhost:8000        |
| **API Docs**  | http://localhost:8000/docs   |
| **Ollama**    | http://localhost:11434       |
| **ChromaDB**  | http://localhost:8001        |

---

## 🧠 Smart Router Logic

The router automatically selects the LLM based on:

| Condition | Provider |
|-----------|----------|
| Query contains sensitive keywords | 🏠 Ollama (local) |
| No OpenAI API key configured | 🏠 Ollama (local) |
| High complexity score (>0.7) | ☁️ OpenAI |
| Query > 150 words | ☁️ OpenAI |
| Default | 🏠 Ollama (local) |

You can also **force a provider** in the UI.

---

## 🔧 Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | *(empty)* | OpenAI key — leave blank for local-only |
| `DEFAULT_LOCAL_MODEL` | `llama3.1` | Ollama model to use |
| `DEFAULT_EMBED_MODEL` | `nomic-embed-text` | Embedding model |
| `COMPLEXITY_THRESHOLD` | `0.7` | Score above which OpenAI is used |
| `CHROMA_TOKEN` | `hybridrag-secret` | ChromaDB auth token |

---

## 🔄 Moving to a New Laptop

```bash
# On old machine — save Docker volumes (optional, preserves downloaded models)
docker run --rm -v hybridrag_ollama_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/ollama-backup.tar.gz -C /data .

# On new machine
git clone <repo>  # or copy folder
cd hybrid-rag
./scripts/start.sh  # models re-download automatically if no backup
```

---

## 🛑 Stopping & Cleanup

```bash
./scripts/stop.sh           # Stop containers (data preserved)
docker compose down -v      # Stop + delete volumes (fresh start)
```

---

## 📚 Supported Document Types

- **PDF** — text-based and scanned (OCR via Tesseract)
- **DOCX** — Microsoft Word documents
- **TXT** — Plain text files
- **MD** — Markdown files

---

## 🗺️ Roadmap

- [ ] Streaming responses
- [ ] Conversation memory / chat history
- [ ] Multi-user support
- [ ] Cohere re-ranking
- [ ] Web URL ingestion
- [ ] GPU acceleration toggle
- [ ] Model pull UI (download new Ollama models from the app)
