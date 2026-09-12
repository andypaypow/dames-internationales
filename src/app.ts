/* ============================================================
 * Couche UI — rendu DOM, interactions, modes de jeu.
 * Aucune règle de jeu ici : tout passe par regles.ts / ia.ts.
 *
 * Sélection :
 *  - clic sur un pion avec UNE seule possibilité → coup joué directement ;
 *  - sinon, les destinations FINALES sont marquées : cliquer l'une d'elles
 *    joue la séquence complète (rafle entière en un clic).
 * ============================================================ */
import { N, initBoard, clone, allMoves, playableMoves, applyMove, type Board, type Col, type Move } from './regles';
import { pickAiMove } from './ia';
import './style.css';

const boardEl = document.getElementById('board') as HTMLElement;
const $ = (id: string): HTMLElement => document.getElementById(id)!;
const $sel = (id: string): HTMLSelectElement => document.getElementById(id) as HTMLSelectElement;

let board: Board;
let turn: Col;
let selected: [number, number] | null = null;
let sequences: Move[] = [];
let history: { board: Board; turn: Col }[] = [];
let gameOver = false;
let aiThinking = false;
let animating = false;

const wait = (ms: number): Promise<void> => new Promise(res => setTimeout(res, ms));

function status(t: string): void { $('status').textContent = t; }

/** Coups légaux du pion (r,c). */
const movesOf = (r: number, c: number): Move[] =>
  sequences.filter(m => m.from[0] === r && m.from[1] === c);

function render(): void {
  boardEl.innerHTML = '';
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const sq = document.createElement('div');
    sq.className = 'sq ' + ((r + c) % 2 ? 'dark' : 'light');
    sq.dataset.r = String(r); sq.dataset.c = String(c);
    const n = document.createElement('span'); n.className = 'num'; n.textContent = String(r * N + c + 1); sq.appendChild(n);
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

/** Marque le pion sélectionné + ses destinations FINALES (case d'arrivée de chaque séquence). */
function highlight(): void {
  document.querySelectorAll('.sq').forEach(s => s.classList.remove('sel', 'move', 'capt-land'));
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
  board = initBoard();
  turn = 'b'; selected = null; history = []; gameOver = false; aiThinking = false; animating = false;
  sequences = playableMoves(board, turn);
  render(); status('⚫ Les Noirs commencent — à vous de jouer');
  if ($sel('mode').value === 'ai') aiMove();
}

$('new').onclick = init;
$('undo').onclick = () => {
  if (!history.length || aiThinking || animating) return;
  const h = history.pop()!; board = h.board; turn = h.turn;
  gameOver = false; selected = null; sequences = playableMoves(board, turn);
  ($('end') as HTMLDialogElement).close();
  render(); status('↩ Coup annulé');
  if ($sel('mode').value === 'ai' && turn === 'b') aiMove();
};
$sel('mode').onchange = init;
$sel('level').onchange = () => {
  if (!gameOver && turn === 'b' && $sel('mode').value === 'ai' && !aiThinking) aiMove();
};
$('flip').onclick = () => {
  boardEl.classList.toggle('flip');
  $('flip').textContent = boardEl.classList.contains('flip') ? '🔄 Remettre les Blancs en bas' : '🔄 Inverser le damier';
};

init();
