// Composant de rendu complet et structuré pour les fiches d'analyse
// Utilisé par TextDetail.jsx et UserTextDetail.jsx
// Gère le format riche (mouvement → idée principale → procédés) ET l'ancien format (passage/analyse)

function Section({ title, children, accent = false, id = '' }) {
  const cls = accent ? "card-accent" : "section-card";
  return (
    <section id={id} className={cls}>
      <h2 className="section-title">{title}</h2>
      {children}
    </section>
  );
}

// Carte d'un procédé stylistique au sein d'un mouvement
function ProcedeCard({ procede }) {
  return (
    <div className="bg-white border border-parchment-300 rounded-xl overflow-hidden shadow-sm">
      {/* Titre du procédé (avec emoji) */}
      <div className="bg-navy-900 px-4 py-2.5">
        <p className="font-semibold text-white text-sm sm:text-base">{procede.titre}</p>
      </div>
      <div className="p-4 sm:p-5 space-y-3">
        {/* Citation encadrée */}
        {procede.citation && (
          <blockquote className="border-l-4 border-amber-500 bg-amber-50/60 pl-4 pr-3 py-2.5 rounded-r-lg">
            <p className="font-serif italic text-ink text-[15px] leading-relaxed">« {procede.citation} »</p>
          </blockquote>
        )}
        {/* Explication */}
        <p className="text-ink-light leading-relaxed text-[15px]">{procede.explication}</p>
      </div>
    </div>
  );
}

