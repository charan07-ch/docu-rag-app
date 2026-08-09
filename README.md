# 🧠 DocuRAG — Chat with Your Documents

A modern, browser-based **Retrieval-Augmented Generation (RAG)** application. Upload any documents and ask questions — the AI finds the most relevant parts and answers you with citations.

![DocuRAG](https://img.shields.io/badge/RAG-Document%20Chat-7c3aed?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite)

---

## ✨ Features

- 📂 **Multi-format document upload** — PDF, TXT, Markdown, JSON, CSV
- 💬 **Interactive Q&A chat** — Ask questions, get cited answers
- 🔍 **TF-IDF vector search** — Semantic similarity-based chunk retrieval
- 📄 **Source citations** — Every answer shows exactly which document section was used
- 🔎 **Vector Inspector** — Browse and test your indexed document chunks
- ⚙️ **Configurable settings** — Chunk size, overlap, top-K retrieval
- 🤖 **Gemini AI integration** — Plug in your free Gemini API key for premium answers
- 🌐 **100% browser-based** — No backend, no data leaves your machine
- 🎨 **Premium dark UI** — Glassmorphism design with smooth animations

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/docu-rag-app.git
cd docu-rag-app

# Install dependencies
npm install

# Start development server
npm run dev
```

Then open `http://localhost:5173` in your browser.

---

## 📖 How to Use

### 1. Upload Documents
- Go to the **Documents** tab
- Drag & drop files or click to browse
- Or click **"Load Sample"** to try with example documents

### 2. Ask Questions
- Switch to the **Chat** tab
- Type any question about your documents
- The app retrieves the most relevant chunks and generates an answer

### 3. Inspect Vectors (Optional)
- Go to **Vector Inspector** to see all indexed chunks
- Test retrieval by typing a query — see which chunks match and their similarity scores

### 4. Add Gemini API Key (Optional)
- Go to **Settings**
- Paste your free Gemini API key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
- Get AI-powered, context-aware answers instead of keyword matching

---

## 🏗️ Architecture

```
User Query
    │
    ▼
[Chunker] ─── Document Text ──▶ Overlapping Chunks
    │
    ▼
[TF-IDF Indexer] ─── Builds term-frequency vectors for all chunks
    │
    ▼
[Vector Search] ─── Cosine similarity between query vector & chunk vectors
    │
    ▼
[Top-K Retrieval] ─── Returns most relevant chunks with scores
    │
    ▼
[Generator] ─── Gemini API (or local keyword answer)
    │
    ▼
Answer + Source Citations
```

---

## ⚙️ Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| Chunk Size | 500 words | Size of each document chunk |
| Chunk Overlap | 100 words | Overlap between consecutive chunks |
| Top-K Results | 5 | Number of chunks retrieved per query |
| Gemini API Key | (optional) | For AI-powered generation |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 8 |
| Vector Search | TF-IDF + Cosine Similarity (pure JS) |
| PDF Parsing | PDF.js (CDN) |
| AI Generation | Gemini 1.5 Flash API |
| Icons | Lucide React |
| Styling | Vanilla CSS (Glassmorphism) |

---

## 📄 License

MIT License — free to use, modify, and distribute.
