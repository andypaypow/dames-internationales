/* ============================================================
 * Couche UI — rendu DOM, interactions, modes de jeu.
 * Aucune règle de jeu ici : tout passe par regles.ts / ia.ts.
 *
 * Sélection :
 *  - clic sur un pion avec UNE seule possibilité → coup joué directement ;
 *  - sinon, les destinations FINALES sont marquées : cliquer l'une d'elles
 *    joue la séquence complète (rafle entière en un clic).
 * ============================================================ */
import { N, initBoard, clone, allMoves, playableMoves, applyMove, type Board, type Col, type Piece, type Move } from './regles';
import { aiAnalyse } from './ia';
import { EXOS, caseToRc, rcToCase, type Exo } from './exercices';
import { EXO_IMG } from './exo-img';
import './style.css';

const boardEl = document.getElementById('board') as HTMLElement;
const $ = (id: string): HTMLElement => document.getElementById(id)!;
const $sel = (id: string): HTMLSelectElement => document.getElementById(id) as HTMLSelectElement;

let board: Board;
let turn: Col;
let selected: [number, number] | null = null;
let sequences: Move[] = [];
let history: { board: Board; turn: Col }[] = [];
let redoStack: { board: Board; turn: Col; matched?: boolean }[] = [];
let gameOver = false;
let aiThinking = false;
let animating = false;
let playGen = 0;        // jeton du coup en cours d'animation : annulé par un reset/undo/redo
let lastMove: Move | null = null;   // dernier coup joué (surbrillance départ + arrivée)

/* ---------- mode exercices (Coups de Dame) ---------- */
// Démarrage sur le PREMIER exercice disposant d'une image du livre (1ᵉʳ thème).
const EXO0 = Math.max(0, EXOS.findIndex(e => !!EXO_IMG[e.id]));
let exoIndex = EXO0;      // exercice courant
let exoStep = 0;       // nombre de demi-coups de la solution déjà joués
let exoAuto = 0;       // >0 : enchaînement automatique de la solution (replay)
let exoLock = false;   // verrou pendant l'attente d'un coup automatique
let exoAutoMove = false;  // le coup en cours d'évaluation a été joué automatiquement (réponse de la solution)
let exoGen = 0;           // génération d'exercice : invalide les coups automatiques programmés avant un chargement
let exoRun = 0;           // génération de l'enchaînement auto : ⏸ Stop invalide la réponse programmée SANS recharger
let exoRepeat = false;    // 🔁 rejouer la solution en boucle après chaque réussite
let exoStack: boolean[] = [];  // par coup joué : faisait-il partie de la solution ?
let exoHints = 0;      // nombre d'indices révélés
let exoMenuMoves: Move[] = []; // coups légaux du menu

const exoMode = (): boolean => $sel('mode').value === 'exo';
const exo = (): Exo => EXOS[exoIndex];

/* ---------- ⭐ favoris (persistés en localStorage) ---------- */
const FAV_KEY = 'dames-favoris';
let exoFavs: Set<string>;
try { exoFavs = new Set<string>(JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]')); }
catch { exoFavs = new Set(); }
function exoSaveFavs(): void {
  try { localStorage.setItem(FAV_KEY, JSON.stringify([...exoFavs])); } catch { /* stockage indisponible */ }
}
function exoToggleFav(id: string): void {
  if (exoFavs.has(id)) exoFavs.delete(id); else exoFavs.add(id);
  exoSaveFavs(); exoBuildMenu(); exoUpdateFavBtn();
}
/** Met à jour le bouton ⭐ du panneau (exercice courant). */
function exoUpdateFavBtn(): void {
  const btn = $('exoFav');
  if (!btn) return;
  const on = exoFavs.has(exo().id);
  btn.textContent = on ? '⭐' : '☆';
  btn.title = on ? 'Retirer des favoris' : 'Ajouter aux favoris';
}

/** Formate un chemin de cases : 27-21 ou 33x22x13x4. */
function fmtPath(path: number[]): string {
  const cap = path.length > 1;
  return path.map((n, i) => (i ? (cap ? 'x' : '-') : '') + n).join('');
}

function status(t: string): void { $('status').textContent = t; }

const wait = (ms: number): Promise<void> => new Promise(res => setTimeout(res, ms));

/** Coups légaux du pion (r,c). */
const movesOf = (r: number, c: number): Move[] =>
  sequences.filter(m => m.from[0] === r && m.from[1] === c);

function render(): void {
  boardEl.innerHTML = '';
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const sq = document.createElement('div');
    sq.className = 'sq ' + ((r + c) % 2 ? 'dark' : 'light');
    sq.dataset.r = String(r); sq.dataset.c = String(c);
    const n = document.createElement('span'); n.className = 'num';
    // Numérotation internationale 1-50 sur les cases foncées (tous les modes)
    n.textContent = (r + c) % 2 === 1 ? String(rcToCase(r, c)) : '';
    sq.appendChild(n);
    const p = board[r][c];
    if (p) {
      const d = document.createElement('div');
      d.className = 'piece ' + (p.col === 'w' ? 'w' : 'b') + (p.k ? ' k' : '');
      sq.appendChild(d);
    }
    boardEl.appendChild(sq);
  }
  updateUI();
  highlight();
}

function updateUI(): void {
  let sw = 0, sb = 0;
  board.flat().forEach(p => { if (p) p.col === 'w' ? sw++ : sb++; });
  $('sw').textContent = String(sw);
  $('sb').textContent = String(sb);
  const tb = $('turnbox');
  tb.className = 'turn ' + turn;
  tb.textContent = gameOver ? '— Partie terminée —' : (turn === 'b' ? '⚫ Tour des Noirs' : '⚪ Tour des Blancs');
}

/** Le coup joué suit-il exactement le chemin attendu ? */
function pathMatches(m: Move, path: number[]): boolean {
  if (rcToCase(m.from[0], m.from[1]) !== path[0]) return false;
  const lands = m.path.map(s => rcToCase(s.r, s.c));
  return lands.length === path.length - 1 && lands.every((n, i) => n === path[i + 1]);
}

