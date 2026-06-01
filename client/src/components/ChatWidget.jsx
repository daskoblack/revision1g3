import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import QuotaBar from './QuotaBar';

export default function ChatWidget({ textId, textTitle }) {
  const { quota, fetchQuota } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Bonjour ! Je suis M. Marin, ton assistant pour **${textTitle}**. Pose-moi tes questions : analyse d'un passage, procédé stylistique, aide pour formuler une réponse d'oral… Je suis là pour t'aider !`,
    },
  ]);
  const [input, setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const endRef  = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading || (quota?.remaining ?? 0) <= 0) return;
    setError('');

    const userMsg = { role: 'user', content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(`/api/chat/${textId}`, {
        messages: next.slice(-10).map(({ role, content }) => ({ role, content })),
      });
      setMessages([...next, { role: 'assistant', content: res.data.reply }]);
      await fetchQuota();
    } catch (err) {
      const msg = err.response?.data?.error ?? 'Erreur de connexion. Réessaie dans un instant.';
      setError(msg);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quotaEmpty = (quota?.remaining ?? 0) <= 0;

  return (
    <div id="chat" className="card border-2 border-amber-600/30 fade-up">
      {/* Header */}
      <div className="bg-navy-900 text-white px-5 py-4 rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-600/20 border border-amber-600/40 flex items-center justify-center text-amber-300 font-serif font-bold text-sm">
            M
          </div>
          <div>
            <p className="font-semibold text-sm">M. Marin</p>
            <p className="text-xs text-navy-200">Assistant expert — {textTitle}</p>
          </div>
          <div className="ml-auto">
            <span className={`w-2 h-2 rounded-full inline-block ${quotaEmpty ? 'bg-red-400' : 'bg-green-400'}`} />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="h-72 sm:h-80 md:h-96 overflow-y-auto px-4 py-4 space-y-3 bg-parchment-50">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'} fade-up`}>
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-navy-900 text-amber-300 font-serif font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                M
              </div>
            )}
            <div className={`max-w-[80%] sm:max-w-[75%] ${m.role === 'user' ? 'bubble-user' : 'bubble-assistant'}`}>
              {m.content.split('\n').map((line, j) => (
                <span key={j}>{line}{j < m.content.split('\n').length - 1 && <br />}</span>
              ))}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2 justify-start fade-up">
            <div className="w-7 h-7 rounded-full bg-navy-900 text-amber-300 font-serif font-bold text-xs flex items-center justify-center shrink-0">
              M
            </div>
            <div className="bubble-assistant flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-ink-pale rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-ink-pale rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-ink-pale rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {error && (
          <div className="text-xs text-red-600 text-center bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quota bar */}
      <div className="px-4 pt-3 pb-1">
        <QuotaBar />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2">
        {quotaEmpty ? (
          <div className="text-center py-3 text-sm text-ink-light bg-parchment-100 rounded-lg border border-parchment-200">
            Tu as utilisé tous tes messages d'aujourd'hui.{' '}
            <span className="font-medium text-ink">Reviens demain !</span>
          </div>
        ) : (
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              className="field flex-1 resize-none text-sm py-2.5 min-h-[44px] max-h-32"
              rows={2}
              placeholder="Pose ta question… (Entrée pour envoyer, Maj+Entrée pour aller à la ligne)"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="btn-primary self-end shrink-0 px-4"
              aria-label="Envoyer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M3.105 2.288a.75.75 0 00-.826.95l1.414 4.926A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.897 28.897 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.288z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
