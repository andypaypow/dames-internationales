import { EXOS_THEMES } from './exos-gen';
/* ============================================================
 * Exercices « Coups de Dame » — Cours de jeu, 3ᵉ partie, ch. 21
 * Source : jeudedames.toulouse.free.fr (PDF 24775), transcrit puis
 * VALIDÉ au moteur (règles FID, prise majoritaire) : chaque solution
 * se rejoue légalement et se termine par une dame blanche.
 * Convention cases 1-50 : Noirs 1-20 (haut), Blancs 31-50 (bas),
 * case 1 = case foncée en haut à gauche.
 * `paths` = solution demi-coup par demi-coup ; une rafle est la liste
 * COMPLÈTE de ses cases d'arrivée (le chemin exact est imposé car les
 * variantes de rafle ne gardent pas toutes le gain).
 * ============================================================ */
export interface Exo {
  id: string; cat: string; goal: 'dame' | 'mat' | 'gain';
  /** camp au trait au départ ('w' par défaut). */
  trait?: 'b' | 'w';
  b: number[]; w: number[]; paths: number[][]; solTxt: string; note?: string;
  /** dames au départ (optionnel) : bd = dames noires, wd = dames blanches. */
  bd?: number[]; wd?: number[];
}

/** case 1-50 → (r,c), r=0 en haut. Foncée : (r+c) pair — case 1 = 1ʳᵉ foncée de la rangée (coin haut-gauche clair, cas 46 foncée). */
export function caseToRc(n: number): [number, number] {
  const r = Math.floor((n - 1) / 5);
  const k = (n - 1) % 5;
  const cols = [0,1,2,3,4,5,6,7,8,9].filter(c => (r + c) % 2 === 1);
  return [r, cols[k]];
}

/** (r,c) → case 1-50 (inverse de caseToRc). */
export function rcToCase(r: number, c: number): number {
  const cols = [0,1,2,3,4,5,6,7,8,9].filter(x => (r + x) % 2 === 1);
  return r * 5 + cols.indexOf(c) + 1;
}

