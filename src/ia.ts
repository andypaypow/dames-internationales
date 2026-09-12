/* ============================================================
 * IA — minimax alpha-bêta (module pur).
 * ⚠️ Convention signes : + = favorable aux NOIRS, -999 = Blancs bloqués.
 * ============================================================ */
import { N, applyMove, playableMoves, type Board, type Col, type Move } from './regles';

export function evalBoard(b: Board): number {
  let s = 0;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const p = b[r][c]; if (!p) continue;
    const v = p.k ? 30 : 10 + (p.col === 'b' ? r : N - 1 - r) * 0.5;
    s += p.col === 'b' ? v : -v;
  }
  return s;
}

export function search(b: Board, col: Col, depth: number, alpha: number, beta: number): number {
  const moves = playableMoves(b, col);
  if (!moves.length) return col === 'b' ? -999 : 999;
  if (depth <= 0) return evalBoard(b);
  const opp: Col = col === 'w' ? 'b' : 'w';
  if (col === 'b') {
    let best = -1e9;
    for (const m of moves) {
      best = Math.max(best, search(applyMove(b, m), opp, depth - 1, alpha, beta));
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  }
  let best = 1e9;
  for (const m of moves) {
    best = Math.min(best, search(applyMove(b, m), opp, depth - 1, alpha, beta));
    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}

/** Meilleur coup pour les Noirs (l'IA joue toujours Noirs). Ex-aequo départagés au hasard. */
export function pickAiMove(b: Board, depth: number): Move | null {
  const moves = playableMoves(b, 'b');
  if (!moves.length) return null;
  let best = -1e9;
  let bestMoves: Move[] = [];
  for (const m of moves) {
    const sc = search(applyMove(b, m), 'w', depth, -1e9, 1e9);
    if (sc > best) { best = sc; bestMoves = [m]; }
    else if (sc === best) bestMoves.push(m);
  }
  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}
