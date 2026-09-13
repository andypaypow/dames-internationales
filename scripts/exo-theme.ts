/* ============================================================
 * exo-theme — pipeline semi-automatique d'ajout d'exercices thématisés
 * (dames-international). Usage : npx vite-node scripts/exo-theme.ts <cmd> …
 *
 * Commandes :
 *   render <pdf> <premiere> <derniere> <theme>
 *       → PNG des pages dans exercices-wip/<theme>/ (pour lecture visuelle)
 *   init <theme> <catégorie> <goal:dame|mat|gain>
 *       → modèle exercices-wip/<theme>/exos.json à remplir
 *   show <theme> <n°entrée>
 *       → liste les coups légaux du trait (aide à la correction/transcription)
 *   check <theme>
 *       → valide chaque entrée au moteur (rejeu légal, prise majoritaire)
 *         et écrit exos.json.valide (chemins exacts retenus)
 *   merge <theme>
 *       → intègre les entrées validées dans src/exos-gen.ts (régénéré),
 *         puis tsc + tests
 *   deploy
 *       → npm run build + deploy.sh (https://dames.filtreexpert.org)
 *
 * Workflow : render → (lecture des images) → init+éditer exos.json →
 *            check (corriger jusqu'à 0 erreur) → merge → deploy
 * Format exos.json : [{ "b":[..], "w":[..], "trait":"b"|"w",
 *                       "coups":"32-27 18x23 …", "id":"T.1",
 *                       "note":"…", "solTxt":"…" }]
 * ============================================================ */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { N, playableMoves, applyMove, type Board, type Col, type Piece, type Move } from '../src/regles';
import { caseToRc, rcToCase } from '../src/exercices';

const WIP = 'exercices-wip';
const arg = (i: number) => process.argv[i + 2];
const die = (m: string): never => { console.error('✗ ' + m); process.exit(1); };

interface Raw { id?: string; b: number[]; w: number[]; trait: 'b' | 'w'; coups: string; note?: string; solTxt?: string; paths?: number[][]; bd?: number[]; wd?: number[] }

function file(theme: string, suffix = ''): string {
  const p = `${WIP}/${theme}/exos.json${suffix}`;
  if (!suffix && !existsSync(p)) die(`${p} absent`);
  return p;
}
function build(b: number[], w: number[], bd: number[] = [], wd: number[] = []): Board {
  const board: Board = Array.from({ length: N }, () => Array<Piece | null>(N).fill(null));
  for (const n of b) { const [r, c] = caseToRc(n); board[r][c] = { col: 'b', k: false }; }
  for (const n of w) { const [r, c] = caseToRc(n); board[r][c] = { col: 'w', k: false }; }
  for (const n of bd) { const [r, c] = caseToRc(n); board[r][c] = { col: 'b', k: true }; }
  for (const n of wd) { const [r, c] = caseToRc(n); board[r][c] = { col: 'w', k: true }; }
  return board;
}
const pathOf = (m: Move): number[] => [rcToCase(m.from[0], m.from[1]), ...m.path.map(s => rcToCase(s.r, s.c))];
const fmt = (p: number[]): string => p[0] + '-' + p.slice(1).join('x');

function load(theme: string): Raw[] {
  const raw: Raw[] = JSON.parse(readFileSync(file(theme), 'utf8'));
  raw.forEach((e, i) => { if (!e.id) e.id = `T.${i + 1}`; });
  return raw;
}

/* ---------- commandes ---------- */

function render(): void {
  const [pdf, first, last, theme] = [arg(1), arg(2), arg(3), arg(4)];
  if (!pdf || !first || !last || !theme) die('usage: render <pdf> <premiere> <derniere> <theme>');
  const dir = `${WIP}/${theme}`;
  mkdirSync(dir, { recursive: true });
  execSync(`pdftoppm -png -r 130 -f ${first} -l ${last} '${pdf}' ${dir}/p`, { stdio: 'inherit' });
  console.log(`✓ pages ${first}-${last} → ${dir}/ (lisez les images puis remplissez exos.json)`);
}

