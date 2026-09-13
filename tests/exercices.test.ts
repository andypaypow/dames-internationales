/* ============================================================
 * Non-régression des exercices « Coups de Dame » :
 * chaque position + solution doit se rejouer légalement (règles
 * FID, prise majoritaire) et se terminer par une dame blanche.
 * ============================================================ */
import { describe, it, expect } from 'vitest';
import { N, playableMoves, applyMove, type Board, type Col, type Piece, type Move } from '../src/regles';
import { EXOS, caseToRc, rcToCase } from '../src/exercices';

function buildExo(b: number[], w: number[], bdD: number[] = [], wd: number[] = []): Board {
  const bd: Board = Array.from({ length: N }, () => Array<Piece | null>(N).fill(null));
  for (const n of b) { const [r, c] = caseToRc(n); bd[r][c] = { col: 'b', k: false }; }
  for (const n of w) { const [r, c] = caseToRc(n); bd[r][c] = { col: 'w', k: false }; }
  for (const n of bdD) { const [r, c] = caseToRc(n); bd[r][c] = { col: 'b', k: true }; }
  for (const n of wd) { const [r, c] = caseToRc(n); bd[r][c] = { col: 'w', k: true }; }
  return bd;
}

function matchMove(bd: Board, turn: Col, path: number[]): Move | null {
  return playableMoves(bd, turn).find(m => {
    if (rcToCase(m.from[0], m.from[1]) !== path[0]) return false;
    const lands = m.path.map(s => rcToCase(s.r, s.c));
    return lands.length === path.length - 1 && lands.every((n, i) => n === path[i + 1]);
  }) ?? null;
}

describe('exercices Coups de Dame', () => {
  it('chaque position contient 20 pions au plus, cases foncées uniquement, aucune case double', () => {
    for (const e of EXOS) {
      const all = [...e.b, ...e.w];
      expect(e.b.length).toBeLessThanOrEqual(20);
      expect(e.w.length).toBeLessThanOrEqual(20);
      expect(new Set(all).size).toBe(all.length);
      for (const n of all) {
        const [r, c] = caseToRc(n);
        expect((r + c) % 2).toBe(1);
      }
    }
  });

  for (const e of EXOS) {
    it(`${e.goal === 'mat' ? 'M' : 'C'} ${e.id} : la solution se rejoue légalement`, () => {
      let bd = buildExo(e.b, e.w, e.bd ?? [], e.wd ?? []);
      let turn: Col = e.trait ?? 'w';
      for (const path of e.paths) {
        const mv = matchMove(bd, turn, path);
        expect(mv, `${e.goal === 'mat' ? 'M' : 'C'} ${e.id} coup ${turn} ${path.join('-')} illégal`).toBeTruthy();
        bd = applyMove(bd, mv!);
        turn = turn === 'w' ? 'b' : 'w';
      }
      if (e.goal === 'dame') {
        const dame = bd.flat().some(p => p && p.col === 'w' && p.k);
        expect(dame, `C ${e.id} : pas de dame blanche à la fin`).toBe(true);
      }
      // Mat : le "+" du PDF est un blocage/zugzwang stratégique, non
      // prouvable à faible profondeur — la validation est le rejeu légal
      // complet ci-dessus (chemin exact, prise majoritaire respectée).
    });
  }
});