function exoFindMove(path: number[]): Move | null {
  return playableMoves(board, turn).find(m => pathMatches(m, path)) ?? null;
}

function exoLoad(i: number): void {
  exoIndex = (i + EXOS.length) % EXOS.length;
  exoReset();
}

/** Menu arborescent : grands thèmes dépliables, exercices sous chaque thème. */
const exoOpenCats = new Set<string>();
function exoBuildMenu(): void {
  const tree = $('exoMenuTree');
  tree.innerHTML = '';
  const groups: { cat: string; idxs: number[] }[] = [];
  EXOS.forEach((e, i) => {
    const g = groups.find(x => x.cat === e.cat);
    if (g) g.idxs.push(i); else groups.push({ cat: e.cat, idxs: [i] });
  });
  // ⭐ groupe Favoris en tête de menu (uniquement s'il contient des exercices)
  const favIdxs = EXOS.map((_, i) => i).filter(i => exoFavs.has(EXOS[i].id));
  if (favIdxs.length) groups.unshift({ cat: '⭐ Favoris', idxs: favIdxs });
  if (!exoOpenCats.size && groups.length) exoOpenCats.add(EXOS[exoIndex].cat);
  for (const g of groups) {
    const open = exoOpenCats.has(g.cat);
    const head = document.createElement('button');
    head.type = 'button';
    head.className = 'exo-cat' + (open ? ' open' : '');
    const arrow = document.createElement('span');
    arrow.className = 'exo-cat-arrow'; arrow.textContent = open ? '▾' : '▸';
    const name = document.createElement('span'); name.textContent = g.cat;
    const count = document.createElement('span');
    count.className = 'exo-cat-count'; count.textContent = String(g.idxs.length);
    head.append(arrow, name, count);
    head.onclick = () => {
      if (exoOpenCats.has(g.cat)) exoOpenCats.delete(g.cat); else exoOpenCats.add(g.cat);
      exoBuildMenu();
    };
    tree.appendChild(head);
    if (open) {
      const list = document.createElement('div');
      list.className = 'exo-cat-list';
      for (const i of g.idxs) {
        const e = EXOS[i];
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'exo-item' + (i === exoIndex ? ' current' : '');
        b.textContent = `${e.goal === 'mat' ? 'M' : e.goal === 'gain' ? 'G' : 'C'} ${e.id}`;
        b.title = 'Charger cet exercice';
        // ⭐ étoile favori : clic sur l'étoile = bascule (sans charger l'exercice)
        const fav = exoFavs.has(e.id);
        const star = document.createElement('span');
        star.className = 'exo-star' + (fav ? ' on' : '');
        star.textContent = fav ? '⭐' : '☆';
        star.title = fav ? 'Retirer des favoris' : 'Ajouter aux favoris';
        star.onclick = (ev) => { ev.stopPropagation(); exoToggleFav(e.id); };
        b.append(' ', star);
        b.onclick = () => {
          $('exoMenuDrop').hidden = true;
          if (exoMode()) { if (!exoLock && !animating) exoLoad(i); return; }
          // hors mode exercice : bascule en mode 🎓 puis charge l'exercice choisi
          exoIndex = i;
          $sel('mode').value = 'exo';
          $sel('mode').dispatchEvent(new Event('change'));
        };
        list.appendChild(b);
      }
      tree.appendChild(list);
    }
  }
}

function exoReset(): void {
  const e = exo();
  exoGen++;                 // annule toute réponse automatique programmée pour l'exercice précédent
  exoRun++;                 // …et tout enchaînement ⏶ Solution auto en cours
  playGen++;                // …et toute animation de coup encore en vol
  board = Array.from({ length: N }, () => Array<Piece | null>(N).fill(null)) as Board;
  for (const n of e.b) { const [r, c] = caseToRc(n); board[r][c] = { col: 'b', k: false }; }
  for (const n of e.w) { const [r, c] = caseToRc(n); board[r][c] = { col: 'w', k: false }; }
  for (const n of e.bd ?? []) { const [r, c] = caseToRc(n); board[r][c] = { col: 'b', k: true }; }
  for (const n of e.wd ?? []) { const [r, c] = caseToRc(n); board[r][c] = { col: 'w', k: true }; }
  turn = 'w'; exoStep = 0; exoAuto = 0; exoLock = false; exoAutoMove = false;
  exoStack = []; exoHints = 0;
  selected = null; history = []; redoStack = [];
  gameOver = false; aiThinking = false; animating = false; lastMove = null;
  ($('end') as HTMLDialogElement).close();
  $('exoTitle').textContent = `Exercice ${e.goal === 'mat' ? 'M' : e.goal === 'gain' ? 'G' : 'C'} ${e.id}  ·  ${exoIndex + 1}/${EXOS.length}`;
  exoBuildMenu();
  $('exoSol').hidden = true; $('exoSol').textContent = '';
  $('exoFabTxt').hidden = true;
  exoAutoUI();
  // ⚪ Règle FID : ce sont toujours les Blancs qui commencent (tous les exercices).
  turn = 'w';
  sequences = playableMoves(board, turn);   // jeu libre : tout le damier est jouable
  render(); updateUI();
  exoRenderMenu();
  exoUpdateFavBtn();
  exoUpdateImg();
  // Exercices du livre où la solution commence par un coup Noir (A.98, A.100) :
  // les Blancs ouvrent par un coup libre, puis la solution noire est jouable.
  const libre = exo().trait === 'b';
  status(libre
    ? '⚪ Aux Blancs de jouer (coup libre) — puis faites jouer la solution aux Noirs !'
    : exo().goal === 'mat'
    ? '⚪ Aux Blancs de jouer — bloque les Noirs jusqu’au mat !'
    : exo().goal === 'gain'
    ? '⚪ Aux Blancs de jouer — trouvez la combinaison gagnante !'
    : '⚪ Aux Blancs de jouer — trouvez la combinaison qui fait une dame !');
}