function init(): void {
  const [theme, cat, goal] = [arg(1), arg(2) ?? '🎯 Thème', arg(3) ?? 'gain'];
  const dir = `${WIP}/${theme}`;
  mkdirSync(dir, { recursive: true });
  const p = `${dir}/exos.json`;
  if (existsSync(p)) die(`${p} existe déjà`);
  writeFileSync(p, JSON.stringify([{ id: 'T.1', cat, goal, trait: 'w', b: [], w: [], coups: '', note: '' }], null, 1));
  console.log(`✓ ${p} créé (catégorie « ${cat} », goal ${goal}) — à remplir ; meta cat/goal reprise au merge`);
}

function show(): void {
  const [theme, idx] = [arg(1), Number(arg(2))];
  const e = load(theme)[idx - 1] ?? die(`entrée ${idx} inexistante`);
  let bd = build(e.b, e.w);
  let turn: Col = e.trait;
  for (const path of e.paths ?? []) {
    const mv = (playableMoves(bd, turn) as Move[]).find(m => { const p = pathOf(m); return p[0] === path[0] && p.length === path.length && p.every((n, i) => n === path[i]); });
    if (!mv) { console.log(`⚠ coup rejoué ${path.join('/')} introuvable — arrêt sur la position courante`); break; }
    bd = applyMove(bd, mv); turn = turn === 'w' ? 'b' : 'w';
  }
  console.log(`Position entrée ${idx} — trait aux ${turn === 'w' ? 'Blancs' : 'Noirs'} :`);
  for (const m of playableMoves(bd, turn)) console.log('  ' + fmt(pathOf(m)));
}

function check(): void {
  const theme = arg(1) ?? die('usage: check <theme>');
  const raw = load(theme);
  const out: Raw[] = []; let ko = 0;
  for (const e of raw) {
    const all = [...e.b, ...e.w];
    if (e.b.length > 20 || e.w.length > 20) { console.log(`✗ ${e.id} : plus de 20 pions par camp`); ko++; continue; }
    if (new Set(all).size !== all.length) { console.log(`✗ ${e.id} : case en double`); ko++; continue; }
    let bd = build(e.b, e.w, e.bd ?? [], e.wd ?? []); let turn: Col = e.trait;
    const paths: number[][] = []; let ok = true;
    for (const t of e.coups.trim().split(/\s+/).filter(Boolean)) {
      const want = (t.includes('x') ? t.split('x') : t.split('-')).map(Number);
      const moves = playableMoves(bd, turn);
      // notation du livre souvent abrégée : départ + quelques arrivées (parfois
      // seulement la finale). Match : même départ, même arrivée FINALE, éléments
      // du token dans l'ordre ; on garde la rafle la plus courte (majoritaire).
      const mv = moves.filter(m => {
        const p = pathOf(m);
        if (p[0] !== want[0] || p[p.length - 1] !== want[want.length - 1] || p.length < want.length) return false;
        let i = 1;
        for (const n of p.slice(1)) { if (n === want[i]) i++; }
        return i === want.length;
      }).sort((a, b) => pathOf(a).length - pathOf(b).length)[0];
      if (!mv) {
        console.log(`✗ ${e.id} : « ${t} » (${turn}) illégal. Coups légaux du trait :`);
        for (const m of moves) console.log('    ' + fmt(pathOf(m)));
        ok = false; ko++; break;
      }
      const p = pathOf(mv);
      if (fmt(p) !== t) console.log(`⚠ ${e.id} : « ${t} » rejoué « ${fmt(p)} » (prise majoritaire — chemin retenu)`);
      paths.push(p); bd = applyMove(bd, mv); turn = turn === 'w' ? 'b' : 'w';
    }
    if (ok) { console.log(`✓ ${e.id} : OK (${paths.length} demi-coups)`); out.push({ ...e, paths }); }
  }
  writeFileSync(file(theme, '.valide'), JSON.stringify(out, null, 1));
  console.log(`\n${out.length}/${raw.length} validés (${ko} rejets) → ${file(theme, '.valide')}`);
  if (ko) process.exitCode = 1;
}

