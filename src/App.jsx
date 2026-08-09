import { useState, useEffect, useCallback } from 'react';
import { MessageCircle, FolderOpen, Layers, Settings, Brain } from 'lucide-react';
import RagChat from './components/RagChat.jsx';
import DocumentManager from './components/DocumentManager.jsx';
import VectorInspector from './components/VectorInspector.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import { buildIndex } from './ragEngine.js';
import './index.css';

const TABS = [
  { id: 'chat',      label: 'Chat',             Icon: MessageCircle },
  { id: 'documents', label: 'Documents',         Icon: FolderOpen    },
  { id: 'vectors',   label: 'Vector Inspector',  Icon: Layers        },
  { id: 'settings',  label: 'Settings',          Icon: Settings      },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [documents, setDocuments] = useState([]);
  const [vectorIndex, setVectorIndex] = useState(null);
  const [settings, setSettings] = useState({
    chunkSize: 500,
    overlap: 100,
    topK: 5,
    apiKey: '',
  });

  // Rebuild vector index whenever documents change
  useEffect(() => {
    const allChunks = documents.flatMap(d => d.chunks || []);
    if (allChunks.length > 0) {
      const index = buildIndex(allChunks);
      setVectorIndex(index);
    } else {
      setVectorIndex(null);
    }
  }, [documents]);

  const totalChunks = documents.reduce((s, d) => s + (d.chunks?.length || 0), 0);

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="app-logo">
          <div className="app-logo-icon">
            <Brain size={18} color="white" />
          </div>
          <span className="app-logo-text">DocuRAG</span>
        </div>

        <div style={{ marginLeft: 32, display: 'flex', gap: 4 }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              style={{ padding: '6px 14px' }}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.Icon size={15} className="nav-icon" />
              {tab.label}
              {tab.id === 'documents' && documents.length > 0 && (
                <span className="nav-count">{documents.length}</span>
              )}
              {tab.id === 'vectors' && totalChunks > 0 && (
                <span className="nav-count">{totalChunks}</span>
              )}
            </button>
          ))}
        </div>

        <div className="header-spacer" />

        <div className="header-badge">
          <span className="dot" />
          {totalChunks > 0 ? `${totalChunks} chunks indexed` : 'No documents'}
        </div>
      </header>

      {/* Main (no sidebar, full width) */}
      <main className="app-main" style={{ gridColumn: '1 / -1' }}>
        <div className="tab-content">
          {activeTab === 'chat' && (
            <RagChat
              vectorIndex={vectorIndex}
              documents={documents}
              settings={settings}
            />
          )}
          {activeTab === 'documents' && (
            <DocumentManager
              documents={documents}
              setDocuments={setDocuments}
              vectorIndex={vectorIndex}
              setVectorIndex={setVectorIndex}
              settings={settings}
            />
          )}
          {activeTab === 'vectors' && (
            <VectorInspector
              vectorIndex={vectorIndex}
              documents={documents}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsPanel
              settings={settings}
              setSettings={setSettings}
            />
          )}
        </div>
      </main>
    </div>
  );
}
