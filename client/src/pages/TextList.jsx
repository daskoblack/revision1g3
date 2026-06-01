import { useState, useMemo } from 'react';
import { texts } from '../data/texts';
import TextCard from '../components/TextCard';

const MOVEMENTS = ['Tous', ...new Set(texts.map(t => t.mouvement))];

export default function TextList() {
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('Tous');

  const filtered = useMemo(() => texts.filter(t => {
    const matchSearch = !search || [t.title, t.oeuvre, t.auteur, t.mouvement]
      .some(f => f?.toLowerCase().includes(search.toLowerCase()));
    const matchFilter = filter === 'Tous' || t.mouvement === filter;
    return matchSearch && matchFilter;
  }), [search, filter]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

      {/* En-tête */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink mb-2">
          Textes du programme
        </h1>
        <p className="text-ink-light">
          Clique sur un texte pour accéder à la fiche complète et à l'assistant M.&nbsp;Marin.
        </p>
      </div>

      {/* Barre de recherche + filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-pale pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            className="field pl-10"
            placeholder="Rechercher par titre, auteur, mouvement…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {MOVEMENTS.length > 2 && (
          <select
            className="field sm:w-56"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            {MOVEMENTS.map(m => <option key={m}>{m}</option>)}
          </select>
        )}
      </div>

      {/* Grille de textes */}
      {texts.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📚</div>
          <h2 className="font-serif text-xl font-semibold text-ink mb-2">
            Les fiches arrivent bientôt
          </h2>
          <p className="text-ink-light text-sm max-w-sm mx-auto">
            Les analyses linéaires sont en cours de préparation. Reviens dans quelques instants !
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-ink-light">
          <p className="text-lg">Aucun texte ne correspond à ta recherche.</p>
          <button
            className="btn-ghost mt-3 text-sm"
            onClick={() => { setSearch(''); setFilter('Tous'); }}
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <>
          <p className="text-xs text-ink-pale mb-4 tabular-nums">
            {filtered.length} texte{filtered.length > 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((t, i) => (
              <div key={t.id} className="fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                <TextCard text={t} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
