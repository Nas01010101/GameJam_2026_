// levels.js — Level data for Aura: Out of the Grey
// Now supports dynamic difficulty generation

function getLevelsData(difficulty) {
    // Helpers to pick the right variant based on difficulty
    const isFacile = difficulty === 'facile';
    const isDifficile = difficulty === 'difficile';

    // difficulty: 'facile' | 'moyen' | 'difficile'
    return [
        // ══════════════════════════════════════════════════════════════════════════
        // LEVEL 1 — La Classe
        // ══════════════════════════════════════════════════════════════════════════
        {
            id: 1, name: "Niveau 1 — La Classe", type: "classroom",
            playerStart: { x: 430, y: 400 },
            targetWord: isFacile ? "fâché(e)" : (isDifficile ? "accablé(e)" : "frustré(e)"),
            levelSentence: "Je me sens ___ aujourd'hui.",
            gate: { x: 408, y: 450, w: 84, h: 20 },
            exit: { x: 390, y: 470, w: 120, h: 30 },
            npcs: [
                {
                    id: 1, x: 160, y: 200, name: "Amara", color: "#c084fc",
                    scenario: isFacile ? "Ton casier est coincé. Tu es en retard." :
                        isDifficile ? "Tu es en retard. Ton prof t'attend et ton casier refuse de s'ouvrir depuis 10 minutes." :
                            "Tu essaies d'ouvrir ton casier depuis 5 minutes.\nIl ne s'ouvre toujours pas. Tu es en retard.",
                    challengeType: "choice",
                    word: isFacile ? "fâché(e)" : (isDifficile ? "accablé(e)" : "frustré(e)"),
                    isPositive: false,
                    choices: isFacile ? ["fâché(e)", "content(e)"] :
                        isDifficile ? ["accablé(e)", "serein(e)", "indifférent(e)", "enthousiaste"] :
                            ["frustré(e)", "content(e)", "fier/fière"]
                },
                {
                    id: 2, x: 420, y: 200, name: "Léo", color: "#60a5fa",
                    scenario: isFacile ? "Tu as eu une mauvaise note." :
                        isDifficile ? "Tu as étudié toute la nuit pour cette évaluation, mais tu as quand même obtenu un mauvais résultat." :
                            "Tu as reçu une mauvaise note. Tu pensais avoir bien réussi.",
                    challengeType: "choice",
                    word: isFacile ? "triste" : (isDifficile ? "découragé(e)" : "triste"),
                    isPositive: false,
                    choices: isFacile ? ["triste", "content(e)"] :
                        isDifficile ? ["découragé(e)", "motivé(e)", "soulagé(e)", "impatient(e)"] :
                            ["triste", "frustré(e)", "calme"]
                },
                {
                    id: 3, x: 680, y: 200, name: "Sofia", color: "#34d399",
                    scenario: isFacile ? "Tu as aidé ton ami." :
                        isDifficile ? "Tu as passé ta récréation à aider un camarade à comprendre un concept mathématique très complexe." :
                            "Tu as aidé un ami à comprendre un exercice difficile.",
                    challengeType: "choice",
                    word: isFacile ? "content(e)" : (isDifficile ? "valorisé(e)" : "fier/fière"),
                    isPositive: true,
                    choices: isFacile ? ["content(e)", "triste"] :
                        isDifficile ? ["valorisé(e)", "inutile", "méprisé(e)", "perplexe"] :
                            ["fier/fière", "inquiet(e)", "exclu(e)"]
                }
            ]
        },

        // ══════════════════════════════════════════════════════════════════════════
        // LEVEL 2 — La Cour
        // ══════════════════════════════════════════════════════════════════════════
        {
            id: 2, name: "Niveau 2 — La Cour", type: "schoolyard",
            playerStart: { x: 100, y: 420 },
            targetWord: isFacile ? "seul(e)" : (isDifficile ? "marginalisé(e)" : "exclu(e)"),
            levelSentence: "Je me sens ___ ici.",
            gate: { x: 820, y: 150, w: 20, h: 200 },
            exit: { x: 840, y: 180, w: 60, h: 140 },
            npcs: [
                {
                    id: 1, x: 200, y: 180, name: "Ines", color: "#f472b6",
                    scenario: isFacile ? "Personne ne veut jouer avec toi." :
                        isDifficile ? "Un groupe d'élèves forme un cercle fermé. Quand tu t'approches, ils se taisent et détournent le regard." :
                            "Un groupe d'élèves joue. Quand tu t'approches, ils te disent que le groupe est plein.",
                    challengeType: "emoji",
                    word: isFacile ? "seul(e)" : (isDifficile ? "marginalisé(e)" : "exclu(e)"),
                    isPositive: false,
                    emojiPairs: [
                        { situation: "Personne ne joue avec toi", emoji: "😔", matches: isFacile ? "seul(e)" : (isDifficile ? "marginalisé(e)" : "exclu(e)") },
                        { situation: "Tu as gagné le match", emoji: "😄", matches: isFacile ? "content(e)" : (isDifficile ? "triomphant(e)" : "fier/fière") },
                        { situation: "Tu attends et ça ne vient pas", emoji: "😤", matches: isFacile ? "fâché(e)" : (isDifficile ? "exaspéré(e)" : "frustré(e)") }
                    ]
                },
                {
                    id: 2, x: 500, y: 250, name: "Marcus", color: "#fbbf24",
                    scenario: isFacile ? "Tu as marqué un but !" :
                        isDifficile ? "Tu as marqué le but décisif à la dernière seconde, suscitant l'admiration de toute ton équipe." :
                            "Tu as marqué le but décisif pour ton équipe !",
                    challengeType: "emoji",
                    word: isFacile ? "content(e)" : (isDifficile ? "euphorique" : "fier/fière"),
                    isPositive: true,
                    emojiPairs: [
                        { situation: "Tu as marqué un but", emoji: "🏆", matches: isFacile ? "content(e)" : (isDifficile ? "euphorique" : "fier/fière") },
                        { situation: "Quelqu'un t'a bousculé", emoji: "😡", matches: isFacile ? "fâché(e)" : (isDifficile ? "indigné(e)" : "en colère") },
                        { situation: "Le match est annulé", emoji: "😞", matches: isFacile ? "triste" : (isDifficile ? "dépité(e)" : "déçu(e)") }
                    ]
                },
                {
                    id: 3, x: 740, y: 180, name: "Priya", color: "#a78bfa",
                    scenario: isFacile ? "Tu dois parler devant la classe demain." :
                        isDifficile ? "L'idée de présenter ton projet devant toute l'école te donne des sueurs froides et te noue l'estomac." :
                            "Tu dois faire une présentation devant toute la classe demain.",
                    challengeType: "emoji",
                    word: isFacile ? "peur" : (isDifficile ? "angoissé(e)" : "anxieux/euse"),
                    isPositive: false,
                    emojiPairs: [
                        { situation: "Une grosse présentation t'attend", emoji: "😰", matches: isFacile ? "peur" : (isDifficile ? "angoissé(e)" : "anxieux/euse") },
                        { situation: "Tu as fini ton travail", emoji: "😌", matches: isFacile ? "bien" : (isDifficile ? "apaisé(e)" : "calme") },
                        { situation: "Une surprise t'attend", emoji: "😲", matches: isFacile ? "surpris(e)" : (isDifficile ? "stupéfait(e)" : "choqué(e)") }
                    ]
                }
            ]
        },

        // ══════════════════════════════════════════════════════════════════════════
        // LEVEL 3 — La Forêt
        // ══════════════════════════════════════════════════════════════════════════
        {
            id: 3, name: "Niveau 3 — La Forêt", type: "forest",
            playerStart: { x: 80, y: 380 },
            targetWord: isFacile ? "peur" : (isDifficile ? "désorienté(e)" : "inquiet(e)"),
            levelSentence: isFacile ? "J'ai ___ ici." : "J'ai besoin d'aide, je suis ___.",
            gate: { x: 830, y: 120, w: 20, h: 260 },
            exit: { x: 850, y: 150, w: 50, h: 200 },
            npcs: [
                {
                    id: 1, x: 220, y: 200, name: "Kofi", color: "#fb923c",
                    scenario: isFacile ? "Tu es perdu." :
                        isDifficile ? "Tu t'es éloigné du sentier balisé et les ombres s'allongent. Tu as complètement perdu tes repères." :
                            "Tu es perdu dans la forêt. Tu ne sais plus où est ton groupe.",
                    challengeType: "wordorder",
                    word: isFacile ? "peur" : (isDifficile ? "désorienté(e)" : "inquiet(e)"),
                    isPositive: false,
                    wordTiles: isFacile ? ["J'ai", "très", "peur."] :
                        isDifficile ? ["Je", "me", "sens", "absolument", "désorienté(e)", "ici."] :
                            ["besoin", "J'ai", "d'aide,", "inquiet(e).", "je", "suis"],
                    correctOrder: isFacile ? ["J'ai", "très", "peur."] :
                        isDifficile ? ["Je", "me", "sens", "absolument", "désorienté(e)", "ici."] :
                            ["J'ai", "besoin", "d'aide,", "je", "suis", "inquiet(e)."]
                },
                {
                    id: 2, x: 490, y: 270, name: "Yuki", color: "#6ee7b7",
                    scenario: isFacile ? "Tu te reposes sous un arbre." :
                        isDifficile ? "Adossé(e) à un chêne centenaire, tu laisses le silence de la nature apaiser ton esprit tumultueux." :
                            "Tu es assis(e) au pied d'un grand arbre. Tu respires lentement. Tu te sens bien.",
                    challengeType: "wordorder",
                    word: isFacile ? "bien" : (isDifficile ? "serein(e)" : "calme"),
                    isPositive: true,
                    wordTiles: isFacile ? ["Je", "suis", "très", "bien."] :
                        isDifficile ? ["Je", "me", "sens", "profondément", "serein(e)."] :
                            ["Je", "me", "sens", "calme", "ici."],
                    correctOrder: isFacile ? ["Je", "suis", "très", "bien."] :
                        isDifficile ? ["Je", "me", "sens", "profondément", "serein(e)."] :
                            ["Je", "me", "sens", "calme", "ici."]
                },
                {
                    id: 3, x: 750, y: 200, name: "Lina", color: "#c084fc",
                    scenario: isFacile ? "Tu as retrouvé ton chemin." :
                        isDifficile ? "Après avoir analysé ta carte, tu as navigué avec succès hors de cette forêt dense." :
                            "Tu viens de trouver le chemin tout seul, après avoir cherché longtemps.",
                    challengeType: "wordorder",
                    word: isFacile ? "content(e)" : (isDifficile ? "fiers(e)" : "rassuré(e)"),
                    isPositive: true,
                    wordTiles: isFacile ? ["Je", "suis", "content(e)."] :
                        isDifficile ? ["Je", "suis", "fiers(e)", "de", "ma", "persévérance."] :
                            ["Je", "suis", "enfin", "rassuré(e)."],
                    correctOrder: isFacile ? ["Je", "suis", "content(e)."] :
                        isDifficile ? ["Je", "suis", "fiers(e)", "de", "ma", "persévérance."] :
                            ["Je", "suis", "enfin", "rassuré(e)."]
                }
            ]
        },

        // ══════════════════════════════════════════════════════════════════════════
        // LEVEL 4 — L'Espace
        // ══════════════════════════════════════════════════════════════════════════
        {
            id: 4, name: "Niveau 4 — L'Espace", type: "space",
            playerStart: { x: 80, y: 240 },
            targetWord: isFacile ? "courageux(se)" : (isDifficile ? "déterminé(e)" : "persévérant(e)"),
            levelSentence: "Je suis ___ mais je continue.",
            gate: { x: 840, y: 160, w: 20, h: 180 },
            exit: { x: 860, y: 180, w: 40, h: 140 },
            npcs: [
                {
                    id: 1, x: 200, y: 140, name: "Nova", color: "#fde68a",
                    scenario: isFacile ? "Tu as raté. Mais tu réessaies." :
                        isDifficile ? "Malgré un échec initial cuisant qui t'a fait douter, tu as analysé tes erreurs et refusé d'abandonner." :
                            "Tu as raté ton premier essai. Mais tu comprends maintenant comment ça marche.\nTu te lèves et tu réessaies.",
                    challengeType: "resilience",
                    word: isFacile ? "courageux(se)" : (isDifficile ? "déterminé(e)" : "persévérant(e)"),
                    isPositive: true,
                    choices: isFacile ? ["courageux(se)", "triste", "fâché(e)"] :
                        isDifficile ? ["déterminé(e)", "vaincu(e)", "désespéré(e)", "passif(ve)"] :
                            ["persévérant(e)", "triste", "inquiet(e)"]
                },
                {
                    id: 2, x: 480, y: 240, name: "Zara", color: "#818cf8",
                    scenario: isFacile ? "Tu as beaucoup de travail. Mais tu vas le faire." :
                        isDifficile ? "La quantité de tâches semble insurmontable, mais tu te concentres méthodiquement sur une étape à la fois." :
                            "Le travail est long et difficile. Mais tu ne baisses pas les bras.",
                    challengeType: "resilience",
                    word: isFacile ? "fort(e)" : (isDifficile ? "méthodique" : "concentré(e)"),
                    isPositive: true,
                    choices: isFacile ? ["fort(e)", "faible", "fatigué(e)"] :
                        isDifficile ? ["méthodique", "chaotique", "submergé(e)", "distrait(e)"] :
                            ["concentré(e)", "perdu(e)", "énervé(e)"]
                },
                {
                    id: 3, x: 740, y: 330, name: "Orion", color: "#67e8f9",
                    scenario: isFacile ? "Tu avais peur de l'obscurité. Mais tu as avancé." :
                        isDifficile ? "L'inconnu te terrorisait, mais tu as canalisé ton appréhension pour rester vigilant tout en progressant." :
                            "C'était difficile. Tu as eu peur. Mais tu as quand même réussi à avancer.",
                    challengeType: "resilience",
                    word: isFacile ? "brave" : (isDifficile ? "résilient(e)" : "fier/fière"),
                    isPositive: true,
                    choices: isFacile ? ["brave", "peureux", "triste"] :
                        isDifficile ? ["résilient(e)", "fragile", "paralysé(e)", "défaitiste"] :
                            ["fier/fière", "anxieux/euse", "lâche"]
                }
            ]
        }
    ];
}