/** Délai (ms) entre les demi-coups de l'enchaînement auto (réglable ▶/⚡/🚀). */
const exoDelay = (): number => +$sel('exoSpeed').value;

function exoSchedule(): void {
  const path = exo().paths[exoStep];
  const gen = exoGen;
  const run = exoRun;
  exoLock = true;
  setTimeout(() => {
    // ⏸ Stop ou changement d'exercice : on rend la main SANS laisser de verrou.
    if (gen !== exoGen || run !== exoRun) {
      exoLock = false; exoAutoMove = false;
      sequences = playableMoves(board, turn);
      updateUI(); exoRenderMenu(); exoRenderHints();
      return;
    }
    const mv = exoFindMove(path);
    if (mv) { exoAutoMove = true; void playMove(mv); return; }
    // Désynchronisé : le verrou doit sauter ET les coups légaux doivent être
    // recalculés (sinon le damier semble gelé : « Ce pion ne peut pas bouger »).
    exoLock = false; exoAuto = 0; exoAutoMove = false;
    sequences = playableMoves(board, turn);
    updateUI(); exoRenderMenu(); exoRenderHints();
    status('⚠️ Coup suivant indisponible dans cette position — jeu libre (↩ pour revenir, ⏮ Départ)');
  }, exoDelay());
}

function exoSuccess(): void {
  exoAuto = 0; exoLock = false;
  exoAutoUI();
  // ✅ PAS de blocage après la réussite : le damier reste jouable en jeu libre
  // (⏮ Départ pour rejouer le diagramme, 📚 pour choisir un autre exercice).
  sequences = playableMoves(board, turn);
  exoRenderMenu();
  updateUI();
  const ok = exo().goal === 'mat' ? 'Adversaire bloqué — mat' : exo().goal === 'gain' ? 'Combinaison réalisée' : 'Dame réalisée';
  const suite = sequences.length
    ? ' — jeu libre possible (⏮ Départ pour rejouer, 📚 pour un autre exercice)'
    : '';
  status(`🎉 Bravo ! ${ok} — exercice ${exo().goal === 'mat' ? 'M' : exo().goal === 'gain' ? 'G' : 'C'} ${exo().id} réussi${suite}.`);
  // 🔁 Repeat : repart automatiquement du diagramme et rejoue la solution
  if (exoRepeat) {
    const gen = exoGen, run = exoRun;
    setTimeout(() => {
      if (!exoRepeat || gen !== exoGen || run !== exoRun) return;   // Stop / exo changé / repeat off
      exoReset();
      exoAuto = exo().paths.length;
      exoAutoUI();
      exoSchedule();
    }, 2000);
  }
}

/** Menu des coups : liste les coups légaux du trait, cliquables. */
function exoRenderMenu(): void {
  const box = $('exoMoves');
  box.innerHTML = '';
  if (!exoMode()) { return; }
  exoMenuMoves = playableMoves(board, turn);
  highlight();
  const seen = new Map<string, number>();
  exoMenuMoves.forEach((m, i) => {
    const path = [rcToCase(m.from[0], m.from[1]), ...m.path.map(s => rcToCase(s.r, s.c))];
    const label = fmtPath(path);
    const n = (seen.get(label) ?? 0) + 1; seen.set(label, n);
    const b = document.createElement('button');
    b.className = 'exo-move';
    b.textContent = n > 1 ? `${label} (${n})` : label;
    b.title = 'Jouer ce coup';
    b.onclick = () => { if (!exoLock && !animating) void playMove(exoMenuMoves[i]); };
    // surbrillance du prochain coup de la solution si un indice est révélé
    const exp = exo().paths[exoStep];
    if (exoHints > 0 && exp && pathMatches(m, exp)) b.classList.add('hint');
    box.appendChild(b);
  });
  if (!exoMenuMoves.length) {
    const p = document.createElement('span');
    p.className = 'exo-none'; p.textContent = 'Aucun coup légal';
    box.appendChild(p);
  }
}

/** Affiche les indices révélés (le 1er coup, le 2e, …). */
function exoRenderHints(): void {
  const e = exo();
  const box = $('exoFabTxt');
  if (exoHints > 0 && exoStep < e.paths.length) {
    const upto = Math.min(exoStep + exoHints, e.paths.length);
    const lines = e.paths.slice(exoStep, upto).map(p => fmtPath(p));
    box.textContent = '💡 ' + lines.join('   puis   ');
    box.hidden = false;
  } else if (exoHints > 0) {
    box.textContent = '💡 Plus de coup à révéler — à vous de conclure !';
    box.hidden = false;
  }
}

/** Retour en arrière d'un coup (mode exercice) : je libre complet. */
function exoUndo(): void {
  if (!history.length || animating || exoLock) return;
  playGen++;                       // annule toute animation en vol
  exoRun++;                        // stoppe un éventuel enchaînement auto
  const h = history.pop()!;
  const wasMatched = exoStack.pop() ?? false;
  redoStack.push({ board: clone(board), turn, matched: wasMatched });
  if (wasMatched) exoStep = Math.max(0, exoStep - 1);
  board = h.board; turn = h.turn;
  gameOver = false; selected = null; lastMove = null;
  sequences = playableMoves(board, turn);
  ($('end') as HTMLDialogElement).close();
  render(); updateUI(); exoRenderMenu(); exoRenderHints();
  status('↩ Coup annulé — le menu vous propose les coups légaux');
}

/**
 * Appelé après chaque coup joué en mode exercice (au lieu de nextTurn).
 * Jeu libre : tout coup légal est permis ; seuls les coups de la solution
 * font avancer la combinaison (réponse noire auto-jouée si unique).
 */
