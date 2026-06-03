import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import ChatWidget from "../components/ChatWidget";
import TextDisplay from "../components/TextDisplay";

export default function UserTextDetail() {
  const { slug } = useParams();
  const [text, setText] = useState(null);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("analyse"); // 'analyse' | 'chat' - mobile tabs

  useEffect(() => {
    fetchTextDetail();
  }, [slug]);

  const fetchTextDetail = async () => {
    setLoading(true);
    setError("");
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
        <svg
          className="animate-spin w-8 h-8 text-amber-500"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      </div>
    );
  }

  if (error || !text) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="text-5xl">🔍</div>
        <h1 className="font-serif text-2xl font-semibold text-ink">
          Texte introuvable
        </h1>
        <p className="text-ink-light">
          {error ||
            "Ce texte n'existe pas ou vous n'avez pas l'autorisation d'y accéder."}
        </p>
        <Link to="/mes-textes" className="btn-primary inline-block">
          ← Retour à mon classeur
        </Link>
      </div>
    );
  }

  const analysisContent = <TextDisplay text={text} content={content} />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 animate-fade-in">
      {/* Retour */}
      <Link
        to="/mes-textes"
        className="inline-flex items-center gap-1.5 text-sm text-ink-light hover:text-ink transition-colors mb-6 font-semibold"
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

      {/* Dual column layout */}
      <div className="lg:grid lg:grid-cols-[1fr,360px] xl:grid-cols-[1fr,400px] lg:gap-8 lg:items-start">
        {/* Colonne analyse */}
        <div className={tab === "analyse" ? "block" : "hidden lg:block"}>
          {analysisContent}
        </div>

        {/* Colonne chat */}
        <div
          className={`${tab === "chat" ? "block" : "hidden lg:block"} lg:sticky lg:top-20`}
        >
          <ChatWidget
            textId={text.slug}
            textTitle={`${text.title} — ${text.auteur}`}
          />
        </div>
      </div>

      {/* Bouton flottant mobile */}
      {tab === "analyse" && (
        <button
          onClick={() => {
            setTab("chat");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="lg:hidden fixed bottom-5 right-5 bg-navy-900 text-white shadow-xl rounded-full px-5 py-3 text-sm font-medium flex items-center gap-2 z-40 hover:bg-navy-700 transition-colors"
        >
          <span className="text-amber-300 font-serif font-bold">M</span>
          Demander à M. Marin
        </button>
      )}
    </div>
  );
}