const EXOS_DAME: Exo[] = [
  { id: '21.1', cat: '🎓 Coups de Dame', goal: 'dame', b: [2, 3, 8, 9, 12, 14, 16, 17, 18, 19, 23, 24], w: [27, 30, 32, 33, 35, 36, 37, 38, 39, 43, 47, 48],
    paths: [[27, 21],[16, 27],[32, 21],[17, 26],[37, 31],[26, 37],[38, 32],[37, 28],[33, 22, 13, 4]],
    solTxt: "27-21 16x27 32x21 17x26 37-31 26x37 38-32 37x28 33x4" },
  { id: '21.2', cat: '🎓 Coups de Dame', goal: 'dame', b: [2, 3, 4, 6, 7, 8, 9, 10, 12, 13, 15, 16, 17, 19, 23, 24, 26], w: [27, 33, 34, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49],
    paths: [[34, 30],[24, 35],[33, 29],[23, 34],[39, 30],[35, 24],[27, 22],[17, 28],[37, 31],[26, 37],[41, 32, 23, 14, 5]],
    solTxt: "34-30 24x35 33-29 23x34 39x30 35x24 27-22 17x28 37-31 26x37 41x5" },
  { id: '21.3', cat: '🎓 Coups de Dame', goal: 'dame', b: [2, 3, 6, 7, 8, 9, 12, 13, 14, 15, 16, 17, 18, 19, 21, 23, 24], w: [26, 27, 28, 30, 32, 33, 34, 35, 37, 38, 39, 41, 42, 43, 48, 49, 50],
    paths: [[34, 29],[23, 34, 25],[28, 22],[17, 28],[26, 17],[12, 21],[32, 23, 12, 1]],
    solTxt: "34-29 23x25 28-22 17x28 26x17 12x21 32x1" },
  { id: '21.4', cat: '🎓 Coups de Dame', goal: 'dame', b: [1, 4, 8, 10, 12, 13, 15, 16, 17, 18, 20, 25, 26], w: [28, 29, 32, 33, 34, 36, 37, 39, 43, 45, 47, 48, 49],
    paths: [[34, 30],[25, 34, 23],[28, 19],[13, 24],[37, 31],[26, 37, 28],[33, 22, 13, 2]],
    solTxt: "34-30 25x23 28x19 13x24 37-31 26x28 33x2" },
  { id: '21.5', cat: '🎓 Coups de Dame', goal: 'dame', b: [2, 3, 6, 8, 10, 11, 12, 13, 15, 16, 17, 18, 20, 25, 26], w: [24, 27, 28, 29, 32, 33, 34, 36, 38, 39, 41, 43, 45, 46, 48],
    paths: [[36, 31],[26, 37],[24, 19],[13, 24],[34, 30],[25, 34, 23],[28, 19, 30],[37, 28],[33, 22, 13],[8, 19],[30, 24],[20, 29],[27, 22],[17, 28],[39, 33],[28, 39],[43, 34, 23, 14, 5]],
    solTxt: "36-31 26x37 24-19 13x24 34-30 25x23 28x30 37x28 33x13 8x19 30-24 20x29 27-22 17x28 39-33 28x39 43x32x23x14x5",
   note: "Enchaînement de fin reconstitué au moteur (l'ordre du PDF après 33x13 est mélangé)." },
  { id: '21.6', cat: '🎓 Coups de Dame', goal: 'dame', b: [3, 4, 6, 8, 11, 12, 13, 15, 16, 18, 19, 20, 23, 26], w: [27, 28, 30, 32, 33, 35, 37, 38, 39, 42, 45, 47, 48, 49],
    paths: [[30, 24],[20, 29],[33, 24],[19, 30],[28, 19],[13, 24],[37, 31],[26, 37, 28],[27, 21],[16, 27],[38, 32],[27, 38],[42, 33, 22, 13, 2]],
    solTxt: "30-24 20x29 33x24 19x30 28x19 13x24 37-31 26x28 27-21 16x27 38-32 27x38 42x2" },
  { id: '21.7', cat: '🎓 Coups de Dame', goal: 'dame', b: [2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 19, 20, 22, 26], w: [25, 27, 29, 31, 32, 35, 36, 38, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50],
    paths: [[27, 21],[26, 37, 28],[21, 17],[12, 21],[29, 24],[19, 30],[35, 24],[20, 29],[38, 33],[28, 39],[43, 34, 23, 12, 1]],
    solTxt: "27-21 26x28 21-17 12x21 29-24 19x30 35x24 20x29 38-33 28x39 43x1" },
  { id: '21.8', cat: '🎓 Coups de Dame', goal: 'dame', b: [2, 7, 8, 10, 11, 12, 13, 15, 17, 18, 19, 22, 23, 27, 28], w: [25, 26, 31, 33, 34, 36, 38, 39, 41, 43, 45, 46, 47, 48, 49],
    paths: [[25, 20],[15, 24],[34, 30],[24, 35],[33, 29],[23, 34],[39, 30],[35, 24],[26, 21],[17, 26, 37],[41, 32, 23, 14, 5]],
    solTxt: "25-20 15x24 34-30 24x35 33-29 23x34 39x30 35x24 26-21 17x37 41x5" },
  { id: '21.9', cat: '🎓 Coups de Dame', goal: 'dame', b: [2, 3, 4, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 22, 23], w: [26, 29, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 43, 44, 45, 46, 47, 48, 49],
    paths: [[26, 21],[17, 26],[32, 28],[23, 32],[37, 28, 17],[11, 22],[29, 24],[19, 30],[35, 24],[20, 29],[34, 23, 12, 1]],
    solTxt: "26-21 17x26 32-28 23x32 37x17 11x22 29-24 19x30 35x24 20x29 34x1" },
  { id: '21.10', cat: '🎓 Coups de Dame', goal: 'dame', b: [1, 9, 13, 15, 17, 18, 22, 25, 28], w: [24, 26, 29, 33, 37, 39, 40, 43, 45],
    paths: [[29, 23],[18, 29, 38, 49],[37, 32],[49, 35, 19],[32, 23, 14, 3]],
    solTxt: "29-23 18x49 37-32 49x19 32x3" },
  { id: '21.11', cat: '🎓 Coups de Dame', goal: 'dame', b: [2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 14, 16, 17, 18, 19, 22, 25, 35], w: [27, 28, 31, 32, 33, 34, 36, 37, 38, 39, 40, 42, 43, 44, 45, 48, 49, 50],
    paths: [[33, 29],[22, 33, 24],[34, 30],[25, 34],[40, 29, 20],[14, 25],[27, 22],[18, 27],[31, 22],[17, 28],[32, 23, 14, 5]],
    solTxt: "33-29 22x24 34-30 25x34 40x20 14x25 27-22 18x27 31x22 17x28 32x5" },
  { id: '21.12', cat: '🎓 Coups de Dame', goal: 'dame', b: [2, 3, 4, 6, 8, 9, 10, 12, 13, 15, 16, 18, 19, 20, 24, 26], w: [27, 28, 29, 31, 32, 33, 35, 36, 37, 38, 39, 42, 43, 45, 48, 49],
    paths: [[27, 21],[16, 27],[32, 21],[26, 17],[29, 23],[18, 29],[35, 30],[24, 35],[33, 24],[20, 29],[28, 22],[17, 28],[38, 33],[29, 38, 47],[45, 40],[35, 44, 33],[48, 42],[47, 38],[43, 32, 23, 14, 5]],
    solTxt: "27-21 16x27 32x21 26x17 29-23 18x29 35-30 24x35 33x24 20x29 28-22 17x28 38-33 29x38x47 45-40 35x44x33 48-42 47x38 43x32x23x14x5",
   note: "Après 33x24 les Noirs reprendrent ; la suite (38-33! … 43x5) a été recalculée au moteur. Variante noire : 19x30 au lieu de 20x29." },
  { id: '21.14', cat: '🎓 Coups de Dame', goal: 'dame', b: [3, 6, 9, 10, 11, 12, 13, 18, 19, 20, 23, 24], w: [22, 26, 27, 32, 33, 34, 35, 38, 39, 43, 45, 49],
    paths: [[32, 28],[23, 32, 21],[26, 17, 8],[3, 12],[45, 40],[18, 27],[38, 32],[27, 38, 29],[34, 23, 14, 5]],
    solTxt: "32-28 23x21 26x8 3x12 45-40 18x27 38-32 27x29 34x5",
   note: "⚠️ Diagramme étiqueté « C 21.13 » dans le PDF source : c'est bien la position résolue par la solution 21.14 (validée au moteur). Le vrai diagramme C 21.13 manque au PDF (doublon du 21.12) ; il n'est pas reproduit ici." },
  { id: '21.15', cat: '🎓 Coups de Dame', goal: 'dame', b: [2, 3, 6, 9, 10, 11, 12, 13, 14, 16, 18, 19, 20, 23], w: [27, 30, 32, 33, 35, 36, 38, 39, 42, 43, 47, 48, 49, 50],
    paths: [[27, 22],[18, 27],[32, 21],[16, 27],[38, 32],[27, 38, 29],[30, 24],[19, 30],[35, 24, 15, 4]],
    solTxt: "27-22 18x27 32x21 16x27 38-32 27x29 30-24 19x30 35x4" },
  { id: '21.16', cat: '🎓 Coups de Dame', goal: 'dame', b: [1, 9, 11, 12, 13, 15, 17, 19, 23, 24, 25], w: [26, 27, 28, 32, 33, 34, 36, 39, 40, 42, 44],
    paths: [[28, 22],[17, 28, 37, 48],[33, 29],[24, 33],[39, 28],[23, 32, 21],[26, 17, 8],[13, 2],[40, 35],[48, 30],[35, 24, 13, 4]],
    solTxt: "28-22 17x48 33-29 24x33 39x28 23x21 26x8 13x2 40-35 48x30 35x4" },
];