function merge(): void {
  const theme = arg(1) ?? die('usage: merge <theme>');
  const valides = JSON.parse(readFileSync(file(theme, '.valide'), 'utf8')) as (Raw & { cat?: string; goal?: string })[];
  if (!valides.length) die('aucune entrée validée — lance check d’abord');
  // régénère src/exos-gen.ts avec TOUS les thèmes validés (y compris celui-ci)
  const themes = readdirSync(WIP).filter(t => existsSync(`${WIP}/${t}/exos.json.valide`));
  if (!themes.includes(theme)) themes.push(theme);
  let body = `/* GÉNÉRÉ par scripts/exo-theme.ts — ne pas éditer à la main.\n * Sources : exos.json.valides de exercices-wip/ (thèmes : ${themes.join(', ')}) */\n`;
  body += `import type { Exo } from './exercices';\n\nexport const EXOS_THEMES: Exo[] = [\n`;
  for (const t of themes) {
    const list = t === theme ? valides : (JSON.parse(readFileSync(`${WIP}/${t}/exos.json.valide`, 'utf8')));
    const meta = JSON.parse(readFileSync(`${WIP}/${t}/exos.json`, 'utf8'))[0] as Raw & { cat?: string; goal?: string };
    const cat = meta.cat ?? '🎯 Thème'; const goal = meta.goal ?? 'gain';
    body += `  /* ===== ${t} ===== */\n`;
    for (const e of list) {
      const sol = e.solTxt ?? e.coups;
      body += `  { id: ${JSON.stringify(e.id)}, cat: ${JSON.stringify(cat)}, goal: '${goal}', trait: '${e.trait}',\n`;
      body += `    b: [${e.b.join(', ')}], w: [${e.w.join(', ')}],\n`;
      const dames = (e.bd?.length ? `, bd: [${e.bd.join(', ')}]` : '') + (e.wd?.length ? `, wd: [${e.wd.join(', ')}]` : '');
      const suffix = (e.note ? `\n    note: ${JSON.stringify(e.note)},` : '') + dames.replace(/^,/, '');
      body += `    paths: [${e.paths!.map(p => `[${p.join(', ')}]`).join(', ')}],\n`;
      body += `    solTxt: ${JSON.stringify(sol)},${suffix} },\n`;
    }
  }
  body += `];\n`;
  writeFileSync('src/exos-gen.ts', body);
  // branche exercices.ts sur le fichier généré (idempotent)
  let ex = readFileSync('src/exercices.ts', 'utf8');
  if (!ex.includes(`from './exos-gen'`)) {
    ex = `import { EXOS_THEMES } from './exos-gen';\n` + ex;
    ex = ex.replace(/export const EXOS: Exo\[\] = \[([^\]]*)\];/s,
      (_m, inner) => `export const EXOS: Exo[] = [${inner}, ...EXOS_THEMES];`);
  }
  writeFileSync('src/exercices.ts', ex);
  console.log(`✓ src/exos-gen.ts régénéré (${themes.join(', ')}) — tsc + tests :`);
  execSync('npx tsc --noEmit && npm test', { stdio: 'inherit' });
}

function deploy(): void {
  execSync('npm run build && ./deploy.sh', { stdio: 'inherit' });
  console.log('✓ en ligne — Ctrl+Shift+R sur https://dames.filtreexpert.org/');
}

const cmds: Record<string, () => void> = { render, init, show, check, merge, deploy };
const cmd0 = arg(0);
if (!cmd0 || !cmds[cmd0]) die('commande inconnue (render|init|show|check|merge|deploy) — voir l’en-tête de scripts/exo-theme.ts');
cmds[cmd0]();