export default function TextDisplay({ text, content }) {
  if (!text || !content) return null;

  // Détecte si un mouvement utilise le format riche
  const isRich = (mvt) => Array.isArray(mvt.procedes);

  return (
    <div className="space-y-0">

      {/* 1. TEXTE COMPLET */}
      <Section title="📖 Texte complet" id="texte-complet">
        <div className="bg-parchment-50 border-l-4 border-amber-600 rounded-r-lg p-5 font-serif leading-loose text-ink whitespace-pre-wrap text-[15px]">
          {content.texteComplet || "(Texte non disponible)"}
        </div>
      </Section>

      {/* 2. CONTEXTE */}
      <Section title="🎭 Contexte historique et littéraire" id="contexte">
        <div className="space-y-3">
          {content.contexteAuteur && (
            <div>
              <p className="font-semibold text-sm text-amber-700 mb-1">L'auteur</p>
              <p className="text-ink-light leading-relaxed">{content.contexteAuteur}</p>
            </div>
          )}
          {content.contexteOeuvre && (
            <div>
              <p className="font-semibold text-sm text-amber-700 mb-1">L'œuvre</p>
              <p className="text-ink-light leading-relaxed">{content.contexteOeuvre}</p>
            </div>
          )}
        </div>
      </Section>

      {/* 3. RÉSUMÉ */}
      <Section title="💡 Résumé du passage" id="resume">
        <p className="text-ink-light leading-relaxed">{content.resume}</p>
      </Section>

      {/* 4. PROBLÉMATIQUE — bien mise en évidence */}
      {content.problematique && (
        <section id="problematique" className="section-card bg-navy-900 border-navy-900">
          <h2 className="section-title text-white border-navy-700">
            <span className="mr-2">❓</span> Problématique
          </h2>
          <p className="font-serif text-lg sm:text-xl text-amber-300 leading-relaxed italic">
            {content.problematique}
          </p>
        </section>
      )}

      {/* 5. INTRODUCTION */}
      <Section title="🎯 Introduction rédigée (à mémoriser)" accent id="introduction">
        <p className="text-ink leading-relaxed whitespace-pre-line">
          {content.introduction}
        </p>
      </Section>

      {/* 6. ANALYSE LINÉAIRE — cœur de la fiche */}
      <section id="analyse-lineaire" className="section-card">
        <h2 className="section-title">🔍 Analyse linéaire détaillée</h2>

        <div className="space-y-8">
          {content.analyseLineaire?.map((mvt, i) => (
            <div key={i}>
              {/* En-tête du mouvement */}
              <div className="flex items-center gap-3 mb-3">
                <span className="flex-shrink-0 w-9 h-9 rounded-full bg-amber-500 text-navy-950 font-bold text-base flex items-center justify-center shadow-sm">
                  {i + 1}
                </span>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-navy-900 leading-tight">
                  {mvt.titre || mvt.passage}
                </h3>
              </div>

              {/* Idée principale */}
              {mvt.ideePrincipale && (
                <div className="bg-navy-50 border-l-4 border-navy-900 rounded-r-lg px-4 py-3 mb-4">
                  <p className="text-ink leading-relaxed">
                    <span className="font-semibold text-navy-900">Idée principale : </span>
                    {mvt.ideePrincipale}
                  </p>
                </div>
              )}

              {/* Procédés du mouvement — format riche */}
              {isRich(mvt) ? (
                <div className="space-y-4">
                  {mvt.procedes.map((p, j) => (
                    <ProcedeCard key={j} procede={p} />
                  ))}
                </div>
              ) : (
                /* Ancien format : analyse en bloc texte */
                <p className="text-ink-light leading-relaxed whitespace-pre-line">
                  {mvt.analyse}
                </p>
              )}

              {/* Séparateur entre mouvements */}
              {i < content.analyseLineaire.length - 1 && (
                <div className="border-b-2 border-dashed border-parchment-300 mt-8"></div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 7. RÉCAPITULATIF DES MOUVEMENTS */}
      <Section title="📊 Récapitulatif des mouvements" id="recap-mouvements">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-navy-100 border-b-2 border-navy-900">
                <th className="text-left px-3 py-2.5 font-semibold text-navy-900 w-12">#</th>
                <th className="text-left px-3 py-2.5 font-semibold text-navy-900">Mouvement</th>
                <th className="text-left px-3 py-2.5 font-semibold text-navy-900">Procédés majeurs</th>
              </tr>
            </thead>
            <tbody>
              {content.analyseLineaire?.map((mvt, i) => {
                const procedesMajeurs = isRich(mvt)
                  ? mvt.procedes.slice(0, 3).map(p => p.titre.replace(/^[^\p{L}]*/u, '')).join(' · ')
                  : '—';
                const titre = (mvt.titre || mvt.passage || '').replace(/^(Mouvement|Première unité|Deuxième unité|Troisième unité)[^:]*:\s*/i, '');
                return (
                  <tr key={i} className="border-b border-parchment-300 align-top">
                    <td className="px-3 py-3">
                      <span className="inline-flex w-6 h-6 rounded-full bg-amber-500 text-navy-950 font-bold text-xs items-center justify-center">
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-ink font-medium">{titre}</td>
                    <td className="px-3 py-3 text-ink-light italic">{procedesMajeurs}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 8. PROCÉDÉS STYLISTIQUES (synthèse) */}
      {content.procedesStyliques?.length > 0 && (
        <Section title="✨ Procédés stylistiques clés" id="procedes">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {content.procedesStyliques.map((p, i) => (
              <div
                key={i}
                className="bg-gradient-to-br from-parchment-50 to-amber-50 border-2 border-amber-300/50 rounded-lg p-4"
              >
                <p className="font-semibold text-amber-900 text-sm leading-snug mb-2.5">
                  {p.procede}
                </p>
                <div className="mb-2.5 bg-white rounded px-2.5 py-1.5 border border-amber-200/50">
                  <p className="text-xs italic text-ink-light">« {p.exemple} »</p>
                </div>
                <p className="text-xs text-ink-light leading-relaxed">
                  <strong>Effet :</strong> {p.effet}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 9. AXES DE LECTURE */}
      {content.axesLecture?.length > 0 && (
        <Section title="🧭 Axes de lecture" id="axes">
          <ol className="space-y-3">
            {content.axesLecture.map((a, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-navy-900 text-white font-bold text-xs flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-ink-light leading-relaxed flex-1">{a}</span>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* 10. PROBLÉMATIQUES POSSIBLES */}
      {content.problematiquesPossibles?.length > 0 && (
        <Section title="❓ Autres problématiques possibles" id="problematiques">
          <ul className="space-y-2.5">
            {content.problematiquesPossibles.map((p, i) => (
              <li key={i} className="flex items-start gap-2.5 p-3 bg-amber-50/60 rounded-lg border-l-4 border-amber-600">
                <span className="font-serif font-bold text-amber-700 mt-0.5">→</span>
                <span className="text-ink-light leading-relaxed flex-1">{p}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 11. CONCLUSION */}
      <Section title="✅ Conclusion rédigée (à mémoriser)" accent id="conclusion">
        <p className="text-ink leading-relaxed whitespace-pre-line">
          {content.conclusion}
        </p>
      </Section>

      {/* 12. MÉMOS MNÉMOTECHNIQUES */}
      {content.mnemo?.length > 0 && (
        <section className="section-card bg-gradient-to-br from-amber-50 via-amber-50/70 to-orange-50 border-l-4 border-amber-600">
          <h2 className="section-title border-amber-600/30">
            <span className="mr-2">🧠</span> Moyens mnémotechniques
          </h2>
          <div className="space-y-3.5">
            {content.mnemo.map((m, i) => (
              <div
                key={i}
                className="bg-white/80 rounded-lg p-4 border-2 border-amber-300/40 shadow-sm"
              >
                <p className="text-sm text-ink leading-relaxed">{m}</p>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
