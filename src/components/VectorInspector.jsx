import { useState, useMemo } from 'react';
import { Search, Layers, FileText } from 'lucide-react';
import { searchIndex } from '../ragEngine.js';

function ScoreBadge({ score }) {
  const pct = Math.round(score * 100);
  const cls = pct >= 40 ? 'high' : pct >= 15 ? 'mid' : 'low';
  return <span className={`chunk-score ${cls}`}>{pct}% match</span>;
}

export default function VectorInspector({ vectorIndex, documents }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);

  const allChunks = vectorIndex?.indexedChunks || [];

  const results = useMemo(() => {
    if (!query.trim() || !vectorIndex?.indexedChunks?.length) return allChunks.slice(0, 30);
    return searchIndex(vectorIndex, query, 20);
  }, [query, vectorIndex, allChunks]);

  const totalDocs = documents.length;
  const totalChunks = allChunks.length;
  const avgChunkSize = totalChunks > 0
    ? Math.round(allChunks.reduce((s, c) => s + c.wordCount, 0) / totalChunks)
    : 0;

  return (
    <div className="panel">
      <div className="panel-header">
        <Layers size={22} color="var(--accent-secondary)" />
        <div>
          <div className="panel-title">Vector Inspector</div>
          <div className="panel-sub">Browse and search indexed document chunks</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{totalDocs}</div>
          <div className="stat-label">Documents</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalChunks}</div>
          <div className="stat-label">Chunks</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{avgChunkSize}</div>
          <div className="stat-label">Avg Words</div>
        </div>
      </div>

      {/* Search */}
      <div className="search-bar">
        <Search size={16} color="var(--text-muted)" />
        <input
          placeholder="Test your retrieval — type a query to see matching chunks…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {query && (
          <button
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            onClick={() => setQuery('')}
          >✕</button>
        )}
      </div>

      {totalChunks === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Layers size={24} /></div>
          <h3>No chunks indexed yet</h3>
          <p>Upload documents in the Document Manager tab to see chunks here</p>
        </div>
      ) : (
        <>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 14 }}>
            {query
              ? `${results.length} chunk${results.length !== 1 ? 's' : ''} matching "${query}"`
              : `Showing ${results.length} of ${totalChunks} chunks`}
          </div>

          {results.map((chunk, i) => (
            <div
              key={chunk.id}
              className="chunk-card"
              onClick={() => setSelected(selected?.id === chunk.id ? null : chunk)}
            >
              <div className="chunk-header">
                <span className="chunk-id">#{i + 1} · {chunk.id}</span>
                {chunk.score != null && <ScoreBadge score={chunk.score} />}
              </div>

              <div
                className="chunk-text"
                style={{
                  WebkitLineClamp: selected?.id === chunk.id ? 'unset' : 3,
                  maxHeight: selected?.id === chunk.id ? 'none' : undefined,
                }}
              >
                {chunk.text}
              </div>

              <div className="chunk-footer">
                <FileText size={12} />
                <span>{chunk.docName}</span>
                <span style={{ marginLeft: 'auto' }}>{chunk.wordCount} words</span>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