/* ============================================================
 * Exercices « Mat de l'adversaire » — Cours de jeu, ch. 24 (p.20-25)
 * Même PDF (24775) : bloquer l'adversaire jusqu'à ne plus lui laisser
 * aucun bon coup. Solutions du chapitre « Solution 24 » (p.67),
 * transcrites puis VALIDÉES au moteur (rejeu légal complet).
 * ============================================================ */
const MATEXOS: Exo[] = [
  { id: '24.1', cat: '🔒 Mat de l\'adversaire', goal: 'mat',
    b: [8, 12, 13, 15, 18, 19, 23, 26, 29], w: [25, 27, 28, 32, 35, 37, 38, 40, 45],
    paths: [[25, 20],[15, 24],[28, 22]],
    solTxt: "25-20 15x24 28-22 +" },
  { id: '24.2', cat: '🔒 Mat de l\'adversaire', goal: 'mat',
    b: [13, 14, 16, 17, 18, 19, 23, 24, 29], w: [25, 26, 27, 30, 32, 33, 35, 37, 38],
    paths: [[26, 21],[17, 26],[33, 28]],
    solTxt: "26-21 17x26 33-28 +" },
  { id: '24.3', cat: '🔒 Mat de l\'adversaire', goal: 'mat',
    b: [13, 14, 16, 17, 18, 19, 23, 24, 26], w: [25, 27, 28, 32, 35, 37, 38, 40, 48],
    paths: [[48, 42],[24, 29],[40, 34],[29, 40],[35, 44],[17, 21],[38, 33]],
    solTxt: "48-42 24-29 40-34 29x40 35x44 17-21 38-33 +",
    note: "48-43? permet le gambit Dussaut (16-21 27x16 18-22 38-33 22-27 =)." },
  { id: '24.4', cat: '🔒 Mat de l\'adversaire', goal: 'mat',
    b: [13, 14, 16, 17, 18, 19, 23, 26], w: [25, 27, 28, 32, 37, 38, 39, 44],
    paths: [[38, 33],[17, 21],[25, 20],[14, 25],[39, 34]],
    solTxt: "38-33 17-21 25-20 14x25 39-34 N+",
    note: "Le trait doit éviter 18-22 (27x20 21-27)." },
  { id: '24.5', cat: '🔒 Mat de l\'adversaire', goal: 'mat',
    b: [8, 12, 13, 14, 15, 16, 17, 18, 19, 23, 24], w: [25, 26, 27, 28, 32, 33, 36, 38, 39, 40, 44],
    paths: [[36, 31],[23, 29],[40, 35]],
    solTxt: "36-31! 23-29 40-35 (ou 18-23 35-30) +" },
  { id: '24.6', cat: '🔒 Mat de l\'adversaire', goal: 'mat',
    b: [11, 13, 14, 16, 18, 19, 21, 23, 24, 25, 26], w: [22, 27, 28, 30, 32, 33, 34, 35, 37, 38, 42],
    paths: [[33, 29],[24, 33],[38, 29],[14, 20],[42, 38],[20, 24],[29, 20],[25, 14],[30, 25]],
    solTxt: "33-29 24x33 38x29 14-20 42-38 20-24 29x20 25x14 30-25! +",
    note: "38-33? à la place de 30-25 laisse l'égalisation par 26-31." },
  { id: '24.7', cat: '🔒 Mat de l\'adversaire', goal: 'mat',
    b: [13, 16, 17, 18, 19, 23], w: [26, 27, 28, 32, 34, 41],
    paths: [[26, 21],[17, 26],[41, 37]],
    solTxt: "26-21 17x26 41-37 +" },
  { id: '24.8', cat: '🔒 Mat de l\'adversaire', goal: 'mat',
    b: [9, 11, 13, 16, 18, 19, 23, 24, 26], w: [25, 27, 28, 32, 33, 35, 37, 38, 39],
    paths: [[25, 20],[24, 15],[35, 30],[23, 29],[33, 24],[9, 14],[38, 33],[14, 20],[33, 29],[20, 25],[39, 34]],
    solTxt: "25-20 24x15 35-30 23-29 33x24 9-14 38-33 14-20 33-29 20-25 39-34 +" },
];