function exoJudge(m: Move): void {
  turn = turn === 'w' ? 'b' : 'w';   // le coup vient d'être joué : on change de trait
  const from = rcToCase(m.from[0], m.from[1]);
  const end = m.path[m.path.length - 1];
  const to = rcToCase(end.r, end.c);
  const expected = exo().paths[exoStep];
  // Coup joué automatiquement (réponse de la solution / replay) : toujours
  // dans la séquence → on avance d'un demi-coup sans re-déclencher la réponse.
  if (exoAutoMove) {
    exoAutoMove = false;
    exoStack.push(true);
    exoStep++;
    exoLock = false;   // la réponse auto est jouée : le joueur reprend la main
    if (exoStep >= exo().paths.length) { exoSuccess(); return; }
    if (exoAuto > 0) { exoAuto--; exoSchedule(); return; }
    status(`🤖 ${turn === 'w' ? 'Noirs' : 'Blancs'} viennent de répondre ${fmtPath(expected)} — à vous de jouer`);
    sequences = playableMoves(board, turn);
    updateUI(); exoRenderMenu(); exoRenderHints();
    return;
  }
  const matched = !!expected && pathMatches(m, expected);
  exoStack.push(matched);
  if (matched) exoStep++;

  if (exoStep >= exo().paths.length) { exoSuccess(); return; }

  if (exoAuto > 0) { exoAuto--; exoSchedule(); return; }

  if (matched) {
    // L'adversaire respecte la solution : il rejoue automatiquement le
    // demi-coup suivant de la séquence (tant que le joueur suit la solution).
    const nxt = exo().paths[exoStep];
    if (nxt && exoFindMove(nxt)) { exoSchedule(); return; }
    status(`✅ C'est ça ! (${fmtPath(expected)}) — à vous de répondre`);
  } else if (exo().trait === 'b' && exoStep === 0) {
    // Exercice à trait Noir : le coup blanc d'ouverture est libre, pas une faute.
    status('⚪ Coup blanc libre — la solution commence au coup des Noirs (💡 pour la voir)');
  } else {
    status(`⚠️ ${fmtPath([from, to])} s'écarte de la solution — jeu libre, ↩ pour revenir`);
  }
  sequences = playableMoves(board, turn);
  if (!sequences.length) {
    status(`🚫 Plus aucun coup légal pour les ${turn === 'w' ? 'Blancs' : 'Noirs'} — ↩ Annuler le coup ou ⏮ Départ`);
  }
  updateUI(); exoRenderMenu(); exoRenderHints();
}

/** Marque le pion sélectionné + ses destinations FINALES (case d'arrivée de chaque séquence). */
function highlight(): void {
  document.querySelectorAll('.sq').forEach(s => s.classList.remove('sel', 'move', 'capt-land', 'last-from', 'last-to'));
  // surbrillance du dernier coup joué : case de départ + case d'arrivée
  if (lastMove) {
    const f = boardEl.children[lastMove.from[0] * N + lastMove.from[1]] as HTMLElement;
    f.classList.add('last-from');
    const e = lastMove.path[lastMove.path.length - 1];
    const t = boardEl.children[e.r * N + e.c] as HTMLElement;
    t.classList.add('last-to');
  }
  // indice révélé : surligner le pion à déplacer + sa destination
  if (exoMode() && exoHints > 0 && exoStep < exo().paths.length) {
    const exp = exo().paths[exoStep];
    const [hr, hc] = caseToRc(exp[0]);
    (boardEl.children[hr * N + hc] as HTMLElement)?.classList.add('hint-from');
    const [tr2, tc2] = caseToRc(exp[exp.length - 1]);
    (boardEl.children[tr2 * N + tc2] as HTMLElement)?.classList.add('hint-to');
  }
  if (gameOver || selected == null) return;
  const mine = movesOf(selected[0], selected[1]);
  const sq = boardEl.children[selected[0] * N + selected[1]] as HTMLElement;
  sq.classList.add('sel');
  const isCapture = !!mine[0]?.path[0].cap;
  const lands = new Map<string, { r: number; c: number }>();
  for (const m of mine) {
    const end = m.path[m.path.length - 1];
    lands.set(end.r + ',' + end.c, { r: end.r, c: end.c });
  }
  for (const [, t] of lands) {
    const s = boardEl.children[t.r * N + t.c] as HTMLElement;
    s.classList.add('move'); if (isCapture) s.classList.add('capt-land');
  }
}

/**
 * Joue un coup. Si c'est une rafle (prise multi-sauts), elle est ANIMÉE
 * pion après pion : la pièce saute case par case et chaque pion capturé
 * disparaît (fondu) au moment où il est sauté, avant le saut suivant.
 */
async function playMove(m: Move): Promise<void> {
  const gen = ++playGen;   // un reset/undo/redo pendant l'animation invalide ce coup
  history.push({ board: clone(board), turn });
  lastMove = m;
  redoStack = [];   // un nouveau coup invalide le rétablissement
  const b0 = board;
  selected = null; sequences = [];
  if (m.path[0].cap) {
    animating = true;
    const work = clone(b0);
    let cur: [number, number] = m.from;
    for (const s of m.path) {
      // la pièce atterrit sur la case du saut
      work[s.r][s.c] = work[cur[0]][cur[1]];
      work[cur[0]][cur[1]] = null;
      board = clone(work); render();
      if (gen !== playGen) { animating = false; return; }   // annulé (reset/undo) : on ne touche plus à rien
      if (s.cap) {
        // la pièce sautée s'efface, puis disparaît du plateau
        const el = (boardEl.children[s.cap.r * N + s.cap.c] as HTMLElement).querySelector('.piece');
        el?.classList.add('taken');
        await wait(170);
        if (gen !== playGen) { animating = false; return; }
        work[s.cap.r][s.cap.c] = null;
        board = clone(work); render();
      }
      cur = [s.r, s.c];
      await wait(180);
      if (gen !== playGen) { animating = false; return; }
    }
    animating = false;
  }
  board = applyMove(b0, m);
  aiThinking = false;
  render();
  if (exoMode()) { exoJudge(m); return; }
  nextTurn();
}

