import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import ChatWidget from '../components/ChatWidget';

function Section({ title, children, accent = false }) {
  const cls = accent ? 'card-accent' : 'section-card';
  return (
    <section className={cls}>
      <h2 className="section-title">{title}</h2>
      {children}
    </section>
  );
}

export default function UserTextDetail() {
  const { slug } = useParams();
  const [text, setText] = useState(null);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('analyse'); // 'analyse' | 'chat' - mobile tabs

  useEffect(() => {
    fetchTextDetail();
  }, [slug]);

  const fetchTextDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`/api/user-texts/${slug}`);
      setText(res.data.text);
      setContent(JSON.parse(res.data.text.content_json));
    } catch (err) {
      setError("Fiche d'analyse introuvable ou accès refusé.");
    } finally {
      setLoading(false);
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

  if (error || !text) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="text-5xl">🔍</div>
        <h1 className="font-serif text-2xl font-semibold text-ink">Texte introuvable</h1>
        <p className="text-ink-light">{error || "Ce texte n'existe pas ou vous n'avez pas l'autorisation d'y accéder."}</p>
        <Link to="/mes-textes" className="btn-primary inline-block">← Retour à mon classeur</Link>
      </div>
    );
  }

  const analysisContent = (
    <div className="space-y-0">
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

      {/* Procédés stylistiques */}
      <Section title="Procédés stylistiques">
        <div className="space-y-3">
          {content.procedesStyliques?.map((p, i) => (
            <div key={i} className="bg-parchment-50 border border-parchment-200 rounded-lg p-3.5">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-1.5">
                <span className="font-semibold text-ink text-sm">{p.procede}</span>
                <span className="text-ink-pale text-xs">·</span>
                <span className="italic text-ink-light text-sm">"{p.exemple}"</span>
              </div>
              <p className="text-ink-light text-sm leading-relaxed">→ {p.effet}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Problématiques */}
      <Section title="Problématiques possibles">
        <ul className="space-y-2">
          {content.problematiquesPossibles?.map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-ink-light">
              <span className="text-amber-600 font-bold shrink-0 mt-0.5">→</span>
              <span className="leading-relaxed">{p}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Axes de lecture */}
      <Section title="Axes de lecture">
        <ol className="space-y-3">
          {content.axesLecture?.map((a, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-navy-100 text-navy-500 font-semibold text-xs flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="text-ink-light leading-relaxed">{a}</span>
            </li>
          ))}
        </ol>
      </Section>

      {/* Conclusion */}
      <Section title="Conclusion rédigée" accent>
        <p className="text-ink leading-relaxed whitespace-pre-line">{content.conclusion}</p>
      </Section>

      {/* Mémo */}
      <section className="section-card bg-amber-600/5 border-amber-600/20">
        <h2 className="section-title border-amber-600/20">
          <span className="mr-2">💡</span> Mémo rapide
        </h2>
        <ul className="space-y-2">
          {content.mnemo?.map((m, i) => (
            <li key={i} className="flex items-start gap-2 text-ink-light text-sm">
              <span className="text-amber-600 shrink-0 mt-0.5">✓</span>
              {m}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 animate-fade-in">
      
      {/* Retour */}
      <Link
        to="/mes-textes"
        className="inline-flex items-center gap-1.5 text-sm text-ink-light hover:text-ink transition-colors mb-6 font-semibold"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour à mon classeur
      </Link>

      {/* En-tête */}
      <header className="mb-8 border-b border-parchment-200 pb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="badge">{text.mouvement}</span>
          <span className="text-ink-pale text-sm">{text.annee}</span>
          <span className="bg-amber-100 text-amber-800 font-semibold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
            fiche perso ({text.classe})
          </span>
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

      {/* Onglets MOBILE uniquement */}
      <div className="flex lg:hidden border border-parchment-300 rounded-xl overflow-hidden mb-6">
        {[
          { id: 'analyse', label: '📖 Analyse' },
          { id: 'chat',    label: '💬 M. Marin' },
        ].map(({ id: tid, label }) => (
          <button
            key={tid}
            onClick={() => setTab(tid)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === tid
                ? 'bg-navy-900 text-white'
                : 'bg-white text-ink-light hover:bg-parchment-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Dual column layout */}
      <div className="lg:grid lg:grid-cols-[1fr,400px] xl:grid-cols-[1fr,440px] lg:gap-8 lg:items-start">
        {/* Colonne analyse */}
        <div className={tab === 'analyse' ? 'block' : 'hidden lg:block'}>
          {analysisContent}
        </div>

        {/* Colonne chat */}
        <div className={`${tab === 'chat' ? 'block' : 'hidden lg:block'} lg:sticky lg:top-20`}>
          <ChatWidget textId={text.slug} textTitle={`${text.title} — ${text.auteur}`} />
        </div>
      </div>

      {/* Bouton flottant mobile */}
      {tab === 'analyse' && (
        <button
          onClick={() => { setTab('chat'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="lg:hidden fixed bottom-5 right-5 bg-navy-900 text-white shadow-xl rounded-full px-5 py-3 text-sm font-medium flex items-center gap-2 z-40 hover:bg-navy-700 transition-colors"
        >
          <span className="text-amber-300 font-serif font-bold">M</span>
          Demander à M. Marin
        </button>
      )}

    </div>
  );
}
