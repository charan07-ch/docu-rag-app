import { useState, useRef } from 'react';
import { Upload, FileText, Trash2, AlertCircle, CheckCircle2, Loader2, FolderOpen } from 'lucide-react';
import { extractText, chunkText } from '../ragEngine.js';

const SAMPLE_DOCS = [
  {
    name: 'Introduction to RAG.txt',
    content: `Retrieval-Augmented Generation (RAG) is an AI framework that enhances Large Language Models by retrieving relevant information from external knowledge sources before generating responses.

How RAG Works:
1. Document Ingestion: Documents are split into smaller chunks and stored in a vector database.
2. Query Processing: When a user asks a question, the query is converted into a vector embedding.
3. Retrieval: The system finds the most semantically similar document chunks.
4. Augmentation: The retrieved context is prepended to the user query.
5. Generation: The LLM generates a response grounded in the retrieved documents.

Benefits of RAG:
- Reduces hallucinations by grounding responses in real documents
- Allows models to access up-to-date information
- Provides citations and source attribution
- Cost-effective compared to fine-tuning
- Easy to update knowledge without retraining

RAG vs Fine-tuning:
RAG is preferred when knowledge needs to be updated frequently, when transparency and citations are important, or when the dataset is too large to fine-tune on efficiently.`,
  },
  {
    name: 'Machine Learning Basics.txt',
    content: `Machine Learning (ML) is a subset of Artificial Intelligence that enables systems to learn and improve from experience without being explicitly programmed.

Types of Machine Learning:

1. Supervised Learning
Supervised learning uses labeled training data to learn a mapping from inputs to outputs. Examples include:
- Classification: Spam detection, image recognition
- Regression: Price prediction, stock forecasting

2. Unsupervised Learning
Unsupervised learning finds patterns in data without labeled responses. Examples include:
- Clustering: Customer segmentation, document grouping
- Dimensionality Reduction: PCA, t-SNE

3. Reinforcement Learning
Reinforcement learning trains agents to make decisions by rewarding desirable behaviors. Used in game playing (AlphaGo), robotics, and autonomous vehicles.

Key Algorithms:
- Linear Regression: Models linear relationships
- Decision Trees: Tree-like models for decisions
- Neural Networks: Layers of interconnected nodes
- Support Vector Machines: Finds optimal decision boundaries
- K-Means Clustering: Groups data into K clusters

Model Evaluation:
- Accuracy, Precision, Recall, F1-Score for classification
- MSE, RMSE, MAE for regression
- Cross-validation to prevent overfitting`,
  },
];

function getDocIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const map = { pdf: 'PDF', txt: 'TXT', md: 'MD', json: 'JSON', csv: 'CSV' };
  const cls = ['pdf', 'txt', 'md', 'json', 'csv'].includes(ext) ? ext : 'txt';
  return { label: map[ext] || ext.toUpperCase(), cls };
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentManager({ documents, setDocuments, vectorIndex, setVectorIndex, settings }) {
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(null);
  const fileRef = useRef();

  const processFile = async (file) => {
    const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const docEntry = {
      id: docId,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'processing',
      chunks: [],
      addedAt: new Date(),
    };

    setDocuments(prev => [...prev, docEntry]);
    setProcessing(docId);

    try {
      const text = await extractText(file);
      const chunks = chunkText(text, {
        chunkSize: settings.chunkSize || 500,
        overlap: settings.overlap || 100,
      }).map(c => ({ ...c, docId, docName: file.name }));

      setDocuments(prev => prev.map(d =>
        d.id === docId ? { ...d, status: 'indexed', chunks, charCount: text.length } : d
      ));

      // Rebuild vector index
      setVectorIndex(prev => {
        const allChunks = [
          ...(prev?.rawChunks || []),
          ...chunks,
        ];
        // Lazy import to avoid circular
        return { rawChunks: allChunks, dirty: true };
      });

    } catch (err) {
      setDocuments(prev => prev.map(d =>
        d.id === docId ? { ...d, status: 'error', error: err.message } : d
      ));
    } finally {
      setProcessing(null);
    }
  };

  const loadSample = async (sample) => {
    const file = new File([sample.content], sample.name, { type: 'text/plain' });
    await processFile(file);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    for (const f of files) await processFile(f);
  };

  const handleFileInput = async (e) => {
    const files = Array.from(e.target.files);
    for (const f of files) await processFile(f);
    e.target.value = '';
  };

  const removeDoc = (id) => {
    setDocuments(prev => {
      const remaining = prev.filter(d => d.id !== id);
      const allChunks = remaining.flatMap(d => d.chunks || []);
      setVectorIndex({ rawChunks: allChunks, dirty: true });
      return remaining;
    });
  };

  const totalChunks = documents.reduce((s, d) => s + (d.chunks?.length || 0), 0);
  const indexed = documents.filter(d => d.status === 'indexed').length;

  return (
    <div className="panel">
      <div className="panel-header">
        <FolderOpen size={22} color="var(--accent-secondary)" />
        <div>
          <div className="panel-title">Document Manager</div>
          <div className="panel-sub">Upload documents to build your RAG knowledge base</div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{documents.length}</div>
          <div className="stat-label">Documents</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalChunks}</div>
          <div className="stat-label">Chunks</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{indexed}</div>
          <div className="stat-label">Indexed</div>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`upload-area ${dragging ? 'dragging' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        style={{ marginBottom: 20 }}
      >
        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".pdf,.txt,.md,.json,.csv"
          style={{ display: 'none' }}
          onChange={handleFileInput}
        />
        <div className="upload-icon">
          <Upload size={24} />
        </div>
        <h3>Drop files here or click to browse</h3>
        <p>Your documents are processed entirely in your browser — nothing is uploaded to any server</p>
        <div className="formats">
          {['pdf','txt','md','json','csv'].map(f => (
            <span key={f} className={`format-tag ${f}`}>.{f}</span>
          ))}
        </div>
      </div>

      {/* Sample Docs */}
      <div style={{ marginBottom: 24 }}>
        <div className="sidebar-label" style={{ marginBottom: 10 }}>Load Sample Documents</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {SAMPLE_DOCS.map(s => (
            <button
              key={s.name}
              className="btn btn-secondary btn-sm"
              onClick={() => loadSample(s)}
              disabled={processing !== null}
            >
              <FileText size={14} />
              {s.name.replace('.txt', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Document List */}
      {documents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FolderOpen size={24} /></div>
          <h3>No documents yet</h3>
          <p>Upload a document or load a sample to get started</p>
        </div>
      ) : (
        documents.map(doc => {
          const icon = getDocIcon(doc.name);
          return (
            <div key={doc.id} className="doc-list-item">
              <div className={`doc-icon ${icon.cls}`}>{icon.label}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="doc-name" style={{ fontWeight: 600, marginBottom: 4 }}>{doc.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="doc-status">
                    {doc.status === 'processing' && (
                      <><Loader2 size={12} className="spin" /><span style={{ color: 'var(--accent-orange)' }}>Processing…</span></>
                    )}
                    {doc.status === 'indexed' && (
                      <><span className="status-dot indexed" /><span style={{ color: 'var(--accent-green)' }}>Indexed</span></>
                    )}
                    {doc.status === 'error' && (
                      <><AlertCircle size={12} /><span style={{ color: 'var(--accent-red)' }}>Error</span></>
                    )}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {doc.status === 'indexed' ? `${doc.chunks?.length} chunks` : formatBytes(doc.size || 0)}
                  </span>
                </div>
                {doc.status === 'processing' && (
                  <div className="progress-bar" style={{ marginTop: 6 }}>
                    <div className="progress-fill" style={{ width: '60%' }} />
                  </div>
                )}
                {doc.status === 'error' && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--accent-red)', marginTop: 4 }}>{doc.error}</div>
                )}
              </div>
              <button className="doc-remove" onClick={() => removeDoc(doc.id)} style={{ opacity: 1 }}>
                <Trash2 size={15} />
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
