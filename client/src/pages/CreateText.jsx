import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function CreateText() {
  const { user, fetchQuota } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Info, 2: Photo, 3: Success
  const [form, setForm] = useState({
    title: '',
    auteur: '',
    oeuvre: '',
    classe: user?.classe || '',
    isPublic: true
  });
  
  const [imageBase64, setImageBase64] = useState('');
  const [mimeType, setMimeType] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState('');
  
  const [warning, setWarning] = useState('');
  const [warningData, setWarningData] = useState(null);
  const [createdSlug, setCreatedSlug] = useState('');

  const setVal = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleImageChange = (e) => {
    setError('');
    setWarning('');
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError("Le fichier sélectionné doit être une image (JPEG, PNG ou WEBP).");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError("L'image est trop volumineuse (maximum 8 Mo).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
      const parts = reader.result.split(',');
      setImageBase64(parts[1]);
      setMimeType(file.type);
    };
    reader.onerror = () => {
      setError("Erreur lors de la lecture du fichier.");
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!imageBase64) return setError("Veuillez prendre ou sélectionner une photo de votre texte.");
    if (!form.classe) return setError("Veuillez sélectionner la classe concernée.");

    setError('');
    setWarning('');
    setLoading(true);
    setLoadingMessage("Analyse de l'image & extraction du texte (OCR)...");

    try {
      const res = await axios.post('/api/user-texts/create', {
        imageBase64,
        mimeType,
        classe: form.classe,
        title: form.title,
        auteur: form.auteur,
        oeuvre: form.oeuvre,
        isPublic: form.isPublic ? 1 : 0
      });

      if (res.data.warning) {
        setWarning(res.data.warning);
        setWarningData(res.data.generatedData);
        setLoading(false);
        return;
      }

      setCreatedSlug(res.data.slug);
      setStep(3);
      fetchQuota(); // Mettre à jour le quota de messages restants si nécessaire
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.error ?? "Une erreur est survenue lors de l'analyse. Vérifie la qualité de l'image.";
      setError(data?.details ? `${msg} (${data.details})` : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDuplicate = async () => {
    if (!warningData) return;
    setError('');
    setLoading(true);
    setLoadingMessage("Création de votre copie personnelle...");

    try {
      const res = await axios.post('/api/user-texts/create', {
        generatedData: warningData,
        classe: form.classe,
        isPublic: form.isPublic ? 1 : 0
      });

      setCreatedSlug(res.data.slug);
      setStep(3);
      setWarning('');
      setWarningData(null);
    } catch (err) {
      setError(err.response?.data?.error ?? "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      {/* Fil d'Ariane / Steps */}
      <div className="flex items-center justify-between mb-8 max-w-md mx-auto relative">
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-parchment-300 -z-10 -translate-y-1/2"></div>
        {[
          { num: 1, label: "Informations" },
          { num: 2, label: "Photo & Analyse" },
          { num: 3, label: "Terminé !" }
        ].map((s) => (
          <div key={s.num} className="flex flex-col items-center gap-1.5 bg-parchment-100 px-3 z-10">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-colors ${
              step === s.num
                ? 'bg-amber-500 text-navy-950 border-amber-500 shadow-md'
                : step > s.num
                ? 'bg-navy-900 text-white border-navy-900'
                : 'bg-white text-ink-light border-parchment-350'
            }`}>
              {step > s.num ? '✓' : s.num}
            </div>
            <span className="text-[10px] sm:text-xs font-medium text-ink-light">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-white border border-parchment-300 rounded-2xl p-6 sm:p-8 shadow-sm">
        
        {/* Étape 1 — Métadonnées */}
        {step === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-5">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink mb-1.5">Créer une fiche d'analyse</h2>
              <p className="text-sm text-ink-light leading-relaxed">
                Remplis ces informations facultatives pour aider l'IA à identifier le texte précis. L'IA complétera automatiquement le reste.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1" htmlFor="classe">
                  Classe concernée <span className="text-red-500">*</span>
                </label>
                <select
                  id="classe"
                  className="field w-full"
                  value={form.classe}
                  onChange={setVal('classe')}
                  required
                >
                  <option value="">Sélectionne la classe</option>
                  <optgroup label="Première Générale">
                    <option value="1G1">1G1</option>
                    <option value="1G2">1G2</option>
                    <option value="1G3">1G3</option>
                    <option value="1G4">1G4</option>
                    <option value="1G5">1G5</option>
                    <option value="1G6">1G6</option>
                    <option value="1G7">1G7</option>
                  </optgroup>
                  <optgroup label="STI2D">
                    <option value="STI2D1">STI2D1</option>
                    <option value="STI2D2">STI2D2</option>
                  </optgroup>
                  <optgroup label="STMG">
                    <option value="STMG1">STMG1</option>
                    <option value="STMG2">STMG2</option>
                    <option value="STMG3">STMG3</option>
                  </optgroup>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1" htmlFor="title">
                    Titre du texte <span className="text-ink-pale font-normal">(optionnel)</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    placeholder="ex : Le Dormeur du val"
                    className="field w-full"
                    value={form.title}
                    onChange={setVal('title')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1" htmlFor="auteur">
                    Auteur <span className="text-ink-pale font-normal">(optionnel)</span>
                  </label>
                  <input
                    id="auteur"
                    type="text"
                    placeholder="ex : Arthur Rimbaud"
                    className="field w-full"
                    value={form.auteur}
                    onChange={setVal('auteur')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1" htmlFor="oeuvre">
                  Œuvre d'origine <span className="text-ink-pale font-normal">(optionnel)</span>
                </label>
                <input
                  id="oeuvre"
                  type="text"
                  placeholder="ex : Poésies (ou recueil)"
                  className="field w-full"
                  value={form.oeuvre}
                  onChange={setVal('oeuvre')}
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.isPublic}
                    onChange={setVal('isPublic')}
                    className="w-4 h-4 text-amber-600 border-parchment-350 rounded focus:ring-amber-500"
                  />
                  <div className="text-sm">
                    <p className="font-semibold text-ink">Rendre ce texte public (Espace Classe)</p>
                    <p className="text-xs text-ink-light">Permet à tes camarades de classe de voir cette fiche d'analyse.</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={!form.classe}
                className="btn-primary flex items-center gap-2"
              >
                Continuer 
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </form>
        )}

        {/* Étape 2 — Photo & Analyse */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink mb-1.5">Prendre une photo du texte</h2>
              <p className="text-sm text-ink-light leading-relaxed">
                Prends une photo claire du texte littéraire (page de livre, impression de cours). Assure-toi que la luminosité soit bonne et que les mots soient bien lisibles.
              </p>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                <svg className="animate-spin w-10 h-10 text-amber-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <div className="space-y-1">
                  <p className="font-medium text-ink">{loadingMessage}</p>
                  <p className="text-xs text-ink-light">Cette opération peut prendre jusqu'à 30 secondes...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Zone de preview / dnd */}
                <div className="relative border-2 border-dashed border-parchment-350 rounded-xl overflow-hidden aspect-video bg-parchment-50 flex flex-col items-center justify-center p-4">
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Aperçu du texte" className="absolute inset-0 w-full h-full object-contain" />
                      <button
                        onClick={() => { setImagePreview(''); setImageBase64(''); setMimeType(''); }}
                        className="absolute top-3 right-3 bg-red-600 text-white rounded-full p-2 shadow-lg hover:bg-red-700 transition-colors"
                        title="Supprimer la photo"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-3 text-center p-6 w-full h-full justify-center">
                      <span className="text-4xl">📸</span>
                      <div className="space-y-1">
                        <p className="font-semibold text-ink text-sm sm:text-base">Prendre une photo ou importer un fichier</p>
                        <p className="text-xs text-ink-light">Formats supportés : JPEG, PNG, WEBP (max 8 Mo)</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment" // Active la caméra directement sur smartphone
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {error && (
                  <div role="alert" className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                    <p className="font-semibold mb-0.5">Erreur lors de l'analyse :</p>
                    <p className="text-xs">{error}</p>
                  </div>
                )}

                {warning && (
                  <div role="alert" className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 space-y-3">
                    <p className="font-semibold">⚠️ Doublon détecté :</p>
                    <p className="text-xs leading-relaxed">{warning}</p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleConfirmDuplicate}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
                      >
                        Créer quand même ma version
                      </button>
                      <button
                        onClick={() => { setWarning(''); setWarningData(null); }}
                        className="border border-amber-300 hover:bg-amber-100 text-amber-800 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Modifier les infos
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => { setStep(1); setError(''); setWarning(''); }}
                    className="text-sm font-semibold text-ink-light hover:text-ink transition-colors flex items-center gap-1"
                  >
                    ← Précédent
                  </button>
                  
                  {!warning && (
                    <button
                      onClick={handleAnalyze}
                      disabled={!imageBase64}
                      className="btn-primary flex items-center gap-2"
                    >
                      🔮 Lancer la création par IA
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Étape 3 — Succès */}
        {step === 3 && (
          <div className="py-6 text-center space-y-6">
            <div className="text-5xl">🎉</div>
            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-bold text-ink">Fiche d'analyse prête !</h2>
              <p className="text-sm text-ink-light max-w-md mx-auto leading-relaxed">
                M. Marin a analysé le texte issu de ton image et a généré une fiche de lecture complète ainsi que son propre simulateur de conversation.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
              <Link
                to={`/textes-utilisateur/${createdSlug}`}
                className="btn-primary px-6"
              >
                📖 Lire la fiche d'analyse
              </Link>
              <Link
                to="/mes-textes"
                className="btn-secondary px-6 border border-parchment-350 text-ink hover:bg-parchment-100 transition-colors"
              >
                🗂️ Voir mon historique
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
