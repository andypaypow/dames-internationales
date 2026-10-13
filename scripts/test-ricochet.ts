/* Test des exercices ricochet07 :
 *  1. rejeu du corrigé (déjà fait par exo-theme check) + bilan matériel final
 *  2. l'IA (minimax Maître : profondeur 9 / 4 s) trouve-t-elle le 1ᵉʳ coup du livre ?
 * Usage : npx vite-node scripts/test-ricochet.ts
 */
import { readFileSync } from 'node:fs';
import { playableMoves, applyMove, type Board, type Piece, type Move, type Col } from '../src/regles';
import { caseToRc, rcToCase } from '../src/exercices';
import { aiAnalyse } from '../src/ia';

interface Raw { id: string; b: number[]; w: number[]; trait: 'b' | 'w'; paths: number[][]; solTxt: string }

function build(b: number[], w: number[]): Board {
  const bd: Board = Array.from({ length: 10 }, () => Array<Piece | null>(10).fill(null));
  for (const n of b) { const [r, c] = caseToRc(n); bd[r][c] = { col: 'b', k: false }; }
  for (const n of w) { const [r, c] = caseToRc(n); bd[r][c] = { col: 'w', k: false }; }
  return bd;
}
const pathOf = (m: Move): number[] => [rcToCase(m.from[0], m.from[1]), ...m.path.map(s => rcToCase(s.r, s.c))];
const fmt = (p: number[]): string => p[0] + (p.length > 2 ? 'x' : '-') + p.slice(1).join('x');

/** miroir 180° + inversion des couleurs : le trait 'w' devient 'b' (aiAnalyse cherche pour les Noirs). */
function mirror(bd: Board): Board {
  const out: Board = Array.from({ length: 10 }, () => Array<Piece | null>(10).fill(null));
  for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) {
    const p = bd[r][c];
    if (p) out[9 - r][9 - c] = { col: p.col === 'w' ? 'b' : 'w', k: p.k };
  }
  return out;
}
const mirCase = (n: number): number => { const [r, c] = caseToRc(n); return rcToCase(9 - r, 9 - c); };
const mirPath = (p: number[]): number[] => p.map(mirCase);
const mirMove = (bd: Board, m: Move): Move => {
  const steps = m.path.map(s => ({ r: 9 - s.r, c: 9 - s.c, cap: s.cap ? { r: 9 - s.cap.r, c: 9 - s.cap.c } : null }));
  return { from: [9 - m.from[0], 9 - m.from[1]], path: steps, board: null };
};
const sameMove = (a: Move, bb: Move): boolean =>
  a.from[0] === bb.from[0] && a.from[1] === bb.from[1] &&
  a.path.length === bb.path.length && a.path.every((s, i) => s.r === bb.path[i].r && s.c === bb.path[i].c);

const theme = process.argv[2] ?? 'ricochet07';
const raw: Raw[] = JSON.parse(readFileSync(`exercices-wip/${theme}/exos.json.valide`, 'utf8'));
let found = 0;
for (const e of raw) {
  // 1) bilan matériel en fin de ligne validée
  let bd = build(e.b, e.w); let turn: Col = e.trait;
  for (const p of e.paths) {
    const mv = (playableMoves(bd, turn) as Move[]).find(m => { const q = pathOf(m); return q[0] === p[0] && q.length === p.length && q.every((n, i) => n === p[i]); })!;
    bd = applyMove(bd, mv); turn = turn === 'w' ? 'b' : 'w';
  }
  let wN = 0, bN = 0;
  for (const row of bd) for (const p of row) { if (!p) continue; if (p.col === 'w') wN++; else bN++; }
  const gain = wN - bN;

  // 2) l'IA trouve-t-elle le 1ᵉʳ coup ?
  const start = build(e.b, e.w);
  const book = (playableMoves(start, e.trait) as Move[]).find(m => { const q = pathOf(m); const p = e.paths[0]; return q[0] === p[0] && q.length === p.length && q.every((n, i) => n === p[i]); })!;
  const an = aiAnalyse(mirror(start), 9, 4000);
  const ia = an ? mirMove(mirror(start), an.move) : null;
  const ok = !!ia && sameMove(ia, book);
  if (ok) found++;
  console.log(`${ok ? '✓' : '✗'} ${e.id} : livre ${fmt(pathOf(book))} | IA ${ia ? fmt(pathOf(ia)) : '—'} (score ${an?.score ?? '—'}) | gain final ${gain >= 0 ? '+' : ''}${gain} (B${wN}/N${bN})`);
}
console.log(`\nIA trouve le coup du livre : ${found}/${raw.length}`);
