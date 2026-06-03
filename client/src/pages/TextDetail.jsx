import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { texts } from "../data/texts";
import ChatWidget from "../components/ChatWidget";
import TextDisplay from "../components/TextDisplay";

export default function TextDetail() {
  const { id } = useParams();
  const text = texts.find((t) => t.id === id);
  const [tab, setTab] = useState("analyse"); // 'analyse' | 'chat' — utilisé sur mobile

  if (!text) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="font-serif text-2xl font-semibold text-ink mb-2">
          Texte introuvable
        </h1>
        <p className="text-ink-light mb-6">
          Ce texte n'existe pas ou n'a pas encore été ajouté.
        </p>
        <Link to="/textes" className="btn-primary">
          ← Retour aux textes
        </Link>
      </div>
    );
  }

  const analysisContent = <TextDisplay text={text} content={text} />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {/* Retour */}
      <Link
        to="/textes"
        className="inline-flex items-center gap-1.5 text-sm text-ink-light hover:text-ink transition-colors mb-6"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
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
          { id: "analyse", label: "📖 Analyse" },
          { id: "chat", label: "💬 M. Marin" },
        ].map(({ id: tid, label }) => (
          <button
            key={tid}
            onClick={() => setTab(tid)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === tid
                ? "bg-navy-900 text-white"
                : "bg-white text-ink-light hover:bg-parchment-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Layout responsive ── */}
      <div className="lg:grid lg:grid-cols-[1fr,360px] xl:grid-cols-[1fr,400px] lg:gap-8 lg:items-start">
        {/* Colonne analyse */}
        <div className={tab === "analyse" ? "block" : "hidden lg:block"}>
          {analysisContent}
        </div>

        {/* Colonne chat — sticky sur desktop */}
        <div
          className={`${tab === "chat" ? "block" : "hidden lg:block"} lg:sticky lg:top-20`}
        >
          <ChatWidget
            textId={text.id}
            textTitle={`${text.title} — ${text.auteur}`}
          />
        </div>
      </div>

      {/* Bouton flottant "Chat" — mobile uniquement, visible depuis l'onglet analyse */}
      {tab === "analyse" && (
        <button
          onClick={() => {
            setTab("chat");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
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
