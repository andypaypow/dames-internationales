/* Validation moteur des transcriptions JSON (exos enchaînements/marchand de bois).
 * Usage : npx tsx scripts/valide-enchainements.ts fichier.json
 * Format JSON : [{diag,b,w,trait,coups,resume}] — coups = "32-27 18x23 33-28 …"
 * Sortie : pour chaque entrée OK/KO + raison ; écrit fichier.json.valide avec paths. */
import { readFileSync, writeFileSync } from 'node:fs';
import { N, playableMoves, applyMove, type Board, type Col, type Piece, type Move } from '../src/regles';
import { caseToRc, rcToCase } from '../src/exercices';

interface Raw { diag: string; page?: number; b: number[]; w: number[]; trait: 'b' | 'w'; coups: string; resume?: string }

function build(b: number[], w: number[]): Board {
  const bd: Board = Array.from({ length: N }, () => Array<Piece | null>(N).fill(null));
  for (const n of b) { const [r, c] = caseToRc(n); bd[r][c] = { col: 'b', k: false }; }
  for (const n of w) { const [r, c] = caseToRc(n); bd[r][c] = { col: 'w', k: false }; }
  return bd;
}
function pathOf(m: Move): number[] { return [rcToCase(m.from[0], m.from[1]), ...m.path.map(s => rcToCase(s.r, s.c))]; }
function fmt(p: number[]): string { return p[0] + '-' + p.slice(1).join('x'); }

const raw: Raw[] = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const out: unknown[] = [];
let ko = 0;
for (const e of raw) {
  // doublons ?
  const all = [...e.b, ...e.w];
  if (new Set(all).size !== all.length) { console.log(`✗ diag ${e.diag} : case en double`); ko++; continue; }
  let bd = build(e.b, e.w);
  let turn: Col = e.trait;
  const paths: number[][] = [];
  let ok = true;
  const toks = e.coups.trim().split(/\s+/);
  for (const t of toks) {
    const parts = (t.includes('x') ? t.split('x') : t.split('-')).map(Number);
    const from = parts[0];
    const want = parts;
    const mv = playableMoves(bd, turn).find(m => { const p = pathOf(m); return p[0] === want[0] && p.length === want.length && p.every((n, i) => n === want[i]); })
      ?? playableMoves(bd, turn).find(m => pathOf(m)[0] === from);
    if (!mv) { console.log(`✗ diag ${e.diag} : coup ${t} (${turn}) illégal ou introuvable`); ok = false; ko++; break; }
    const p = pathOf(mv);
    if (fmt(p) !== t) console.log(`⚠ diag ${e.diag} : « ${t} » rejoué en « ${fmt(p)} » (chemin imposé)`);
    paths.push(p);
    bd = applyMove(bd, mv);
    turn = turn === 'w' ? 'b' : 'w';
  }
  if (ok) { console.log(`✓ diag ${e.diag} : OK (${paths.length} demi-coups)`); out.push({ ...e, paths }); }
}
writeFileSync(process.argv[2] + '.valide', JSON.stringify(out, null, 1));
console.log(`\n${out.length}/${raw.length} validés (${ko} rejets) → ${process.argv[2]}.valide`);
