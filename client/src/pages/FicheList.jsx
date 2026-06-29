import { Link } from 'react-router-dom';
import { fiches } from '../data/fiches';

// Liste des fiches de révision (méthode + notions clés à mémoriser)
export default function FicheList() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

      {/* En-tête */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink mb-2">
          Fiches de révision
        </h1>
        <p className="text-ink-light">
          Des fiches ultra simples à comprendre et à mémoriser pour gagner des points faciles au bac.
        </p>
      </div>

      {/* Grille de fiches */}
      {fiches.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📝</div>
          <h2 className="font-serif text-xl font-semibold text-ink mb-2">
            Les fiches arrivent bientôt
          </h2>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fiches.map((f, i) => (
            <div key={f.id} className="fade-up" style={{ animationDelay: `${i * 40}ms` }}>
              <Link
                to={`/fiches/${f.id}`}
                className="card group block h-full hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className="p-5">
                  <div className="text-3xl mb-3">{f.emoji}</div>
                  <span className="badge mb-3 inline-flex">{f.sousTitre}</span>
                  <h2 className="font-serif text-base font-semibold text-ink group-hover:text-amber-600 transition-colors leading-snug mb-1">
                    {f.titre}
                  </h2>
                  <p className="text-sm text-ink-light leading-relaxed">{f.description}</p>
                </div>
                <div className="border-t border-parchment-200 px-5 py-2.5 bg-parchment-50 flex items-center justify-between">
                  <span className="text-xs text-ink-pale">{f.sections.length} parties</span>
                  <span className="text-amber-600 text-sm font-medium group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
