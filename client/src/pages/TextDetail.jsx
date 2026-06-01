import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { texts } from '../data/texts';
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

export default function TextDetail() {
  const { id }   = useParams();
  const text     = texts.find(t => t.id === id);
  const [tab, setTab] = useState('analyse'); // 'analyse' | 'chat' — utilisé sur mobile

  if (!text) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="font-serif text-2xl font-semibold text-ink mb-2">Texte introuvable</h1>
        <p className="text-ink-light mb-6">Ce texte n'existe pas ou n'a pas encore été ajouté.</p>
        <Link to="/textes" className="btn-primary">← Retour aux textes</Link>
      </div>
    );
  }

  const analysisContent = (
    <div className="space-y-0">

      {/* Contexte */}
      <Section title="Contexte">
        {text.contexteAuteur && (
          <p className="text-ink-light leading-relaxed mb-3">{text.contexteAuteur}</p>
        )}
        {text.contexteOeuvre && (
          <p className="text-ink-light leading-relaxed">{text.contexteOeuvre}</p>
        )}
      </Section>

      {/* Résumé */}
      <Section title="Résumé du passage">
        <p className="text-ink-light leading-relaxed">{text.resume}</p>
      </Section>

      {/* Introduction */}
      <Section title="Introduction rédigée" accent>
        <p className="text-ink leading-relaxed whitespace-pre-line">{text.introduction}</p>
      </Section>

      {/* Analyse linéaire */}
      <Section title="Analyse linéaire">
        <div className="space-y-4">
          {text.analyseLineaire?.map((a, i) => (
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
          {text.procedesStyliques?.map((p, i) => (
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
          {text.problematiquesPossibles?.map((p, i) => (
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
          {text.axesLecture?.map((a, i) => (
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
        <p className="text-ink leading-relaxed whitespace-pre-line">{text.conclusion}</p>
      </Section>

      {/* Mémo */}
      <section className="section-card bg-amber-600/5 border-amber-600/20">
        <h2 className="section-title border-amber-600/20">
          <span className="mr-2">💡</span> Mémo rapide
        </h2>
        <ul className="space-y-2">
          {text.mnemo?.map((m, i) => (
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

      {/* Retour */}
      <Link
        to="/textes"
        className="inline-flex items-center gap-1.5 text-sm text-ink-light hover:text-ink transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour aux textes
      </Link>

      {/* En-tête */}
      <header className="mb-8">
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

      {/* ── Onglets MOBILE uniquement ── */}
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

      {/* ── Layout responsive ── */}
      <div className="lg:grid lg:grid-cols-[1fr,400px] xl:grid-cols-[1fr,440px] lg:gap-8 lg:items-start">

        {/* Colonne analyse */}
        <div className={tab === 'analyse' ? 'block' : 'hidden lg:block'}>
          {analysisContent}
        </div>

        {/* Colonne chat — sticky sur desktop */}
        <div className={`${tab === 'chat' ? 'block' : 'hidden lg:block'} lg:sticky lg:top-20`}>
          <ChatWidget textId={text.id} textTitle={`${text.title} — ${text.auteur}`} />
        </div>
      </div>

      {/* Bouton flottant "Chat" — mobile uniquement, visible depuis l'onglet analyse */}
      {tab === 'analyse' && (
        <button
          onClick={() => { setTab('chat'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="lg:hidden fixed bottom-5 right-5 bg-navy-900 text-white shadow-xl rounded-full px-5 py-3 text-sm font-medium flex items-center gap-2 z-40 hover:bg-navy-700 transition-colors"
          aria-label="Ouvrir l'assistant M. Marin"
        >
          <span className="text-amber-300 font-serif font-bold">M</span>
          Demander à M. Marin
        </button>
      )}
    </div>
  );
}