/* ============================================================
 * Exercices « Marchand de bois » + « Enchaînements de l'aile droite »
 * Source : M. Grégoire / F. Pesente, « Les enchaînements » (FFJD),
 * http://ffjd.fr/fichiers/livres/Les_enchainements.pdf — diagrammes
 * transcrits visuellement (pdftoppm), positions de débuts reconstruites
 * coup par coup, puis TOUT validé au moteur (rejeu légal FID,
 * prise majoritaire : le chemin exact du .valide est retenu).
 * goal 'gain' = combinaison / manœuvre gagnante (pas forcément dame).
 * ============================================================ */
const EXOS_MARCHAND: Exo[] = [
  { id: 'M.8', cat: '🪵 Marchand de bois', goal: 'gain', trait: 'w',
    b: [11, 12, 13, 16, 17, 18, 22], w: [26, 31, 32, 36, 39, 44, 48],
    paths: [[32, 27], [13, 19]],
    solTxt: "32-27! 13-19",
    note: "Prise du marchand de bois : 4 pions blancs (26,27,31,36) immobilisent 6 pions noirs — les Noirs n'ont plus que 13-19." },
  { id: 'M.9', cat: '🪵 Marchand de bois', goal: 'gain', trait: 'w',
    b: [11, 12, 13, 16, 17, 18, 22], w: [26, 31, 32, 33, 36, 44, 48],
    paths: [[32, 27], [13, 19], [27, 21], [16, 27], [33, 28], [22, 33], [31, 22, 13, 24]],
    solTxt: "32-27! (13-19)? 27-21 16x27 33-28 22x33 31x22x13x24",
    note: "Coup de mazette : avec le pion 33, (13-19)? perd du matériel par le ricochet classique." },
  { id: 'M.13', cat: '🪵 Marchand de bois', goal: 'gain', trait: 'w',
    b: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 20, 22, 23],
    w: [26, 31, 32, 33, 34, 35, 36, 38, 39, 40, 42, 43, 44, 45, 46, 47, 48, 49, 50],
    paths: [[32, 28], [23, 32], [38, 27]],
    solTxt: "32-28! (23x32) 38x27",
    note: "Pionnage : les Blancs prennent le marchand de bois en éliminant d'abord le pion central 23." },
  { id: 'M.15', cat: '🪵 Marchand de bois', goal: 'gain', trait: 'w',
    b: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 16, 18, 20, 21, 24, 25],
    w: [29, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 45, 46, 47, 48, 49, 50],
    paths: [[34, 30], [25, 34, 23], [31, 27], [21, 26], [37, 31]],
    solTxt: "34-30! 25x34x23 31-27 21-26 37-31",
    note: "Dégagement (1) : après l'échange 28x17 (12x21), 34-30! brise le marchand de bois (prise majoritaire 25x34x23)." },
  { id: 'M.15b', cat: '🪵 Marchand de bois', goal: 'gain', trait: 'w',
    b: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 25],
    w: [29, 31, 32, 33, 34, 35, 36, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49],
    paths: [[34, 30], [25, 34, 23], [33, 28], [22, 33], [39, 28, 19, 30]],
    solTxt: "34-30! 25x34x23 33-28 22x33 39x28x19x30",
    note: "Dégagement (2) : variante (11x22) — le trois-pour-trois 34-30! … 39x28x19x30 rend le jeu libre." },
  { id: 'M.17', cat: '🪵 Marchand de bois', goal: 'gain', trait: 'w',
    b: [3, 7, 12, 13, 14, 15, 16, 17, 18, 20, 22, 24, 25],
    w: [26, 27, 28, 29, 31, 32, 33, 34, 36, 37, 38, 39, 43, 44, 46, 49],
    paths: [[28, 23], [14, 19], [23, 14], [20, 9], [29, 20], [25, 14]],
    solTxt: "28-23! 14-19 23x14 20x9 29x20 25x14",
    note: "Sortie subtile : 28-23! (menace 34-30) oblige les Noirs à détruire eux-mêmes leur marchand de bois." },
];

