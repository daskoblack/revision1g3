import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ShareModal from '../components/ShareModal';

export default function MyTexts() {
  const [myTexts, setMyTexts] = useState([]);
  const [sharedTexts, setSharedTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State pour le modal de partage
  const [shareData, setShareData] = useState({ isOpen: false, slug: '', shareToken: '' });

  useEffect(() => {
    fetchTexts();
  }, []);

  const fetchTexts = async () => {
    setLoading(true);
    setError('');
    try {
      const [mineRes, sharedRes] = await Promise.all([
        axios.get('/api/user-texts/mine'),
        axios.get('/api/user-texts/shared')
      ]);
      setMyTexts(mineRes.data.texts);
      setSharedTexts(sharedRes.data.texts);
    } catch (err) {
      setError("Impossible de charger ton historique de textes.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slug) => {
    if (!window.confirm("Es-tu sûr de vouloir supprimer ce texte ? Cette action est irréversible et supprimera également l'historique de discussion associé.")) return;

    try {
      await axios.delete(`/api/user-texts/${slug}`);
      setMyTexts(myTexts.filter(t => t.slug !== slug));
    } catch (err) {
      alert("Une erreur est survenue lors de la suppression.");
    }
  };

  const handleTogglePublic = async (slug, currentStatus) => {
    try {
      const res = await axios.post(`/api/user-texts/${slug}/toggle-public`, { is_public: !currentStatus });
      setMyTexts(myTexts.map(t => t.slug === slug ? { ...t, is_public: res.data.is_public } : t));
    } catch (err) {
      alert("Erreur lors de la modification de la visibilité.");
    }
  };

  const handleOpenShare = (slug, shareToken) => {
    setShareData({ isOpen: true, slug, shareToken });
  };

  const handleMarkSeen = async (id, slug) => {
    try {
      await axios.post(`/api/user-texts/mark-seen/${id}`);
      setSharedTexts(sharedTexts.map(t => t.id === id ? { ...t, seen: 1 } : t));
    } catch (err) {}
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ink mb-1.5">Mon classeur de textes</h1>
          <p className="text-sm text-ink-light">Gère les fiches créées par photo et celles reçues de tes camarades.</p>
        </div>
        <Link to="/creer-texte" className="btn-primary self-start sm:self-center flex items-center gap-2">
          <span>➕</span> Créer une nouvelle fiche
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center">
          <svg className="animate-spin w-8 h-8 text-amber-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </div>
      ) : (
        <div className="space-y-12">
          
          {/* Section 1 : Mes créations */}
          <section className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-ink border-b border-parchment-200 pb-2">
              📝 Mes fiches créées ({myTexts.length})
            </h2>

            {myTexts.length === 0 ? (
              <div className="border border-dashed border-parchment-350 rounded-2xl p-8 text-center bg-parchment-50">
                <span className="text-3xl block mb-2">📷</span>
                <p className="font-semibold text-ink text-sm mb-1">Aucune fiche créée</p>
                <p className="text-xs text-ink-light mb-4">Photographie tes propres textes littéraires pour les analyser.</p>
                <Link to="/creer-texte" className="btn-primary text-xs py-2">Créer un texte</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myTexts.map((text) => (
                  <div key={text.id} className="bg-white border border-parchment-300 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-navy-100 text-navy-600 font-semibold">
                          {text.classe}
                        </span>
                        <button
                          onClick={() => handleTogglePublic(text.slug, text.is_public)}
                          className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                            text.is_public 
                              ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                              : 'bg-parchment-100 border-parchment-300 text-ink-light hover:bg-parchment-200'
                          }`}
                          title={text.is_public ? "Fiche visible dans l'Espace Classe" : "Fiche privée (visible uniquement par toi)"}
                        >
                          {text.is_public ? '🌐 Public' : '🔒 Privé'}
                        </button>
                      </div>

                      <h3 className="font-serif text-lg font-bold text-ink leading-tight mb-1">{text.title}</h3>
                      <p className="text-xs text-ink-light italic mb-1">{text.oeuvre} — {text.auteur}</p>
                      <p className="text-[10px] text-ink-pale">Créé le {new Date(text.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>

                    <div className="flex gap-2 mt-4 pt-4 border-t border-parchment-100">
                      <Link
                        to={`/textes-utilisateur/${text.slug}`}
                        className="btn-secondary text-xs px-3 py-1.5 border border-parchment-350 text-ink hover:bg-parchment-50 flex-1 text-center font-medium rounded-lg"
                      >
                        Voir
                      </Link>
                      <button
                        onClick={() => handleOpenShare(text.slug, text.share_token)}
                        className="btn-secondary text-xs px-3 py-1.5 border border-parchment-350 text-ink hover:bg-parchment-50 flex-1 text-center font-medium rounded-lg"
                      >
                        Partager
                      </button>
                      <button
                        onClick={() => handleDelete(text.slug)}
                        className="text-xs text-red-600 hover:text-white border border-red-200 hover:bg-red-600 px-2 py-1.5 rounded-lg transition-colors"
                        title="Supprimer la fiche"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section 2 : Partagés avec moi */}
          <section className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-ink border-b border-parchment-200 pb-2">
              📥 Reçus en partage ({sharedTexts.length})
            </h2>

            {sharedTexts.length === 0 ? (
              <div className="border border-dashed border-parchment-350 rounded-2xl p-8 text-center bg-parchment-50">
                <span className="text-3xl block mb-2">✉️</span>
                <p className="font-semibold text-ink text-sm mb-1">Aucun texte reçu</p>
                <p className="text-xs text-ink-light">Tes camarades de classe peuvent t'envoyer des textes directement.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sharedTexts.map((text) => (
                  <div key={text.id} className={`bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                    !text.seen ? 'border-amber-400 bg-amber-50/20' : 'border-parchment-300'
                  }`}>
                    <div>
                      <div className="flex justify-between items-center gap-2 mb-2">
                        <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-navy-100 text-navy-600 font-semibold">
                          {text.classe}
                        </span>
                        {!text.seen && (
                          <span className="bg-amber-500 text-navy-950 font-semibold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full animate-pulse">
                            Nouveau
                          </span>
                        )}
                      </div>

                      <h3 className="font-serif text-lg font-bold text-ink leading-tight mb-1">{text.title}</h3>
                      <p className="text-xs text-ink-light italic mb-1">{text.oeuvre} — {text.auteur}</p>
                      <div className="bg-parchment-100 rounded-lg p-2 mt-2 text-[11px] text-ink-light flex items-center gap-1.5">
                        <span className="text-sm">👤</span>
                        Partagé par <span className="font-bold text-ink">@{text.shared_by}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4 pt-4 border-t border-parchment-100">
                      <Link
                        to={`/textes-utilisateur/${text.slug}`}
                        onClick={() => handleMarkSeen(text.id, text.slug)}
                        className="btn-primary text-xs py-1.5 flex-1 text-center font-medium rounded-lg"
                      >
                        Consulter
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      )}

      {/* Modal de Partage */}
      <ShareModal
        isOpen={shareData.isOpen}
        onClose={() => setShareData({ isOpen: false, slug: '', shareToken: '' })}
        slug={shareData.slug}
        shareToken={shareData.shareToken}
      />
    </div>
  );
}
