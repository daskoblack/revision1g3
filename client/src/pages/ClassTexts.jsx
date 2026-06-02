import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function ClassTexts() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtres
  const [selectedGroup, setSelectedGroup] = useState('Toutes'); // 'Toutes' | '1G' | 'STI2D' | 'STMG'
  const [selectedClass, setSelectedClass] = useState('Toutes');
  const [search, setSearch] = useState('');

  // Liste des classes
  const classesByGroup = {
    '1G': ['1G1', '1G2', '1G3', '1G4', '1G5', '1G6', '1G7'],
    'STI2D': ['STI2D1', 'STI2D2'],
    'STMG': ['STMG1', 'STMG2', 'STMG3']
  };

  useEffect(() => {
    fetchClassTexts();
  }, [selectedClass, search]); // eslint-disable-line

  const fetchClassTexts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/user-texts/all', {
        params: {
          classe: selectedClass,
          search: search.trim() || undefined
        }
      });
      setTexts(res.data.texts);
    } catch (err) {
      setError("Impossible de charger les textes de la classe.");
    } finally {
      setLoading(false);
    }
  };

  const handleGroupChange = (group) => {
    setSelectedGroup(group);
    setSelectedClass('Toutes'); // Reset sub-class filter
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8 animate-fade-in">
      
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ink mb-1.5">Espace Classe 📚</h1>
          <p className="text-sm text-ink-light">Consulte et révise à partir des textes créés et partagés par la communauté.</p>
        </div>
        <Link to="/creer-texte" className="btn-primary self-start md:self-center flex items-center gap-2">
          <span>➕</span> Ajouter une analyse
        </Link>
      </div>

      {/* Barre de recherche et filtres de groupes */}
      <div className="bg-white border border-parchment-350 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Recherche */}
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🔍</span>
            <input
              type="text"
              placeholder="Rechercher par titre, auteur, œuvre..."
              className="field w-full pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Groupes de classes (Générale, STI2D, STMG) */}
        <div className="flex flex-wrap gap-2 border-b border-parchment-200 pb-3">
          {['Toutes', '1G', 'STI2D', 'STMG'].map((group) => (
            <button
              key={group}
              onClick={() => handleGroupChange(group)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedGroup === group
                  ? 'bg-navy-900 text-white shadow-sm'
                  : 'bg-parchment-100 text-ink-light hover:bg-parchment-200'
              }`}
            >
              {group === 'Toutes' ? 'Toutes les filières' : group}
            </button>
          ))}
        </div>

        {/* Classes spécifiques si un groupe est sélectionné */}
        {selectedGroup !== 'Toutes' && (
          <div className="flex flex-wrap gap-2 animate-fade-in">
            <button
              onClick={() => setSelectedClass('Toutes')}
              className={`px-3 py-1 rounded-full text-xs font-medium border ${
                selectedClass === 'Toutes'
                  ? 'bg-amber-500 border-amber-500 text-navy-950 font-bold'
                  : 'bg-white border-parchment-300 text-ink-light hover:bg-parchment-50'
              }`}
            >
              Toutes les classes
            </button>
            {classesByGroup[selectedGroup].map((c) => (
              <button
                key={c}
                onClick={() => setSelectedClass(c)}
                className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  selectedClass === c
                    ? 'bg-amber-500 border-amber-500 text-navy-950 font-bold'
                    : 'bg-white border-parchment-300 text-ink-light hover:bg-parchment-50'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
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
        <div className="space-y-6">
          {texts.length === 0 ? (
            <div className="border border-dashed border-parchment-350 rounded-2xl p-12 text-center bg-parchment-50">
              <span className="text-4xl block mb-2">📚</span>
              <p className="font-semibold text-ink mb-1">Aucune fiche trouvée</p>
              <p className="text-xs text-ink-light">Essaie de modifier tes filtres ou crée toi-même la première fiche !</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {texts.map((text) => (
                <div key={text.id} className="bg-white border border-parchment-300 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-parchment-400 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center gap-2 mb-3">
                      <span className="text-[10px] uppercase tracking-wide px-2.5 py-0.5 rounded-full bg-navy-100 text-navy-600 font-bold">
                        {text.classe}
                      </span>
                      <span className="text-[10px] text-ink-pale font-medium">
                        {text.mouvement || 'Général'}
                      </span>
                    </div>

                    <h3 className="font-serif text-lg font-bold text-ink leading-tight mb-1.5">{text.title}</h3>
                    <p className="text-xs text-ink-light italic mb-2">{text.oeuvre} · {text.auteur}</p>
                    
                    <div className="bg-parchment-100 rounded-lg p-2.5 text-[11px] text-ink-light flex items-center gap-1.5 mt-3">
                      <span>👤</span>
                      <span>Créé par <span className="font-bold text-ink">@{text.creator}</span></span>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-parchment-100">
                    <Link
                      to={`/textes-utilisateur/${text.slug}`}
                      className="btn-primary text-xs py-2 w-full text-center block font-semibold rounded-lg"
                    >
                      Consulter la fiche & M. Marin
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
