/**
 * RAG Engine — Core logic for Document Parsing, Chunking, Vector Search & Generation
 * Works entirely in the browser — no backend needed!
 */

// ─── Text Extractors ────────────────────────────────────────────────

export async function extractText(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  try {
    if (ext === 'pdf') return await extractPDF(file);
    if (ext === 'json') return await extractJSON(file);
    if (ext === 'csv') return await extractCSV(file);
    return await extractPlainText(file);  // txt, md, etc.
  } catch (err) {
    throw new Error(`Failed to extract text from ${file.name}: ${err.message}`);
  }
}

async function extractPlainText(file) {
  return await file.text();
}

async function extractPDF(file) {
  // Use PDF.js via CDN dynamic import
  try {
    const pdfjsLib = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs');
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs';

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => item.str).join(' ');
      text += `\n[Page ${i}]\n${pageText}\n`;
    }
    return text;
  } catch {
    // Fallback: try reading as text
    return await file.text();
  }
}

async function extractJSON(file) {
  const text = await file.text();
  try {
    const obj = JSON.parse(text);
    return JSON.stringify(obj, null, 2);
  } catch {
    return text;
  }
}

async function extractCSV(file) {
  const text = await file.text();
  const lines = text.split('\n');
  const headers = lines[0]?.split(',').map(h => h.trim()) || [];
  const rows = lines.slice(1).filter(l => l.trim());
  const formatted = rows.map(row => {
    const vals = row.split(',');
    return headers.map((h, i) => `${h}: ${(vals[i] || '').trim()}`).join(', ');
  });
  return `${headers.join(', ')}\n\n` + formatted.join('\n');
}

// ─── Chunker ────────────────────────────────────────────────────────

export function chunkText(text, { chunkSize = 500, overlap = 100 } = {}) {
  // Clean and normalize
  const cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const words = cleaned.split(/\s+/);
  const chunks = [];
  let i = 0;
  let chunkIndex = 0;

  while (i < words.length) {
    const chunkWords = words.slice(i, i + chunkSize);
    const chunkText = chunkWords.join(' ');

    if (chunkText.trim().length > 20) {
      chunks.push({
        id: `chunk-${chunkIndex++}`,
        text: chunkText,
        wordStart: i,
        wordEnd: i + chunkWords.length,
        wordCount: chunkWords.length,
      });
    }

    i += chunkSize - overlap;
    if (i >= words.length) break;
  }

  return chunks;
}

// ─── TF-IDF Vector Engine ────────────────────────────────────────────

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOP_WORDS.has(t));
}

function computeTF(tokens) {
  const tf = {};
  tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
  const total = tokens.length || 1;
  Object.keys(tf).forEach(k => { tf[k] /= total; });
  return tf;
}

function computeIDF(chunks) {
  const df = {};
  const N = chunks.length;
  chunks.forEach(chunk => {
    const unique = new Set(tokenize(chunk.text));
    unique.forEach(t => { df[t] = (df[t] || 0) + 1; });
  });
  const idf = {};
  Object.keys(df).forEach(t => {
    idf[t] = Math.log((N + 1) / (df[t] + 1)) + 1;
  });
  return idf;
}

function buildVector(tf, idf, vocab) {
  return vocab.map(t => (tf[t] || 0) * (idf[t] || 1));
}

function cosineSimilarity(vecA, vecB) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot   += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ─── Vector Index ────────────────────────────────────────────────────

export function buildIndex(allChunks) {
  const idf = computeIDF(allChunks);
  const vocab = Object.keys(idf);

  const indexedChunks = allChunks.map(chunk => {
    const tokens = tokenize(chunk.text);
    const tf = computeTF(tokens);
    const vector = buildVector(tf, idf, vocab);
    return { ...chunk, vector };
  });

  return { indexedChunks, idf, vocab };
}

export function searchIndex({ indexedChunks, idf, vocab }, query, topK = 5) {
  if (!indexedChunks.length || !query.trim()) return [];

  const qTokens = tokenize(query);
  const qTF = computeTF(qTokens);
  const qVector = buildVector(qTF, idf, vocab);

  const scored = indexedChunks.map(chunk => ({
    ...chunk,
    score: cosineSimilarity(qVector, chunk.vector),
  }));

  return scored
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

// ─── Response Generator ──────────────────────────────────────────────

export async function generateAnswer(query, retrievedChunks, settings = {}) {
  const { apiKey, topK } = settings;
  const context = retrievedChunks
    .slice(0, topK || 5)
    .map((c, i) => `[Source ${i + 1} — ${c.docName}]\n${c.text}`)
    .join('\n\n---\n\n');

  if (apiKey && apiKey.trim().startsWith('AI')) {
    return await callGeminiAPI(query, context, apiKey);
  }
  return localRAGAnswer(query, context, retrievedChunks);
}

async function callGeminiAPI(query, context, apiKey) {
  const prompt = `You are a helpful document assistant. Answer the user's question based ONLY on the provided document context. If the answer isn't in the context, say so clearly.

DOCUMENT CONTEXT:
${context}

USER QUESTION: ${query}

Answer concisely and accurately, citing sources where relevant:`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Gemini API error');
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
}

function localRAGAnswer(query, context, chunks) {
  if (!chunks.length) {
    return "I couldn't find relevant information in your documents to answer this question. Please make sure you've uploaded documents that contain information about this topic.";
  }

  const topChunk = chunks[0];
  const sentences = topChunk.text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 30);

  const qWords = new Set(tokenize(query));
  const relevant = sentences
    .map(s => ({ s, hits: tokenize(s).filter(w => qWords.has(w)).length }))
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 3)
    .map(x => x.s);

  const answer = relevant.length > 0
    ? relevant.join('. ') + '.'
    : sentences.slice(0, 2).join('. ') + '.';

  return `Based on your documents: ${answer}\n\n*(This is a local keyword-based answer. For AI-powered responses, add a Gemini API key in Settings.)*`;
}

// ─── Stop Words ──────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with',
  'by','from','up','about','into','through','during','is','are','was',
  'were','be','been','being','have','has','had','do','does','did','will',
  'would','could','should','may','might','this','that','these','those',
  'i','you','he','she','it','we','they','what','which','who','how','when',
  'where','why','all','each','not','no','nor','so','yet','both','either',
]);