const EXOS_AILE: Exo[] = [
  { id: 'A.97', cat: '➡️ Enchaînements aile droite', goal: 'gain', trait: 'w',
    b: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22],
    w: [28, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 47, 48, 49, 50],
    paths: [[32, 27], [19, 23], [28, 19], [14, 23]],
    solTxt: "32-27! (19-23) 28x19 14x23",
    note: "Enchaînement du centre droit : 32-27 prend 16,17,18 en tenailles ; les Noirs ne se dégagent que par l'échange." },
  { id: 'A.98', cat: '➡️ Enchaînements aile droite', goal: 'gain', trait: 'b',
    b: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 24],
    w: [29, 31, 32, 33, 34, 35, 36, 37, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50],
    paths: [[19, 23]],
    solTxt: "19-23!",
    note: "Au tour des Noirs : 19-23! prend l'enchaînement à leur compte — 35-30, 34-30, 33-28 et 32-28 interdits." },
  { id: 'A.100', cat: '➡️ Enchaînements aile droite', goal: 'gain', trait: 'b',
    b: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18, 19, 20, 25],
    w: [30, 31, 32, 33, 34, 35, 36, 37, 38, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50],
    paths: [[20, 24]],
    solTxt: "20-24!",
    note: "Enchaînement de l'aile droite : 20-24! immobilise 30,34,35,40,45 (34-29? tombe sur une prise)." },
  { id: 'A.101', cat: '➡️ Enchaînements aile droite', goal: 'gain', trait: 'w',
    b: [1, 2, 3, 4, 5, 6, 8, 10, 11, 12, 13, 15, 16, 17, 18, 20, 21, 23],
    w: [26, 31, 32, 34, 35, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50],
    paths: [[31, 27]],
    solTxt: "31-27!",
    note: "Après le double échange, 31-27! immobilise l'aile droite noire (17-22 et 18-22 interdits)." },
];

export const EXOS: Exo[] = [...EXOS_DAME, ...MATEXOS, ...EXOS_MARCHAND, ...EXOS_AILE, ...EXOS_THEMES];