function checkEnd(): boolean {
  const { captures, quiet } = allMoves(board, turn);
  if (captures.length || quiet.length) return false;
  endGame(turn === 'b' ? '⚪ Les Blancs gagnent — les Noirs n\u2019ont plus de coup !' : '⚫ Les Noirs gagnent — les Blancs n\u2019ont plus de coup !');
  return true;
}

function endGame(msg: string): void {
  gameOver = true; updateUI();
  $('endTitle').textContent = '🎉 Partie terminée';
  $('endMsg').textContent = msg;
  ($('end') as HTMLDialogElement).showModal();
  status('');
}

function nextTurn(): void {
  turn = turn === 'b' ? 'w' : 'b';
  selected = null; sequences = [];
  updateUI();
  if (checkEnd()) return;
  if ($sel('mode').value === 'ai' && turn === 'b') { aiMove(); }
  else {
    sequences = playableMoves(board, turn);
    status(sequences[0] && sequences[0].path[0].cap ? '⚠️ Prise obligatoire (majoritaire)' : 'À vous de jouer');
  }
}

/* ---------- 💭 Réflexion écrite de l'ordinateur ---------- */
/** Convertit un coup en notation cases 1-50 (ex. « 33x24 » ou « 25-20 »). */
function aiNotation(m: Move): string {
  const path = m.path.map(s => rcToCase(s.r, s.c));
  const cap = m.path[0].cap != null;
  return path.map((n, i) => (i ? (cap ? 'x' : '-') : '') + n).join('');
}

/** Rédige la réflexion de l'IA à partir de l'analyse du moteur. */
function aiThought(a: { score: number; move: Move; alts: { m: Move; sc: number }[]; line: Move[]; oppCaps: Move[]; pieces: [number, number] }): string {
  const [nb, nw] = a.pieces;                     // nb = pions IA (Noirs), nw = joueur (Blancs)
  const L: string[] = [];
  // 1) Situation matérielle
  const mat = nb - nw;
  L.push(mat > 1 ? `⚖️ Je mène au matériel (${nb} contre ${nw}).`
       : mat < -1 ? `⚖️ Je suis en infériorité (${nb} contre ${nw}).`
       : `⚖️ Matériel équilibré (${nb} contre ${nw}).`);
  // 2) Verdict de l'évaluation (+ = bon pour les Noirs = moi)
  const s = Math.round(a.score);
  if (s >= 999) L.push('🔥 J\u2019ai trouvé une combinaison gagnante !');
  else if (s <= -999) L.push('😬 La position est perdue, je résiste du mieux que je peux.');
  else if (s > 5) L.push(`📈 Mon analyse me favorise légèrement (+${s}).`);
  else if (s < -5) L.push(`📉 Ton positionnement est un peu meilleur (${s}).`);
  else L.push('〰️ La position reste serrée.');
  // 3) Mon coup : prise ou coup calme + alternatives envisagées
  const cap = a.move.path[0].cap != null;
  if (cap) L.push(`🎯 Je joues la prise ${aiNotation(a.move)} — elle est obligatoire.`);
  else {
    const nAlt = Math.min(3, a.alts.length);
    const alts = a.alts.slice(0, nAlt).map(x => aiNotation(x.m)).join(' ou ');
    L.push(`🤔 Je joues ${aiNotation(a.move)} — j\u2019hésitais entre ${alts}.`);
  }
  // 4) Ligne prévue (mon coup + réponses attendues)
  if (a.line.length > 1) {
    L.push('🗂️ Si tu réponds ' + a.line.slice(1, 4).map(aiNotation).join(', puis ')
      + ' — voilà comment je vois la suite.');
  }
  // 5) Menaces détectées sur mes pièces après mon coup
  if (a.oppCaps.length) {
    const menaces = [...new Set(a.oppCaps.map(m => aiNotation(m)))].slice(0, 3).join(' ou ');
    L.push(`⚠️ Attention : après mon coup, tu pourras prendre avec ${menaces}.`);
  } else if (!cap) {
    L.push('✅ Je ne te laisse aucune prise immédiate.');
  }
  return L.join(' ');
}

function aiMove(): void {
  if (gameOver) return;
  aiThinking = true; status("🤖 L'ordinateur réfléchit…");
  $('aiThought').hidden = true;
  setTimeout(() => {
    const lv = $sel('level').value;
    const depth = +lv;
    // Budget temps : les gros niveaux cherchent plus profond sans geler l'UI
    const budget = depth >= 9 ? 4000 : depth >= 6 ? 2000 : 800;
    const a = aiAnalyse(board, depth, budget);
    if (!a) { aiThinking = false; checkEnd(); return; }
    // 💭 Écrire la réflexion (même analyse que le coup joué)
    $('aiThought').textContent = aiThought(a);
    $('aiThought').hidden = false;
    void playMove(a.move);   // rafle animée pion après pion
  }, 250);
}

/* ---------- interactions plateau ---------- */
boardEl.addEventListener('click', e => {
  if (gameOver || aiThinking || animating) return;
  if (exoMode() && exoLock) return;
  if ($sel('mode').value === 'ai' && turn === 'b') return;
  const sq = (e.target as HTMLElement).closest('.sq') as HTMLElement | null;
  if (!sq) return;
  const r = +sq.dataset.r!, c = +sq.dataset.c!;

  // 1) clic sur une destination finale marquée → on joue la séquence entière
  if (selected) {
    const mine = movesOf(selected[0], selected[1]);
    const m = mine.find(m => {
      const t = m.path[m.path.length - 1];
      return t.r === r && t.c === c;
    });
    if (m) { playMove(m); return; }
  }

  // 2) clic sur un pion à nous
  const p = board[r][c];
  if (p && p.col === turn) {
    const mine = movesOf(r, c);
    if (!mine.length) {
      status(sequences.length && sequences[0].path[0].cap ? '⚠️ Prise obligatoire : jouez un pion marqué' : 'Ce pion ne peut pas bouger');
      return;
    }
    if (mine.length === 1) { playMove(mine[0]); return; }   // une seule possibilité → coup direct
    if (selected && selected[0] === r && selected[1] === c) { // re-clic = déselection
      selected = null; highlight(); return;
    }
    selected = [r, c];
    highlight();
    status('Cliquez la case d\u2019arrivée pour jouer');
    return;
  }

  // 3) clic ailleurs → déselection
  if (selected) { selected = null; highlight(); }
});

