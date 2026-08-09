import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, BookOpen, Sparkles, MessageCircle } from 'lucide-react';
import { searchIndex, generateAnswer } from '../ragEngine.js';

const SUGGESTIONS = [
  'What are the main topics in my documents?',
  'Summarize the key points',
  'What is RAG and how does it work?',
  'Explain the different types of machine learning',
];

function TypingIndicator() {
  return (
    <div className="message ai" style={{ animationDuration: '0.2s' }}>
      <div className="message-row">
        <div className="message-avatar"><Bot size={16} /></div>
        <div className="message-bubble">
          <div className="typing-indicator">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RagChat({ vectorIndex, documents, settings }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef();
  const textareaRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const hasDocuments = documents.length > 0 && vectorIndex?.indexedChunks?.length > 0;

  const send = async (query) => {
    const q = (query || input).trim();
    if (!q || loading) return;

    setInput('');
    setError(null);
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: q }]);
    setLoading(true);

    try {
      let sources = [];
      let answer = '';

      if (hasDocuments) {
        sources = searchIndex(vectorIndex, q, settings.topK || 5);
        answer = await generateAnswer(q, sources, settings);
      } else {
        answer = "Please upload some documents first! Once you've added documents in the **Document Manager** tab, I can answer questions based on their content.";
      }

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'ai',
          text: answer,
          sources: sources.slice(0, 3),
        },
      ]);
    } catch (err) {
      setError(err.message);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'ai',
          text: `⚠️ Error: ${err.message}`,
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-welcome">
            <div className="chat-welcome-icon">
              <Sparkles size={28} color="white" />
            </div>
            <h2>Chat with Your Documents</h2>
            <p>
              {hasDocuments
                ? `${documents.length} document${documents.length > 1 ? 's' : ''} loaded — ask anything!`
                : 'Upload documents in the Document Manager, then ask questions about them.'}
            </p>
            <div className="suggestion-chips">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="chip" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <div key={msg.id} className={`message ${msg.role === 'user' ? 'user' : 'ai'}`}>
                <div className="message-row">
                  <div className="message-avatar">
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className="message-bubble" style={msg.isError ? { borderColor: 'rgba(239,68,68,0.3)' } : {}}>
                    {msg.text.split('\n').map((line, i) => (
                      <span key={i}>{line}{i < msg.text.split('\n').length - 1 && <br />}</span>
                    ))}
                  </div>
                </div>
                {msg.sources?.length > 0 && (
                  <div className="message-sources">
                    <BookOpen size={12} color="var(--accent-cyan)" style={{ marginTop: 2 }} />
                    {msg.sources.map((s, i) => (
                      <span key={i} className="source-pill">
                        📄 {s.docName} · {Math.round(s.score * 100)}%
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && <TypingIndicator />}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-area">
        <div className="chat-input-wrapper">
          <textarea
            ref={textareaRef}
            className="chat-input"
            placeholder={hasDocuments ? 'Ask anything about your documents…' : 'Upload documents to start chatting…'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            style={{ height: 'auto' }}
            onInput={e => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
          <button
            id="send-message-btn"
            className="send-btn"
            onClick={() => send()}
            disabled={!input.trim() || loading}
          >
            <Send size={16} />
          </button>
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
          Press <kbd style={{ padding: '1px 5px', background: 'rgba(255,255,255,0.06)', borderRadius: 4, fontSize: '0.7rem' }}>Enter</kbd> to send,{' '}
          <kbd style={{ padding: '1px 5px', background: 'rgba(255,255,255,0.06)', borderRadius: 4, fontSize: '0.7rem' }}>Shift+Enter</kbd> for new line
        </div>
      </div>
    </div>
  );
}
