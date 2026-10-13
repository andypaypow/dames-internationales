/* ============================================================
 * IA — minimax alpha-bêta + quiescence + approfondissement
 * itératif avec budget temps (module pur).
 * ⚠️ Convention signes : + = favorable aux NOIRS, -999 = Blancs bloqués.
 * ============================================================ */
import { N, applyMove, playableMoves, allMoves, type Board, type Col, type Move, type Piece } from './regles';
import { EXOS, caseToRc, rcToCase } from './exercices';

/** Évaluation statique : matériel + progression + centre + dames dominantes. */
export function evalBoard(b: Board): number {
  let s = 0;
  let nb = 0, nw = 0;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const p = b[r][c]; if (!p) continue;
    if (p.col === 'b') nb++; else nw++;
    let v: number;
    if (p.k) {
      v = 42;
      // Dame : léger bonus au centre (contrôle des grandes diagonales)
      const dc = Math.abs(c - (N - 1) / 2), dr = Math.abs(r - (N - 1) / 2);
      v += (2 - (dc + dr)) * 0.6;
    } else {
      // Pion : progression vers la promotion + léger bonus centre-colonnes
      const adv = p.col === 'b' ? r : N - 1 - r;
      v = 10 + adv * adv * 0.06 + adv * 0.5;
      if (c >= 2 && c <= 7) v += 0.4;
      // Pions des ailes (colonnes 0/9) un peu moins souples
      if (c === 0 || c === N - 1) v -= 0.3;
    }
    s += p.col === 'b' ? v : -v;
  }
  // Bonus matériel relationnel : être ahead quand peu de pièces = plus décisif
  if (nb && nw) s += ((nb - nw) / (nb + nw)) * 8;
  return s;
}

/** Profondeur de quiescence max : prolonge la recherche tant qu'il y a des prises. */
const QUIESC_MAX = 8;

