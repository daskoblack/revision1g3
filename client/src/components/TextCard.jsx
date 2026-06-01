import { Link } from 'react-router-dom';

export default function TextCard({ text }) {
  return (
    <Link
      to={`/textes/${text.id}`}
      className="card group block hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="badge">{text.mouvement}</span>
          <span className="text-xs text-ink-pale tabular-nums">{text.annee}</span>
        </div>
        <h2 className="font-serif text-base font-semibold text-ink group-hover:text-amber-600 transition-colors leading-snug mb-1">
          {text.oeuvre}
        </h2>
        <p className="text-sm text-ink-light">
          <span className="italic">{text.title}</span>
          <span className="mx-1.5 text-parchment-300">·</span>
          {text.auteur}
        </p>
      </div>
      <div className="border-t border-parchment-200 px-5 py-2.5 bg-parchment-50 flex items-center justify-between">
        <span className="text-xs text-ink-pale">Analyse complète + IA</span>
        <span className="text-amber-600 text-sm font-medium group-hover:translate-x-1 transition-transform">→</span>
      </div>
    </Link>
  );
}
