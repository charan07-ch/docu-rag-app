import { useState } from 'react';
import { Settings, Key, Sliders, Zap, Info } from 'lucide-react';

export default function SettingsPanel({ settings, setSettings }) {
  const [showKey, setShowKey] = useState(false);

  const update = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <Settings size={22} color="var(--accent-secondary)" />
        <div>
          <div className="panel-title">RAG Settings</div>
          <div className="panel-sub">Configure chunking, retrieval, and AI generation</div>
        </div>
      </div>

      <div className="info-box">
        <Info size={16} className="icon" />
        <span>
          The app works without an API key using local keyword search.
          Add a Gemini API key for AI-powered answers with better quality.
        </span>
      </div>

      {/* Chunking */}
      <div className="settings-group">
        <div className="settings-group-title">📄 Document Chunking</div>

        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-name">Chunk Size</div>
            <div className="setting-desc">Number of words per chunk (smaller = more precise, larger = more context)</div>
          </div>
          <input
            type="number"
            className="setting-input"
            value={settings.chunkSize || 500}
            min={50} max={2000} step={50}
            onChange={e => update('chunkSize', parseInt(e.target.value))}
          />
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-name">Chunk Overlap</div>
            <div className="setting-desc">Shared words between consecutive chunks to preserve context at boundaries</div>
          </div>
          <input
            type="number"
            className="setting-input"
            value={settings.overlap || 100}
            min={0} max={500} step={25}
            onChange={e => update('overlap', parseInt(e.target.value))}
          />
        </div>
      </div>

      {/* Retrieval */}
      <div className="settings-group">
        <div className="settings-group-title"><Sliders size={12} style={{ display: 'inline', marginRight: 4 }} />Retrieval</div>

        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-name">Top-K Results</div>
            <div className="setting-desc">Number of most relevant chunks to retrieve per query</div>
          </div>
          <input
            type="number"
            className="setting-input"
            value={settings.topK || 5}
            min={1} max={20}
            onChange={e => update('topK', parseInt(e.target.value))}
          />
        </div>
      </div>

      {/* AI Generation */}
      <div className="settings-group">
        <div className="settings-group-title"><Zap size={12} style={{ display: 'inline', marginRight: 4 }} />AI Generation — Gemini API</div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Key size={16} color="var(--accent-secondary)" />
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Gemini API Key</span>
            <button
              className="btn btn-secondary btn-sm"
              style={{ marginLeft: 'auto' }}
              onClick={() => setShowKey(s => !s)}
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 10 }}>
            Get a free API key at{' '}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent-tertiary)' }}
            >
              aistudio.google.com/apikey
            </a>
          </div>
          <input
            type={showKey ? 'text' : 'password'}
            className="api-key-input"
            placeholder="AIza…"
            value={settings.apiKey || ''}
            onChange={e => update('apiKey', e.target.value)}
          />
          {settings.apiKey && (
            <div style={{
              marginTop: 10,
              padding: '6px 12px',
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: 8,
              fontSize: '0.75rem',
              color: 'var(--accent-green)',
            }}>
              ✓ API key set — AI-powered answers enabled
            </div>
          )}
        </div>
      </div>

      {/* Reset */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button
          className="btn btn-danger btn-sm"
          onClick={() => setSettings({
            chunkSize: 500,
            overlap: 100,
            topK: 5,
            apiKey: '',
          })}
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}
