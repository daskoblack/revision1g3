import { useState } from 'react';
import axios from 'axios';

export default function ShareModal({ isOpen, onClose, slug, shareToken }) {
  const [activeTab, setActiveTab] = useState('link'); // 'link' | 'username'
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}/textes/share/${shareToken}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareByUsername = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!username.trim()) return setError("Le nom d'utilisateur est requis.");

    setLoading(true);
    try {
      const res = await axios.post(`/api/user-texts/${slug}/share`, { toUsername: username });
      setSuccess(res.data.message || `Texte partagé avec succès avec @${username}`);
      setUsername('');
    } catch (err) {
      setError(err.response?.data?.error ?? 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-parchment-50 border border-parchment-300 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden fade-up">
        {/* Header */}
        <div className="bg-navy-900 text-white px-6 py-4 flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-amber-300">Partager ce texte</h3>
          <button
            onClick={onClose}
            className="text-navy-300 hover:text-white transition-colors p-1 rounded-lg hover:bg-navy-800"
            aria-label="Fermer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-parchment-200 bg-parchment-100">
          <button
            onClick={() => { setActiveTab('link'); setError(''); setSuccess(''); }}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'link'
                ? 'bg-parchment-50 text-navy-900 border-b-2 border-amber-600'
                : 'text-ink-light hover:text-ink hover:bg-parchment-200'
            }`}
          >
            🔗 Partager par lien
          </button>
          <button
            onClick={() => { setActiveTab('username'); setError(''); setSuccess(''); }}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'username'
                ? 'bg-parchment-50 text-navy-900 border-b-2 border-amber-600'
                : 'text-ink-light hover:text-ink hover:bg-parchment-200'
            }`}
          >
            👤 Envoyer par pseudo
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'link' ? (
            <div className="space-y-4">
              <p className="text-sm text-ink-light leading-relaxed">
                Copie ce lien unique pour l'envoyer à tes camarades. Ils pourront consulter la fiche et l'ajouter à leur propre historique.
              </p>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="field flex-1 text-xs select-all bg-parchment-100 text-ink-light border border-parchment-350 rounded-lg px-3 py-2"
                />
                <button
                  onClick={handleCopyLink}
                  className={`btn-primary px-4 text-xs shrink-0 font-medium ${copied ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                >
                  {copied ? 'Copié !' : 'Copier'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleShareByUsername} className="space-y-4">
              <p className="text-sm text-ink-light leading-relaxed">
                Entre le nom d'utilisateur (pseudo) de ton camarade pour envoyer le texte directement dans son historique de textes partagés.
              </p>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1" htmlFor="share-username">
                  Nom d'utilisateur (pseudo)
                </label>
                <input
                  id="share-username"
                  type="text"
                  placeholder="ex : jules.m"
                  className="field w-full"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoCapitalize="none"
                  autoComplete="off"
                />
              </div>

              {error && (
                <div role="alert" className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-xs text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div role="alert" className="bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-xs text-green-700">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2 text-sm flex items-center justify-center gap-2"
              >
                {loading ? 'Envoi...' : 'Partager'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