// Échap ou clic droit → annule la sélection en cours (avant de jouer)
const deselect = (): boolean => {
  if (selected == null) return false;
  selected = null; highlight();
  status('Sélection annulée');
  return true;
};
document.addEventListener('keydown', e => { if (e.key === 'Escape') deselect(); });
boardEl.addEventListener('contextmenu', e => { e.preventDefault(); deselect(); });

/* ---------- boutons ---------- */
function init(): void {
  playGen++;   // annule toute animation en vol d'un coup précédent
  if (exoMode()) { exoLoad(exoIndex); return; }
  board = initBoard();
  turn = 'w'; selected = null; history = []; redoStack = []; gameOver = false; aiThinking = false; animating = false; lastMove = null;
  sequences = playableMoves(board, turn);
  render(); status('⚪ Les Blancs commencent — à vous de jouer');
  // ⚪ Règle FID : les Blancs commencent — l'IA (Noirs) ne doit PAS jouer ici.
}

$('new').onclick = init;
/** Restaure un état. Retourne le mode IA courant (peut changer entre clics). */
function restore(h: { board: Board; turn: Col }): void {
  board = h.board; turn = h.turn;
  gameOver = false; selected = null; sequences = playableMoves(board, turn);
  ($('end') as HTMLDialogElement).close();
  render();
}

$('undo').onclick = () => {
  if (exoMode()) { exoUndo(); return; }
  if (!history.length || aiThinking || animating) return;
  const isAi = $sel('mode').value === 'ai';
  // En mode IA : on annule aussi le coup de l'ordinateur pour rendre la main au joueur.
  const pop = (): void => {
    const h = history.pop()!;
    redoStack.push({ board: clone(board), turn });
    restore(h);
  };
  pop();
  if (isAi && turn === 'b') {
    if (history.length) pop();
    else { // début de partie : les Blancs (joueur) recommencent, rien à rétablir
      redoStack = []; status('⚪ Les Blancs commencent — à vous de jouer');
      aiMove(); return;
    }
  }
  status('↩ Coup annulé');
};
$('redo').onclick = () => {
  if (exoMode()) {
    if (!redoStack.length || animating || exoLock) return;
    playGen++;                     // annule toute animation en vol
    exoRun++;                      // stoppe un éventuel enchaînement auto
    const h = redoStack.pop()!;
    history.push({ board: clone(board), turn });
    exoStack.push(h.matched ?? false);
    if (h.matched) exoStep++;
    board = h.board; turn = h.turn;
    gameOver = false; selected = null; lastMove = null;
    sequences = playableMoves(board, turn);
    render(); updateUI(); exoRenderMenu(); exoRenderHints();
    status('↪ Coup rétabli');
    return;
  }
  if (!redoStack.length || aiThinking || animating) return;
  const h = redoStack.pop()!;
  history.push({ board: clone(board), turn });
  restore(h);
  if ($sel('mode').value === 'ai' && turn === 'b') aiMove();   // l'IA rejoue sa réponse
  else status('↪ Coup rétabli');
};
$sel('mode').onchange = init;
$sel('level').onchange = () => {
  if (!gameOver && turn === 'b' && $sel('mode').value === 'ai' && !aiThinking) aiMove();
};
$('flip').onclick = () => {
  boardEl.classList.toggle('flip');
  $('flip').textContent = boardEl.classList.contains('flip') ? '🔄 Remettre les Blancs en bas' : '🔄 Inverser le damier';
};

/* ---------- mode exercices : UI ---------- */
function exoShowPanel(show: boolean): void {
  ($('exoPanel') as HTMLElement).hidden = !show;
  ($('exoFab') as HTMLElement).hidden = !show;
  if (!show) $('exoMenuDrop').hidden = true;
}

/* ---------- 📚 bouton flottant menu → dropdown arborescent ---------- */
$('exoMenuBtn').onclick = () => {
  const drop = $('exoMenuDrop');
  drop.hidden = !drop.hidden;
};
document.addEventListener('pointerdown', (ev) => {
  const drop = $('exoMenuDrop');
  if (drop.hidden) return;
  if (!$('exoMenuFab').contains(ev.target as Node)) drop.hidden = true;
});

/* ---------- 💡 bouton flottant déplaçable (indice/solution) ---------- */
const fab = $('exoFab');
const fabTxt = $('exoFabTxt');
let fabDragging = false;
fab.addEventListener('pointerdown', (ev) => {
  if ((ev.target as HTMLElement).id === 'exoHintFab' || ev.target === fab) {
    fabDragging = false;
    fab.setPointerCapture(ev.pointerId);
    const r = fab.getBoundingClientRect();
    fab.dataset.dx = String(ev.clientX - r.left);
    fab.dataset.dy = String(ev.clientY - r.top);
  }
});
fab.addEventListener('pointermove', (ev) => {
  if (!fab.hasPointerCapture(ev.pointerId)) return;
  const dx = Number(fab.dataset.dx ?? 0), dy = Number(fab.dataset.dy ?? 0);
  const r = fab.getBoundingClientRect();
  const nl = ev.clientX - dx, nt = ev.clientY - dy;
  if (Math.abs(nl - r.left) > 6 || Math.abs(nt - r.top) > 6) fabDragging = true;
  if (!fabDragging) return;
  const w = r.width, h = r.height;
  fab.style.left = Math.min(Math.max(4, nl), window.innerWidth - w - 4) + 'px';
  fab.style.top = Math.min(Math.max(4, nt), window.innerHeight - h - 4) + 'px';
  fab.style.right = 'auto'; fab.style.bottom = 'auto';
});
fab.addEventListener('pointerup', (ev) => {
  if (!fab.hasPointerCapture(ev.pointerId)) return;
  fab.releasePointerCapture(ev.pointerId);
  if (fabDragging) { fabDragging = false; return; }   // c'était un déplacement
  // tap → révèle le prochain coup de la solution sur la bulle (ou masque la bulle)
  if (!fabTxt.hidden) { fabTxt.hidden = true; return; }
  if (exoLock || animating) return;
  if (exoStep >= exo().paths.length) {
    fabTxt.textContent = '💡 Plus de coup à révéler — à vous de conclure !';
    fabTxt.hidden = false; return;
  }
  exoHints++;
  exoRenderHints();
  exoRenderMenu();
  status(`💡 Coup n°${exoStep + 1} révélé — jouez-le (surligné dans le menu)`);
});

