import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../context/AuthContext';
import QuotaBar from './QuotaBar';

export default function ChatWidget({ textId, textTitle }) {
  const { quota, fetchQuota } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Bonjour ! Je suis **M. Marin**, ton assistant pour *${textTitle}*.\n\nPose-moi tes questions : analyse d'un passage, procédé stylistique, aide pour formuler une réponse d'oral… Je suis là pour t'aider ! 📚`,
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

  const clearHistory = () => {
    setMessages([{
      role: 'assistant',
      content: `Bonjour ! Je suis **M. Marin**, ton assistant pour *${textTitle}*.\n\nPose-moi tes questions : analyse d'un passage, procédé stylistique, aide pour formuler une réponse d'oral… Je suis là pour t'aider ! 📚`,
    }]);
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
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={clearHistory}
              title="Effacer la conversation"
              className="text-navy-200 hover:text-white transition-colors text-xs flex items-center gap-1 opacity-60 hover:opacity-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
              </svg>
              Effacer
            </button>
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
              {m.role === 'assistant' ? (
                <div className="
                  prose prose-sm max-w-none
                  prose-headings:font-serif prose-headings:text-ink prose-headings:mt-2 prose-headings:mb-1 prose-headings:text-sm
                  prose-h2:text-base prose-h3:text-sm
                  prose-p:text-ink prose-p:leading-relaxed prose-p:my-1 prose-p:text-sm
                  prose-strong:text-ink prose-strong:font-semibold
                  prose-em:text-ink-light
                  prose-ul:my-1 prose-ul:pl-4 prose-li:my-0.5 prose-li:text-ink prose-li:text-sm
                  prose-ol:my-1 prose-ol:pl-4
                  prose-blockquote:border-l-2 prose-blockquote:border-amber-600 prose-blockquote:pl-3 prose-blockquote:italic prose-blockquote:text-ink-light prose-blockquote:my-1 prose-blockquote:not-italic
                  prose-code:bg-parchment-200 prose-code:px-1 prose-code:rounded prose-code:text-ink prose-code:text-xs prose-code:font-mono
                  prose-hr:border-parchment-300 prose-hr:my-2
                ">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {m.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <span className="text-sm leading-relaxed">{m.content}</span>
              )}
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
