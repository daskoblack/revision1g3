// Données des fiches de révision — méthode + notions clés à mémoriser pour le bac.
// Chaque fiche = { id, emoji, titre, sousTitre, description, sections[] }.
// Chaque section = { titre, priorite (1→5 étoiles), blocs[] }.
// Types de blocs supportés par le rendu (voir FicheDetail.jsx) :
//   - notion   : { nom, regle?, declencheurs?[], exemples?[], reponse?{nature,fonction}, note? }
//   - tableau  : { type:'tableau', tete[], lignes[][] }
//   - liste    : { type:'liste', titre?, items[] }
//   - reponses : { type:'reponses', items[{q, r}] }
//   - astuce   : { type:'astuce', texte }
// Astuce de mise en forme : **texte** devient gras dans les exemples.

export const fiches = [
  {
    id: 'grammaire-bac',
    emoji: '📚',
    titre: 'Question de grammaire',
    sousTitre: 'Viser 2/2 à l\'oral',
    description:
      "Inutile d'apprendre toute la grammaire française : seul compte ce qui tombe vraiment au bac. Propositions, fonctions, négations, le mot « que »… l'essentiel, ultra simple.",
    objectif: '2 points faciles si tu maîtrises ces 6 notions clés.',
    sections: [
      {
        titre: 'Les propositions',
        priorite: 5,
        blocs: [
          {
            nom: 'Proposition indépendante',
            regle: 'Elle ne dépend de personne, elle se suffit à elle-même.',
            exemples: ['Peter vend son ombre.'],
          },
          {
            nom: 'Proposition principale',
            regle: 'Celle qui commande une subordonnée.',
            exemples: ['Je pense **que Peter est riche.**'],
            note: 'La principale ici, c\'est « Je pense ».',
          },
          {
            nom: 'Subordonnée relative',
            regle: 'Elle complète un nom (l\'antécédent) et commence par un pronom relatif.',
            declencheurs: ['qui', 'que', 'dont', 'où', 'lequel'],
            exemples: ['L\'homme **qui parle**.'],
            reponse: {
              nature: 'Proposition subordonnée relative',
              fonction: 'Complément de l\'antécédent',
            },
          },
          {
            nom: 'Subordonnée complétive',
            regle: 'Elle complète un verbe et commence le plus souvent par « que ».',
            declencheurs: ['que'],
            exemples: ['Je pense **que Peter regrette.**'],
            reponse: {
              nature: 'Proposition subordonnée complétive',
              fonction: 'COD du verbe de la principale',
            },
          },
          {
            nom: 'Subordonnée circonstancielle',
            regle: 'Elle précise les circonstances (temps, cause, but…) et commence par une conjonction.',
            declencheurs: ['lorsque', 'quand', 'si', 'parce que', 'puisque', 'comme', 'bien que', 'afin que'],
            exemples: ['**Lorsque Peter arrive**…'],
            reponse: {
              nature: 'Subordonnée circonstancielle (ici, de temps)',
            },
          },
        ],
      },
      {
        titre: 'Les fonctions',
        priorite: 5,
        blocs: [
          {
            nom: 'Sujet',
            regle: 'Réponds à « Qui est-ce qui… ? »',
            exemples: ['**Peter** vend.'],
            note: 'Qui vend ? → Peter.',
          },
          {
            nom: 'COD — Complément d\'Objet Direct',
            regle: 'Réponds à « quoi ? » / « qui ? » après le verbe, sans préposition.',
            exemples: ['Peter vend **son ombre**.'],
            note: 'Vend quoi ? → son ombre.',
          },
          {
            nom: 'COI — Complément d\'Objet Indirect',
            regle: 'Comme le COD mais avec une préposition (à, de…).',
            exemples: ['Il parle **à Bendel**.'],
            note: 'Parle à qui ? → à Bendel.',
          },
          {
            nom: 'Attribut du sujet',
            regle: 'Après un verbe d\'état : être, sembler, devenir, paraître, rester.',
            exemples: ['Peter est **riche**.'],
            note: 'Attribut → riche.',
          },
          {
            nom: 'Complément circonstanciel',
            regle: 'Il donne une circonstance et peut être supprimé ou déplacé.',
            declencheurs: ['lieu', 'temps', 'cause', 'but', 'manière'],
          },
        ],
      },
      {
        titre: 'Les négations',
        priorite: 5,
        blocs: [
          {
            nom: 'Négation totale',
            regle: 'Elle porte sur TOUTE la phrase.',
            exemples: [
              'Je **ne** viens **pas**.',
              'Je **ne** veux **plus** partir.',
              'Je **ne** vois **rien**.',
            ],
          },
          {
            nom: 'Négation partielle',
            regle: 'Elle porte sur UN SEUL élément de la phrase.',
            exemples: ['Je ne vois **personne**.'],
            note: 'On nie seulement les personnes, pas toute la phrase.',
          },
          {
            type: 'tableau',
            tete: ['Négation', 'Exemple'],
            lignes: [
              ['ne… pas', 'Je ne viens pas.'],
              ['ne… plus', 'Je ne viens plus.'],
              ['ne… jamais', 'Je ne viens jamais.'],
              ['ne… rien', 'Je ne vois rien.'],
              ['ne… personne', 'Je ne vois personne.'],
              ['ne… ni… ni', 'Il ne veut ni manger ni boire.'],
              ['ne… guère', 'Je ne travaille guère.'],
              ['ne… aucun', 'Je n\'ai aucune idée.'],
            ],
          },
        ],
      },
      {
        titre: 'Les types de phrases',
        priorite: 4,
        blocs: [
          { nom: 'Déclarative', exemples: ['Il vient.'] },
          { nom: 'Interrogative', exemples: ['Vient-il ?'] },
          { nom: 'Exclamative', exemples: ['Comme il est beau !'] },
          { nom: 'Injonctive', exemples: ['Viens !'] },
        ],
      },
      {
        titre: 'Les formes de phrases',
        priorite: 4,
        blocs: [
          {
            nom: 'Affirmative / Négative',
            regle: 'Une phrase affirme ou nie.',
            exemples: ['Il vient. / Il **ne** vient **pas**.'],
          },
          {
            nom: 'Active',
            regle: 'Le sujet fait l\'action.',
            exemples: ['**Peter** vend son ombre.'],
          },
          {
            nom: 'Passive',
            regle: 'Le sujet subit l\'action (verbe « être » + participe passé).',
            exemples: ['L\'ombre **est vendue** par Peter.'],
          },
        ],
      },
      {
        titre: 'Les classes grammaticales',
        priorite: 4,
        blocs: [
          {
            type: 'tableau',
            tete: ['Classe', 'Exemple'],
            lignes: [
              ['Nom', 'Peter'],
              ['Verbe', 'vend'],
              ['Adjectif', 'riche'],
              ['Pronom', 'il'],
              ['Déterminant', 'le'],
              ['Préposition', 'à, de, pour, sans'],
              ['Conjonction', 'mais, car, et'],
              ['Adverbe', 'très, ici, rapidement'],
            ],
          },
        ],
      },
      {
        titre: 'Le mot « que »',
        priorite: 5,
        blocs: [
          {
            nom: 'Conjonction',
            regle: 'Il introduit une subordonnée complétive.',
            exemples: ['Je pense **que** Peter vient.'],
          },
          {
            nom: 'Pronom relatif',
            regle: 'Il remplace un nom (l\'antécédent).',
            exemples: ['Le livre **que** je lis.'],
          },
          {
            type: 'astuce',
            texte: 'Test : si « que » remplace un nom → pronom relatif. Sinon, s\'il introduit une idée complète → conjonction.',
          },
        ],
      },
      {
        titre: 'Le mot « qui »',
        priorite: 3,
        blocs: [
          {
            nom: 'Toujours pronom relatif (au lycée)',
            exemples: ['L\'homme **qui** parle.'],
          },
        ],
      },
      {
        titre: 'Les valeurs des temps',
        priorite: 4,
        blocs: [
          {
            type: 'tableau',
            tete: ['Temps', 'Valeur'],
            lignes: [
              ['Présent', 'vérité générale / narration'],
              ['Imparfait', 'description / habitude'],
              ['Passé simple', 'action ponctuelle'],
              ['Futur', 'avenir'],
              ['Conditionnel', 'hypothèse'],
              ['Subjonctif', 'après « bien que », « il faut que », « pour que »'],
            ],
          },
        ],
      },
      {
        titre: 'Les expansions du nom',
        priorite: 4,
        blocs: [
          {
            nom: 'Adjectif',
            exemples: ['le **mystérieux** homme'],
          },
          {
            nom: 'Complément du nom',
            exemples: ['l\'homme **en gris**'],
          },
          {
            nom: 'Proposition relative',
            exemples: ['l\'homme **qui parle**'],
          },
        ],
      },
      {
        titre: 'Les réponses types à apprendre',
        priorite: 5,
        blocs: [
          {
            type: 'reponses',
            items: [
              { q: 'Nature de « qui… » ?', r: 'Proposition subordonnée relative.' },
              { q: 'Sa fonction ?', r: 'Complément de l\'antécédent.' },
              { q: 'Nature de « que… » ?', r: 'Proposition subordonnée complétive.' },
              { q: 'Sa fonction ?', r: 'COD du verbe de la principale.' },
              {
                q: 'Quelle est cette négation ?',
                r: 'Totale (ne…pas, ne…plus, ne…jamais) ou partielle (ne…personne, ne…rien, ne…aucun).',
              },
            ],
          },
        ],
      },
      {
        titre: 'Les 6 notions à maîtriser absolument',
        priorite: 5,
        blocs: [
          {
            type: 'liste',
            items: [
              'Les propositions subordonnées (relative, complétive, circonstancielle).',
              'Les fonctions (sujet, COD, COI, attribut, complément de l\'antécédent).',
              'Les négations (totale et partielle, avec leurs marqueurs).',
              'La différence « que » conjonction / « que » pronom relatif.',
              'Les types et formes de phrases (déclarative, interrogative… / active, passive).',
              'Les valeurs des temps (présent, imparfait, passé simple, futur, conditionnel, subjonctif).',
            ],
          },
          {
            type: 'astuce',
            texte: 'Maîtrise ces 6 points + entraîne-toi sur les textes de ton descriptif = tu couvres la grande majorité des questions de grammaire du bac.',
          },
        ],
      },
    ],
  },
];

// Slug d'ancrage pour la navigation interne (sommaire)
export const sectionSlug = (titre) =>
  titre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // retire les accents (diacritiques combinants)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
