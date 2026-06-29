import { useParams, Link } from 'react-router-dom';
import { fiches, sectionSlug } from '../data/fiches';

// Met en gras les segments encadrés par **…** dans les exemples
function renderRich(text) {
  return text.split('**').map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="text-ink font-semibold">{part}</strong> : part
  );
}

// Étoiles de priorité (ce qui tombe le plus au bac)
function Stars({ n }) {
  return (
    <span className="text-amber-500 text-xs tracking-tight" title={`Priorité ${n}/5`}>
      {'★'.repeat(n)}<span className="text-parchment-300">{'★'.repeat(5 - n)}</span>
    </span>
  );
}

// Rendu d'un bloc selon son type
function Bloc({ bloc }) {
  // Tableau
  if (bloc.type === 'tableau') {
    return (
      <div className="overflow-x-auto -mx-1 my-2">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-parchment-300">
              {bloc.tete.map((th, i) => (
                <th key={i} className="text-left font-semibold text-ink py-2 px-2 whitespace-nowrap">{th}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bloc.lignes.map((ligne, i) => (
              <tr key={i} className="border-b border-parchment-200">
                {ligne.map((td, j) => (
                  <td key={j} className={`py-2 px-2 align-top ${j === 0 ? 'font-medium text-ink whitespace-nowrap' : 'text-ink-light'}`}>
                    {renderRich(td)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Liste à puces
  if (bloc.type === 'liste') {
    return (
      <div className="my-2">
        {bloc.titre && <p className="font-medium text-ink mb-1.5">{bloc.titre}</p>}
        <ol className="space-y-1.5">
          {bloc.items.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm text-ink-light">
              <span className="text-amber-600 font-semibold tabular-nums shrink-0">{i + 1}.</span>
              <span>{renderRich(item)}</span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  // Réponses types (question → réponse)
  if (bloc.type === 'reponses') {
    return (
      <div className="space-y-2 my-2">
        {bloc.items.map((qa, i) => (
          <div key={i} className="bg-parchment-50 rounded-lg p-3 border border-parchment-200">
            <p className="text-sm font-medium text-ink mb-1">❓ {qa.q}</p>
            <p className="text-sm text-amber-700 flex gap-1.5">
              <span className="shrink-0">➡️</span>
              <span>{renderRich(qa.r)}</span>
            </p>
          </div>
        ))}
      </div>
    );
  }

  // Astuce / conseil
  if (bloc.type === 'astuce') {
    return (
      <div className="my-2 bg-amber-300/15 border-l-4 border-l-amber-500 rounded-r-lg px-4 py-3">
        <p className="text-sm text-ink leading-relaxed">
          <span className="font-semibold">💡 Astuce : </span>{renderRich(bloc.texte)}
        </p>
      </div>
    );
  }

  // Notion (par défaut)
  return (
    <div className="my-2 bg-white rounded-lg border border-parchment-200 p-3.5">
      <p className="font-serif font-semibold text-ink mb-1">{bloc.nom}</p>
      {bloc.regle && <p className="text-sm text-ink-light mb-2">{bloc.regle}</p>}

      {bloc.declencheurs && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {bloc.declencheurs.map((d, i) => (
            <span key={i} className="badge text-[11px]">{d}</span>
          ))}
        </div>
      )}

      {bloc.exemples && (
        <div className="space-y-1 mb-2">
          {bloc.exemples.map((ex, i) => (
            <p key={i} className="text-sm text-ink-light border-l-2 border-amber-300 pl-2.5 italic">
              {renderRich(ex)}
            </p>
          ))}
        </div>
      )}

      {bloc.reponse && (
        <div className="text-sm space-y-0.5 mt-2 pt-2 border-t border-parchment-200">
          {bloc.reponse.nature && (
            <p><span className="text-ink-pale">Nature : </span><span className="text-ink font-medium">{bloc.reponse.nature}</span></p>
          )}
          {bloc.reponse.fonction && (
            <p><span className="text-ink-pale">Fonction : </span><span className="text-ink font-medium">{bloc.reponse.fonction}</span></p>
          )}
        </div>
      )}

      {bloc.note && <p className="text-xs text-ink-pale mt-1.5">👉 {bloc.note}</p>}
    </div>
  );
}

export default function FicheDetail() {
  const { id } = useParams();
  const fiche = fiches.find(f => f.id === id);

  if (!fiche) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-ink-light mb-4">Cette fiche n'existe pas.</p>
        <Link to="/fiches" className="btn-secondary">← Retour aux fiches</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

      {/* Retour */}
      <Link to="/fiches" className="inline-flex items-center gap-1.5 text-sm text-ink-light hover:text-amber-600 transition-colors mb-5">
        ← Fiches de révision
      </Link>

      {/* En-tête */}
      <div className="card-accent mb-6">
        <div className="text-4xl mb-2">{fiche.emoji}</div>
        <span className="badge mb-2 inline-flex">{fiche.sousTitre}</span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink mb-2">{fiche.titre}</h1>
        <p className="text-ink-light text-sm leading-relaxed">{fiche.description}</p>
        {fiche.objectif && (
          <p className="mt-3 text-sm font-medium text-amber-700">🎯 {fiche.objectif}</p>
        )}
      </div>

      {/* Sommaire (navigation rapide) */}
      <div className="card-padded mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-pale mb-3">Sommaire</p>
        <div className="flex flex-wrap gap-2">
          {fiche.sections.map((s, i) => (
            <a
              key={i}
              href={`#${sectionSlug(s.titre)}`}
              className="text-sm text-ink-light hover:text-amber-600 hover:bg-parchment-100 rounded-md px-2.5 py-1 transition-colors border border-parchment-200"
            >
              {s.titre}
            </a>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-5">
        {fiche.sections.map((s, i) => (
          <section
            key={i}
            id={sectionSlug(s.titre)}
            className="section-card scroll-mt-20 fade-up"
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <div className="flex items-center justify-between gap-3 mb-3 pb-2 border-b border-parchment-200">
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-ink">{s.titre}</h2>
              {s.priorite && <Stars n={s.priorite} />}
            </div>
            <div>
              {s.blocs.map((bloc, j) => <Bloc key={j} bloc={bloc} />)}
            </div>
          </section>
        ))}
      </div>

      {/* Retour bas de page */}
      <div className="mt-8 text-center">
        <Link to="/fiches" className="btn-secondary">← Retour aux fiches</Link>
      </div>
    </div>
  );
}