/* ---------- ⭐ favori : bouton du panneau exercice ---------- */
$('exoFav').onclick = () => exoToggleFav(exo().id);

/* ---------- 🖼 comparaison avec l'image extraite du livre ----------
 * Chaque exercice issu d'un PDF affiche la page scannée à côté du plateau.
 * ✓ Conforme ×2 (image ET corrigé) → l'image ne s'affiche plus.
 * ✍ Remarque → boîte de dialogue, stockée en localStorage, visible via 📋
 *   (copiable pour apporter les corrections ensuite). */
const CTRL_KEY = 'dames-exo-ctrl';
interface ExoCtrl { ok?: number; remarks?: string[] }
let exoCtrl: Record<string, ExoCtrl> = {};
try { exoCtrl = JSON.parse(localStorage.getItem(CTRL_KEY) ?? '{}'); } catch { exoCtrl = {}; }
function ctrlSave(): void { try { localStorage.setItem(CTRL_KEY, JSON.stringify(exoCtrl)); } catch { /* stockage indisponible */ } }
function ctrlOf(id: string): ExoCtrl { return exoCtrl[id] ?? (exoCtrl[id] = {}); }
/** Envoie la validation/remarque au service dames-ctrl (VPS) — suivi côté Correcteur. */
function ctrlSync(id: string): void {
  const c = exoCtrl[id];
  if (!c) return;
  try {
    void fetch('/exo-ctrl/', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ok: c.ok ?? 0, remarks: c.remarks ?? [] }) });
  } catch { /* hors ligne : la copie locale reste fiable */ }
}
// Au chargement : récupère les validations/remarques déjà envoyées (autre appareil/cache vidé)
// + les RÉSOLUTIONS annoncées par le Correcteur → bande déroulante rouge.
const RESLU_KEY = 'dames-resolus-vus';
let resolusVus: string[] = [];
try { resolusVus = JSON.parse(localStorage.getItem(RESLU_KEY) ?? '[]'); } catch { /* ignore */ }
try {
  void fetch('/exo-ctrl/').then(r => r.json()).then((srv: Record<string, ExoCtrl & { fix?: string }>) => {
    let maj = false;
    for (const [id, c] of Object.entries(srv)) {
      if (id.startsWith('_')) continue;
      const loc = ctrlOf(id);
      if ((c.ok ?? 0) > (loc.ok ?? 0)) { loc.ok = c.ok; maj = true; }
      if (c.remarks?.length && !loc.remarks?.length) { loc.remarks = c.remarks; maj = true; }
    }
    ctrlSave();
    // Bande déroulante rouge : « ✅ Remarque résolue … »
    const resolus = srv._resolus as { key: string; id: string; fix: string }[] | undefined;
    if (Array.isArray(resolus)) {
      const news = resolus.filter(r => !resolusVus.includes(r.key));
      if (news.length) exoShowBandeau(news);
    }
    if (maj && exoMode()) exoUpdateImg();
  }).catch(() => { /* service indisponible */ });
} catch { /* ignore */ }

/** Bande déroulante rouge en haut de l'écran : signale les remarques résolues. */
function exoShowBandeau(news: { key: string; id: string; fix: string }[]): void {
  const b = $('exoBandeau'), t = $('exoBandeauTxt');
  t.textContent = ' ✅ ' + news.map(r => `Remarque résolue — ${r.id} : ${r.fix}`).join('  ··  ') + ' ';
  b.hidden = false;
  resolusVus = [...resolusVus, ...news.map(r => r.key)];
  try { localStorage.setItem(RESLU_KEY, JSON.stringify(resolusVus)); } catch { /* ignore */ }
  const x = document.createElement('button');
  x.className = 'fermer'; x.textContent = '✕'; x.title = 'Masquer';
  x.onclick = () => { b.hidden = true; };
  b.appendChild(x);
}

function exoUpdateImg(): void {
  const box = $('exoImgBox');
  const url = EXO_IMG[exo().id];
  const show = exoMode() && !!url && (ctrlOf(exo().id).ok ?? 0) < 1;
  box.hidden = !show;
  if (!show) return;
  ($('exoImg') as HTMLImageElement).src = url;
  $('exoImgTitle').textContent = `🖼 Diagramme du livre — ${exo().id}`;
  const c = ctrlOf(exo().id);
  const flagged = !!c.remarks?.length;
  box.classList.toggle('flagged', flagged);
  $('exoImgState').textContent = flagged
    ? `🚩 ${c.remarks!.length} remarque(s)`
    : c.ok ? `✓ validé ${c.ok}/2` : '';
}

