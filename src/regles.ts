/* ============================================================
 * Règles du jeu de dames internationales (10×10, FID)
 * Module pur (aucun DOM) — testable indépendamment.
 * Convention moteur (héritée de v1) :
 *   'b' = Noirs (commencent, "montent" vers r=9)
 *   'w' = Blancs ("montent" vers r=0)
 *   evalBoard > 0 favorable aux Noirs (voir ia.ts)
 * ============================================================ */

export type Col = 'b' | 'w';
export interface Piece { col: Col; k: boolean }
export type Square = Piece | null;
export type Board = Square[][];
export interface Pt { r: number; c: number }
export interface Step extends Pt { cap: Pt | null }
/** Un coup : case de départ, chemin (1+ étapes), plateau résultant (captures uniquement). */
export interface Move { from: [number, number]; path: Step[]; board: Board | null }

export const N = 10;
const DIRS: ReadonlyArray<readonly [number, number]> = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

export const inside = (r: number, c: number): boolean => r >= 0 && r < N && c >= 0 && c < N;

export function clone(b: Board): Board {
  return b.map(row => row.map(p => (p ? { ...p } : null)));
}

/** Position initiale : Noirs rangées 0-3, Blancs rangées 6-9, cases (r+c) pair (coin haut-gauche foncé, case 1). */
export function initBoard(): Board {
  const b: Board = Array.from({ length: N }, () => Array<Square>(N).fill(null));
  for (let r = 0; r < 4; r++) for (let c = 0; c < N; c++) if ((r + c) % 2) b[r][c] = { col: 'b', k: false };
  for (let r = 6; r < N; r++) for (let c = 0; c < N; c++) if ((r + c) % 2) b[r][c] = { col: 'w', k: false };
  return b;
}

/** Séquence brute produite par capturesFrom (le `from` d'origine est ajouté par allMoves). */
export interface Seq { path: Step[]; board: Board }

/**
 * Toutes les séquences de captures maximales depuis (r,c).
 * Un chemin est "maximal" quand aucune continuation n'est possible ;
 * allMoves filtre ensuite à la longueur max (prise majoritaire).
 */
export function capturesFrom(b: Board, r: number, c: number, piece: Piece, seq: Step[]): Seq[] {
  const out: Seq[] = [];
  const seen = seq.map(s => s.cap);
  if (!piece.k) {
    for (const [dr, dc] of DIRS) {
      const mr = r + dr, mc = c + dc, lr = r + 2 * dr, lc = c + 2 * dc;
      if (!inside(lr, lc)) continue;
      const mid = b[mr][mc];
      if (mid && mid.col !== piece.col && !seen.some(s => s!.r === mr && s!.c === mc) && !b[lr][lc]) {
        const nb = clone(b); nb[lr][lc] = nb[r][c]; nb[r][c] = null; nb[mr][mc] = null;
        const nseq: Step[] = [...seq, { r: lr, c: lc, cap: { r: mr, c: mc } }];
        const more = capturesFrom(nb, lr, lc, piece, nseq);
        if (more.length) out.push(...more);
        else out.push({ path: nseq, board: nb });
      }
    }
  } else {
    for (const [dr, dc] of DIRS) {
      let i = 1;
      while (inside(r + dr * i, c + dc * i) && !b[r + dr * i][c + dc * i]) i++;
      if (!inside(r + dr * i, c + dc * i)) continue;
      const mid = b[r + dr * i][c + dc * i]!;
      if (mid.col !== piece.col && !seen.some(s => s!.r === r + dr * i && s!.c === c + dc * i)) {
        let j = i + 1;
        while (inside(r + dr * j, c + dc * j) && !b[r + dr * j][c + dc * j]) {
          const lr2 = r + dr * j, lc2 = c + dc * j;
          const nb = clone(b); nb[lr2][lc2] = nb[r][c]; nb[r][c] = null; nb[r + dr * i][c + dc * i] = null;
          const nseq: Step[] = [...seq, { r: lr2, c: lc2, cap: { r: r + dr * i, c: c + dc * i } }];
          const more = capturesFrom(nb, lr2, lc2, piece, nseq);
          if (more.length) out.push(...more);
          else out.push({ path: nseq, board: nb });
          j++;
        }
      }
    }
  }
  return out;
}

/** Tous les coups légaux de `col`. Si des captures existent, seules les majoritaires sont renvoyées. */
export function allMoves(b: Board, col: Col): { captures: Move[]; quiet: Move[] } {
  const caps: Move[] = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const p = b[r][c];
    if (p && p.col === col) caps.push(...capturesFrom(b, r, c, p, []).map(m => ({ ...m, from: [r, c] as [number, number] })));
  }
  if (caps.length) {
    const max = Math.max(...caps.map(m => m.path.length));
    return { captures: caps.filter(m => m.path.length === max), quiet: [] };
  }
  const quiet: Move[] = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const p = b[r][c]; if (!p || p.col !== col) continue;
    if (!p.k) {
      const dr = p.col === 'b' ? 1 : -1;
      for (const dc of [1, -1])
        if (inside(r + dr, c + dc) && !b[r + dr][c + dc])
          quiet.push({ from: [r, c], path: [{ r: r + dr, c: c + dc, cap: null }], board: null });
    } else {
      for (const [dr, dc] of DIRS) {
        let i = 1;
        while (inside(r + dr * i, c + dc * i) && !b[r + dr * i][c + dc * i]) {
          quiet.push({ from: [r, c], path: [{ r: r + dr * i, c: c + dc * i, cap: null }], board: null }); i++;
        }
      }
    }
  }
  return { captures: [], quiet };
}

/** Applique un coup : retire les pièces capturées, déplace, promotion si arrêt sur dernière rangée. */
export function applyMove(b: Board, move: Move): Board {
  const nb = move.board ? clone(move.board) : clone(b);
  const end = move.path[move.path.length - 1];
  // ⚠️ Fix bug latent (hérité de v1) : après une capture, move.board a déjà la pièce
  // à l'arrivée et NULL au départ → il faut la relire à l'arrivée, sinon {...null} = {}
  // (pièce "fantôme" sans col/k). Pour un coup calme, la pièce est encore au départ.
  const piece: Piece = { ...(nb[end.r][end.c] ?? nb[move.from[0]][move.from[1]])! };
  nb[move.from[0]][move.from[1]] = null;
  for (const s of move.path) if (s.cap) nb[s.cap.r][s.cap.c] = null;
  nb[end.r][end.c] = piece;
  if (!piece.k && ((piece.col === 'b' && end.r === N - 1) || (piece.col === 'w' && end.r === 0))) piece.k = true;
  return nb;
}

/** Coups jouables (captures majoritaires si capture possible, sinon déplacements). */
export function playableMoves(b: Board, col: Col): Move[] {
  const { captures, quiet } = allMoves(b, col);
  return captures.length ? captures : quiet;
}