function search(b: Board, col: Col, depth: number, alpha: number, beta: number, q: number): number {
  const moves = playableMoves(b, col);
  if (!moves.length) return col === 'b' ? -999 : 999;
  // Quiescence : en fin de profondeur, si des prises existent, on continue la
  // recherche (sinon l'IA évalue en plein échange et joue « trop faible »).
  if (depth <= 0) {
    if (q <= 0 || !moves[0].path[0].cap) return evalBoard(b);
  }
  const opp: Col = col === 'b' ? 'w' : 'b';
  const nd = depth - 1;
  const nq = depth <= 0 ? q - 1 : q;
  if (col === 'b') {
    let best = -1e9;
    for (const m of moves) {
      best = Math.max(best, search(applyMove(b, m), opp, nd, alpha, beta, nq));
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  }
  let best = 1e9;
  for (const m of moves) {
    best = Math.min(best, search(applyMove(b, m), opp, nd, alpha, beta, nq));
    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}

/**
 * Meilleur coup pour les Noirs (l'IA joue toujours Noirs).
 * Approfondissement itératif avec budget temps (ms) : on relance la recherche
 * à profondeur croissante tant qu'il reste du temps ; l'ordre des coups
 * (tri par score précédent) améliore fortement les coupures α-β.
 * Ex-aequo au niveau final départagés au hasard (varieté des parties).
 */
/** Analyse complète pour la réflexion écrite : meilleur coup, score, alternatives, ligne prévue. */
export type AiAnalysis = {
  move: Move;
  score: number;                       // + = favorable aux Noirs (l'IA)
  alts: { m: Move; sc: number }[];     // coups triés par score décroissant
  line: Move[];                        // ligne prévue (mon coup + réponses attendues)
  oppCaps: Move[];                     // prises adverses possibles après mon coup
  pieces: [number, number];            // [pions Noirs, pions Blancs]
  book?: boolean;                      // coup tiré du livre des exercices validés
};

/* ---------- 📖 Livre : positions des exercices validés ----------
 * Chaque exercice validé (corrigé relu au moteur, cf. scripts/exo-theme.ts)
 * alimente une table exacte position → coup du corrigé. Quand l'IA reconnaît
 * une position connue (trait aux Noirs), elle y joue le coup « appris ». */
type BookMove = { from: [number, number]; path: { r: number; c: number }[] };
let book: Map<string, BookMove> | null = null;

function serBoard(b: Board): string {
  let s = '';
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const p = b[r][c];
    s += p ? (p.col === 'b' ? 'b' : 'w') : '.';
  }
  return s;
}

function buildBook(): Map<string, BookMove> {
  if (book) return book;
  book = new Map();
  for (const exo of EXOS) {
    try {
      const bd: Board = Array.from({ length: N }, () => Array<Piece | null>(N).fill(null));
      for (const n of exo.b) { const [r, c] = caseToRc(n); bd[r][c] = { col: 'b', k: false }; }
      for (const n of exo.w) { const [r, c] = caseToRc(n); bd[r][c] = { col: 'w', k: false }; }
      for (const n of exo.bd ?? []) { const [r, c] = caseToRc(n); bd[r][c] = { col: 'b', k: true }; }
      for (const n of exo.wd ?? []) { const [r, c] = caseToRc(n); bd[r][c] = { col: 'w', k: true }; }
      let cur = bd;
      let turn: Col = exo.trait ?? 'w';
      for (const p of exo.paths) {
        const mv = (playableMoves(cur, turn) as Move[]).find(m => {
          const q = [rcToCase(m.from[0], m.from[1]), ...m.path.map(s => rcToCase(s.r, s.c))];
          return q[0] === p[0] && q.length === p.length && q.every((n, i) => n === p[i]);
        });
        if (!mv) break;
        const key = serBoard(cur) + '|' + turn;
        if (!book!.has(key)) {
          book!.set(key, { from: [mv.from[0], mv.from[1]], path: mv.path.map(s => ({ r: s.r, c: s.c })) });
        }
        cur = applyMove(cur, mv);
        turn = turn === 'w' ? 'b' : 'w';
      }
    } catch { /* exercice illégal : ignoré */ }
  }
  return book;
}

/** Ligne prévue : chaque côté joue son meilleur coup (profondeur réduite). */
function pvLine(b: Board, plies: number): Move[] {
  const line: Move[] = [];
  let cur = b;
  for (let i = 0; i < plies; i++) {
    const col: Col = i % 2 === 0 ? 'b' : 'w';
    const moves = playableMoves(cur, col);
    if (!moves.length) break;
    // meilleur coup pour `col` : + = Noirs → minimiser pour les Blancs
    let bestM = moves[0];
    let bestS = col === 'b' ? -1e9 : 1e9;
    for (const m of moves) {
      const sc = search(applyMove(cur, m), col === 'b' ? 'w' : 'b', 3, -1e9, 1e9, 4);
      if (col === 'b' ? sc > bestS : sc < bestS) { bestS = sc; bestM = m; }
    }
    line.push(bestM);
    cur = applyMove(cur, bestM);
  }
  return line;
}

/** Choisit le coup ET retourne l'analyse rédigable (mêmes calculs, zéro coût ajouté). */
export function aiAnalyse(b: Board, depth: number, budgetMs = 1500): AiAnalysis | null {
  const moves = playableMoves(b, 'b');
  if (!moves.length) return null;
  // 📖 Livre : position d'un exercice validé (ou d'une de ses suites) → coup appris
  if (depth > 0) {
    const bm = buildBook().get(serBoard(b) + '|b');
    if (bm) {
      const mv = moves.find(m => m.from[0] === bm.from[0] && m.from[1] === bm.from[1]
        && m.path.length === bm.path.length && m.path.every((s, i) => s.r === bm.path[i].r && s.c === bm.path[i].c));
      if (mv) {
        const after = applyMove(b, mv);
        return {
          move: mv,
          score: search(after, 'w', Math.max(4, Math.min(depth, 8)), -1e9, 1e9, QUIESC_MAX),
          alts: [], line: pvLine(after, 5),
          oppCaps: playableMoves(after, 'w').filter(x => x.path[0].cap != null),
          pieces: countPieces(b), book: true,
        };
      }
    }
  }
  if (depth <= 0) {
    // Facile : coup aléatoire — la réflexion reste honnête mais minimale
    const m = moves[Math.floor(Math.random() * moves.length)];
    return {
      move: m, score: evalBoard(b), alts: moves.map(m => ({ m, sc: 0 })),
      line: [m], oppCaps: playableMoves(applyMove(b, m), 'w').filter(x => x.path[0].cap != null),
      pieces: countPieces(b),
    };
  }
  const t0 = Date.now();
  let best: { m: Move; sc: number }[] = moves.map(m => ({ m, sc: 0 }));
  for (let d = 1; d <= depth; d++) {
    let alpha = -1e9;
    const scored: { m: Move; sc: number }[] = [];
    let timeout = false;
    for (const { m } of best) {   // ordre itération précédente = meilleures coupures
      const sc = search(applyMove(b, m), 'w', d, alpha, 1e9, QUIESC_MAX);
      if (Date.now() - t0 > budgetMs && d > 1) { timeout = true; break; }
      scored.push({ m, sc });
      alpha = Math.max(alpha, sc);
    }
    if (timeout || !scored.length) break;
    scored.sort((a, z) => z.sc - a.sc);
    best = scored;
    if (Math.abs(best[0].sc) >= 999) break;   // gain forcé trouvé : inutile d'aller plus loin
  }
  const bestSc = best[0].sc;
  const top = best.filter(x => x.sc === bestSc);
  const move = top[Math.floor(Math.random() * top.length)].m;
  const after = applyMove(b, move);
  return {
    move,
    score: bestSc,
    alts: best,
    line: pvLine(after, 5),
    oppCaps: playableMoves(after, 'w').filter(x => x.path[0].cap != null),
    pieces: countPieces(b),
  };
}

function countPieces(b: Board): [number, number] {
  let nb = 0, nw = 0;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const p = b[r][c]; if (p) { if (p.col === 'b') nb++; else nw++; }
  }
  return [nb, nw];
}

/** Utilitaire exporté : nombre de coups légaux (pour tests éventuels). */
export function moveCount(b: Board, col: Col): number {
  return allMoves(b, col).captures.length + allMoves(b, col).quiet.length;
}