$('exoImgOk').onclick = () => {
  const id = exo().id;
  const c = ctrlOf(id);
  c.ok = (c.ok ?? 0) + 1; ctrlSave(); ctrlSync(id);
  if (c.ok >= 1) {
    $('exoImgBox').hidden = true;
    status('🖼✅ Conformité validée — la comparaison ne s\'affichera plus pour cet exercice (📚 pour en choisir un autre).');
  } else exoUpdateImg();
};
$('exoImgKo').onclick = () => {
  $('exoRemarkId').textContent = `exercice ${exo().id}`;
  ($('exoRemarkTxt') as HTMLTextAreaElement).value = ctrlOf(exo().id).remarks?.join('\n———\n') ?? '';
  ($('exoRemark') as HTMLDialogElement).showModal();
};
$('exoRemarkSave').onclick = () => {
  const txt = ($('exoRemarkTxt') as HTMLTextAreaElement).value.trim();
  ($('exoRemark') as HTMLDialogElement).close();
  if (txt) {
    ctrlOf(exo().id).remarks = [txt]; ctrlSave(); ctrlSync(exo().id);
    exoUpdateImg();
    status('🚩 Remarque enregistrée et envoyée pour correction (📋 pour la relire).');
  }
};
$('exoImg').onclick = () => {
  ($('exoZoomImg') as HTMLImageElement).src = ($('exoImg') as HTMLImageElement).src;
  ($('exoZoom') as HTMLDialogElement).showModal();
};
const remarkIds = (): string[] => Object.keys(exoCtrl).filter(id => exoCtrl[id].remarks?.length);
$('exoImgList').onclick = () => {
  const box = $('exoRemarkListBox'); box.innerHTML = '';
  const ids = remarkIds();
  if (!ids.length) box.textContent = 'Aucune remarque enregistrée.';
  for (const id of ids) for (const r of exoCtrl[id].remarks!) {
    const p = document.createElement('p');
    p.textContent = `• ${id} : ${r}`;
    box.appendChild(p);
  }
  ($('exoRemarkList') as HTMLDialogElement).showModal();
};
$('exoRemarkCopy').onclick = () => {
  const payload = JSON.stringify(Object.fromEntries(remarkIds().map(id => [id, exoCtrl[id].remarks])), null, 1);
  navigator.clipboard.writeText(payload).then(
    () => status('📋 Remarques copiées — collez-les dans la conversation pour correction.'),
    () => status('⚠️ Copie impossible — relevez les remarques affichées dans la boîte.'));
};

/* ---------- 🔁 Repeat : la solution se rejoue en boucle après chaque réussite ---------- */
$('exoRepeat').onclick = () => {
  exoRepeat = !exoRepeat;
  $('exoRepeat').classList.toggle('on', exoRepeat);
  $('exoRepeat').title = exoRepeat ? 'Désactiver la répétition en boucle' : 'Répéter la solution en boucle (repart après chaque réussite)';
  status(exoRepeat
    ? '🔁 Repeat activé — après chaque réussite, la solution repart automatiquement (⏸ pour arrêter)'
    : '🔁 Repeat désactivé');
};

/* ---------- gestes : swipe gauche/droite (mobile) + double-clic coins (PC) ---------- */
let gX0 = 0, gY0 = 0, gT0 = 0;
boardEl.addEventListener('touchstart', (e) => {
  const t = e.touches[0]; gX0 = t.clientX; gY0 = t.clientY; gT0 = Date.now();
}, { passive: true });
boardEl.addEventListener('touchend', (e) => {
  const t = e.changedTouches[0];
  const dx = t.clientX - gX0, dy = t.clientY - gY0;
  if (Date.now() - gT0 > 900) return;
  if (Math.abs(dx) < 50 || Math.abs(dx) < 1.6 * Math.abs(dy)) return;
  if (dx < 0) ($('undo') as HTMLButtonElement).click();   // balayage ← : revenir
  else ($('redo') as HTMLButtonElement).click();          // balayage → : rétablir
}, { passive: true });
boardEl.addEventListener('dblclick', (e) => {
  const r = boardEl.getBoundingClientRect();
  const x = e.clientX - r.left;
  if (x < r.width * 0.18) ($('undo') as HTMLButtonElement).click();        // coin gauche
  else if (x > r.width * 0.82) ($('redo') as HTMLButtonElement).click();   // coin droit
});

$('exoPrev').onclick = () => { if (!exoLock && !animating) exoLoad(exoIndex - 1); };
$('exoNext').onclick = () => { if (!exoLock && !animating) exoLoad(exoIndex + 1); };
$('exoReset').onclick = () => { if (!exoLock && !animating) exoReset(); };
/* ---------- ▶ Solution auto : rejoue toute la combinaison, ⏸ Stop pour reprendre la main ---------- */
const exoSolBtn = $('exoSolution') as HTMLButtonElement;
function exoAutoUI(): void {
  exoSolBtn.textContent = exoAuto > 0 ? '⏸ Stop' : '▶ Solution auto';
  exoSolBtn.title = exoAuto > 0 ? 'Arrêter l\'enchaînement et jouer librement' : 'Rejouer la combinaison complète automatiquement';
}
exoSolBtn.onclick = () => {
  if (animating) return;
  if (exoAuto > 0) {
    // ⏸ Stop : on garde la position telle quelle et on rend la main immédiatement.
    exoAuto = 0; exoRun++;
    exoRepeat = false; $('exoRepeat').classList.remove('on');
    exoLock = false; exoAutoMove = false;
    sequences = playableMoves(board, turn);
    exoAutoUI(); updateUI(); exoRenderMenu(); exoRenderHints();
    status('⏸ Enchaînement arrêté — à vous de jouer (jeu libre)');
    return;
  }
  if (exoLock) return;
  const e = exo();
  $('exoSol').textContent = 'Solution : ' + e.solTxt;
  $('exoSol').hidden = false;
  exoReset();
  exoAuto = e.paths.length;        // tout le reste de la combinaison est joué automatiquement
  exoAutoUI();
  exoSchedule();
};

$sel('mode').addEventListener('change', () => exoShowPanel(exoMode()));

init();
exoBuildMenu();   // menu flottant 📚 visible dès l'ouverture, même hors mode exercice
