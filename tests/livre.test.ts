/* ============================================================
 * 📖 Livre des exercices validés : l'IA doit reconnaître une
 * position issue d'un exercice (ou d'une de ses suites) et y
 * jouer le coup du corrigé, marqué book=true.
 * ============================================================ */
import { describe, it, expect } from 'vitest';
import { playableMoves, applyMove, type Board, type Piece, type Move } from '../src/regles';
import { EXOS, caseToRc, rcToCase } from '../src/exercices';
import { aiAnalyse } from '../src/ia';

function buildExo(b: number[], w: number[]): Board {
  const bd: Board = Array.from({ length: 10 }, () => Array<Piece | null>(10).fill(null));
  for (const n of b) { const [r, c] = caseToRc(n); bd[r][c] = { col: 'b', k: false }; }
  for (const n of w) { const [r, c] = caseToRc(n); bd[r][c] = { col: 'w', k: false }; }
  return bd;
}
const pathOf = (m: Move): number[] => [rcToCase(m.from[0], m.from[1]), ...m.path.map(s => rcToCase(s.r, s.c))];

/** Position de C7.4 après le 1ᵉʳ coup blanc du livre → trait aux Noirs. */
function c74AfterFirstMove(): { bd: Board; attendu: number[] } {
  const exo = EXOS.find(e => e.id === 'C7.4')!;
  const bd = buildExo(exo.b, exo.w);
  const mv = playableMoves(bd, 'w').find(m => {
    const q = pathOf(m); const p = exo.paths[0];
    return q[0] === p[0] && q.length === p.length && q.every((n, i) => n === p[i]);
  })!;
  return { bd: applyMove(bd, mv), attendu: exo.paths[1] };
}

describe('Livre des exercices validés', () => {
  it('reconnaît une suite d\'exercice (C7.4, trait aux Noirs) et joue le coup du corrigé', () => {
    const { bd, attendu } = c74AfterFirstMove();
    const an = aiAnalyse(bd, 9, 2000);
    expect(an).not.toBeNull();
    expect(an!.book).toBe(true);
    const q = pathOf(an!.move);
    expect(q[0]).toBe(attendu[0]);
    expect(q[q.length - 1]).toBe(attendu[attendu.length - 1]);
  });

  it('ne marque PAS book sur une position inconnue', () => {
    const bd = buildExo([12, 14, 16, 18, 20, 22, 24, 26],
                        [33, 35, 37, 39, 41, 43, 45, 47]);
    const an = aiAnalyse(bd, 2, 500);
    expect(an).not.toBeNull();
    expect(an!.book ?? false).toBe(false);
  });
});
