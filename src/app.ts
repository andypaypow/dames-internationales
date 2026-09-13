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
import { pickAiMove } from './ia';
import { EXOS, caseToRc, rcToCase, type Exo } from './exercices';
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
let lastMove: Move | null = null;   // dernier coup joué (surbrillance départ + arrivée)

/* ---------- mode exercices (Coups de Dame) ---------- */
let exoIndex = 0;      // exercice courant
let exoStep = 0;       // nombre de demi-coups de la solution déjà joués
let exoAuto = 0;       // >0 : enchaînement automatique de la solution (replay)
let exoLock = false;   // verrou pendant l'attente d'un coup automatique
let exoAutoMove = false;  // le coup en cours d'évaluation a été joué automatiquement (réponse de la solution)
let exoGen = 0;           // génération d'exercice : invalide les coups automatiques programmés avant un chargement
let exoStack: boolean[] = [];  // par coup joué : faisait-il partie de la solution ?
let exoHints = 0;      // nombre d'indices révélés
let exoMenuMoves: Move[] = []; // coups légaux du menu

const exoMode = (): boolean => $sel('mode').value === 'exo';
const exo = (): Exo => EXOS[exoIndex];

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
  turn = e.trait ?? 'w';
  sequences = playableMoves(board, turn);   // jeu libre : tout le damier est jouable
  render(); updateUI();
  exoRenderMenu();
  const qui = turn === 'w' ? 'Blancs' : 'Noirs';
  status(exo().goal === 'mat'
    ? '⚪ Aux Blancs de jouer — bloque les Noirs jusqu’au mat !'
    : exo().goal === 'gain'
    ? `⚪ Aux ${qui} de jouer — trouvez la combinaison gagnante !`
    : '⚪ Aux Blancs de jouer — trouvez la combinaison qui fait une dame !');
}

function exoSchedule(): void {
  const path = exo().paths[exoStep];
  const gen = exoGen;
  exoLock = true;
  setTimeout(() => {
    if (gen !== exoGen) return;   // l'exercice a changé entre-temps : coup abandonné
    const mv = exoFindMove(path);
    if (mv) { exoAutoMove = true; void playMove(mv); return; }
    exoLock = false; exoAuto = 0; exoAutoMove = false;
    status('⚠️ Désynchronisé — ⏮ Départ');
  }, 700);
}

function exoSuccess(): void {
  exoAuto = 0; exoLock = false;
  sequences = []; exoRenderMenu();
  updateUI();
  const ok = exo().goal === 'mat' ? 'Adversaire bloqué — mat' : exo().goal === 'gain' ? 'Combinaison réalisée' : 'Dame réalisée';
  status(`🎉 Bravo ! ${ok} — exercice ${exo().goal === 'mat' ? 'M' : exo().goal === 'gain' ? 'G' : 'C'} ${exo().id} réussi.`);
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
    if (exoStep >= exo().paths.length) { exoSuccess(); return; }
    if (exoAuto > 0) { exoAuto--; exoSchedule(); return; }
    status(`🤖 ${turn === 'w' ? 'Noirs' : 'Blancs'} répondent ${fmtPath(expected)} — à vous de continuer`);
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
  } else {
    status(`⚠️ ${fmtPath([from, to])} s'écarte de la solution — jeu libre, ↩ pour revenir`);
  }
  sequences = playableMoves(board, turn);
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
      if (s.cap) {
        // la pièce sautée s'efface, puis disparaît du plateau
        const el = (boardEl.children[s.cap.r * N + s.cap.c] as HTMLElement).querySelector('.piece');
        el?.classList.add('taken');
        await wait(170);
        work[s.cap.r][s.cap.c] = null;
        board = clone(work); render();
      }
      cur = [s.r, s.c];
      await wait(180);
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

function aiMove(): void {
  if (gameOver) return;
  aiThinking = true; status("🤖 L'ordinateur réfléchit…");
  setTimeout(() => {
    const depth = +$sel('level').value;
    const m = pickAiMove(board, depth);
    if (!m) { aiThinking = false; checkEnd(); return; }
    void playMove(m);   // rafle animée pion après pion
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
  if (exoMode()) { exoLoad(exoIndex); return; }
  board = initBoard();
  turn = 'b'; selected = null; history = []; redoStack = []; gameOver = false; aiThinking = false; animating = false; lastMove = null;
  sequences = playableMoves(board, turn);
  render(); status('⚫ Les Noirs commencent — à vous de jouer');
  if ($sel('mode').value === 'ai') aiMove();
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
    else { // début de partie : les Noirs (IA) recommencent, rien à rétablir
      redoStack = []; status('⚫ Les Noirs commencent — à vous de jouer');
      aiMove(); return;
    }
  }
  status('↩ Coup annulé');
};
$('redo').onclick = () => {
  if (exoMode()) {
    if (!redoStack.length || animating || exoLock) return;
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
$('exoSolution').onclick = () => {
  if (exoLock || animating) return;
  const e = exo();
  $('exoSol').textContent = 'Solution : ' + e.solTxt;
  $('exoSol').hidden = false;
  exoReset();
  exoAuto = e.paths.length;        // tout le reste de la combinaison est joué automatiquement
  exoSchedule();
};
$sel('mode').addEventListener('change', () => exoShowPanel(exoMode()));

init();
exoBuildMenu();   // menu flottant 📚 visible dès l'ouverture, même hors mode exercice
