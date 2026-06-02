import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Section({ title, children, accent = false }) {
  const cls = accent ? 'card-accent' : 'section-card';
  return (
    <section className={cls}>
      <h2 className="section-title">{title}</h2>
      {children}
    </section>
  );
}

export default function SharedTextView() {
  const { token: shareToken } = useParams();
  const { token: userToken } = useAuth();
  const navigate = useNavigate();

  const [text, setText] = useState(null);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [accepting, setAccepting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchSharedText();
  }, [shareToken]); // eslint-disable-line

  const fetchSharedText = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`/api/user-texts/by-share-token/${shareToken}`);
      setText(res.data.text);
      setContent(JSON.parse(res.data.text.content_json));
    } catch (err) {
      setError("Ce lien de partage est invalide ou a expiré.");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptShare = async () => {
    if (!userToken) {
      return navigate('/connexion');
    }
    setAccepting(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await axios.post(`/api/user-texts/accept-share/${shareToken}`);
      setSuccessMsg(res.data.message || "Texte ajouté à ton classeur !");
      setTimeout(() => navigate('/mes-textes'), 2000);
    } catch (err) {
      setError(err.response?.data?.error ?? "Une erreur est survenue lors de l'ajout.");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <svg className="animate-spin w-8 h-8 text-amber-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    );
  }

  if (error && !text) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <span className="text-5xl">⚠️</span>
        <h1 className="font-serif text-2xl font-bold text-ink">Lien invalide</h1>
        <p className="text-sm text-ink-light">{error}</p>
        <Link to="/" className="btn-primary inline-block">Retour à l'accueil</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8 animate-fade-in">
      
      {/* Bannière de partage */}
      <div className="bg-amber-600/5 border border-amber-600/20 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-amber-700 font-bold">Fiche partagée</p>
          <p className="text-sm text-ink-light">
            Cette fiche a été créée par <span className="font-bold text-ink">@{text.creator}</span> pour la classe <span className="font-bold text-ink">{text.classe}</span>.
          </p>
        </div>

        {successMsg ? (
          <div className="bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-4 py-2.5 rounded-xl">
            {successMsg} Redirection...
          </div>
        ) : (
          <button
            onClick={handleAcceptShare}
            disabled={accepting}
            className="btn-primary py-2.5 px-5 text-sm shrink-0 flex items-center gap-2"
          >
            <span>📥</span>
            {userToken ? "Ajouter à mon classeur" : "Se connecter pour enregistrer"}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">
          {error}
        </div>
      )}

      {/* Détail du texte */}
      <article className="space-y-8">
        
        {/* En-tête */}
        <header className="border-b border-parchment-200 pb-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="badge">{text.mouvement}</span>
            <span className="text-ink-pale text-sm">{text.annee}</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink leading-tight mb-2">
            {text.oeuvre}
          </h1>
          <p className="text-ink-light text-lg">
            <span className="italic">{text.title}</span>
            <span className="mx-2 text-parchment-300">·</span>
            {text.auteur}
          </p>
        </header>

        {/* Fiche complète */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            {/* Contexte */}
            <Section title="Contexte">
              {content.contexteAuteur && (
                <p className="text-ink-light leading-relaxed mb-3">{content.contexteAuteur}</p>
              )}
              {content.contexteOeuvre && (
                <p className="text-ink-light leading-relaxed">{content.contexteOeuvre}</p>
              )}
            </Section>

            {/* Résumé */}
            <Section title="Résumé du passage">
              <p className="text-ink-light leading-relaxed">{content.resume}</p>
            </Section>

            {/* Introduction */}
            <Section title="Introduction rédigée" accent>
              <p className="text-ink leading-relaxed whitespace-pre-line">{content.introduction}</p>
            </Section>

            {/* Analyse linéaire */}
            <Section title="Analyse linéaire">
              <div className="space-y-4">
                {content.analyseLineaire?.map((a, i) => (
                  <div key={i} className="border-b border-parchment-200 pb-4 last:border-0 last:pb-0">
                    <p className="text-amber-600 font-semibold text-sm mb-1.5">{a.passage}</p>
                    <p className="text-ink-light leading-relaxed">{a.analyse}</p>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          <div className="space-y-6">
            {/* Procédés stylistiques */}
            <Section title="Procédés stylistiques">
              <div className="space-y-3">
                {content.procedesStyliques?.map((p, i) => (
                  <div key={i} className="bg-parchment-50 border border-parchment-200 rounded-lg p-3.5">
                    <div className="flex flex-col mb-1.5">
                      <span className="font-semibold text-ink text-xs uppercase tracking-wide text-amber-700">{p.procede}</span>
                      <span className="italic text-ink-light text-sm mt-0.5">"{p.exemple}"</span>
                    </div>
                    <p className="text-ink-light text-xs leading-relaxed">→ {p.effet}</p>
                  </div>
                ))}
              </div>
            </Section>

            {/* Axes de lecture */}
            <Section title="Axes de lecture">
              <ol className="space-y-3">
                {content.axesLecture?.map((a, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-navy-100 text-navy-500 font-semibold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-ink-light text-sm leading-relaxed">{a}</span>
                  </li>
                ))}
              </ol>
            </Section>

            {/* Conclusion */}
            <Section title="Conclusion rédigée" accent>
              <p className="text-ink text-sm leading-relaxed whitespace-pre-line">{content.conclusion}</p>
            </Section>

            {/* Mémo */}
            <section className="section-card bg-amber-600/5 border-amber-600/20 p-4">
              <h2 className="section-title border-amber-600/20 text-sm mb-3">
                <span className="mr-1.5">💡</span> Mémo rapide
              </h2>
              <ul className="space-y-2">
                {content.mnemo?.map((m, i) => (
                  <li key={i} className="flex items-start gap-2 text-ink-light text-xs">
                    <span className="text-amber-600 shrink-0">✓</span>
                    {m}
                  </li>
                ))}
              </ul>
            </section>
          </div>

        </div>
      </article>
      
    </div>
  );
}
