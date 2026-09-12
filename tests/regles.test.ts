import { describe, it, expect } from 'vitest';
import {
  N, initBoard, allMoves, applyMove, capturesFrom,
  type Board, type Col, type Move
} from '../src/regles';

/** Plateau vide. */
const vide = (): Board => Array.from({ length: N }, () => Array(N).fill(null));

/** Place un pion/dame. */
const place = (b: Board, r: number, c: number, col: Col, k = false) => { b[r][c] = { col, k }; };

describe('Position initiale', () => {
  it('contient 20 pions par camp sur cases sombres', () => {
    const b = initBoard();
    const flat = b.flat();
    expect(flat.filter(p => p?.col === 'b')).toHaveLength(20);
    expect(flat.filter(p => p?.col === 'w')).toHaveLength(20);
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++)
      if (b[r][c]) expect((r + c) % 2).toBe(1);
  });

  it('donne 9 coups initiaux aux Noirs (rangs 0-3 bloqués, seuls les pions de r=3 bougent)', () => {
    const { captures, quiet } = allMoves(initBoard(), 'b');
    expect(captures).toHaveLength(0);
    expect(quiet).toHaveLength(9);
  });

  it("les Blancs n'ont que des déplacements calmes à l'initiale (les Noirs commencent)", () => {
    const { captures, quiet } = allMoves(initBoard(), 'w');
    expect(captures).toHaveLength(0);
    expect(quiet).toHaveLength(9);
  });
});

describe('Prise obligatoire et majoritaire', () => {
  it('aucun déplacement calme si une capture existe', () => {
    const b = vide();
    place(b, 5, 4, 'b');          // pion noir
    place(b, 4, 3, 'w');          // pion blanc capturable (diag avant de 5,4)
    place(b, 0, 2, 'b');          // autre pion noir : déplacement calme possible
    const { captures, quiet } = allMoves(b, 'b');
    expect(captures.length).toBeGreaterThan(0);
    expect(quiet).toHaveLength(0);
  });

  it('ne propose que les prises majoritaires (2 pions > 1 pion)', () => {
    const b = vide();
    place(b, 5, 4, 'b');
    // capture simple : blanc en (4,3), atterrissage (3,2)
    place(b, 4, 3, 'w');
    // capture double : blanc (4,5) — atterrissage (3,6) — puis blanc (2,5) — atterrissage (1,4)
    place(b, 4, 5, 'w');
    place(b, 2, 5, 'w');
    const { captures } = allMoves(b, 'b');
    expect(captures.length).toBeGreaterThan(0);
    // seule la rafle de 2 doit être proposée
    expect(captures.every(m => m.path.length === 2)).toBe(true);
    // le chemin passe par la case du pion noir (5,4)
    expect(captures.every(m => m.from[0] === 5 && m.from[1] === 4)).toBe(true);
  });

  it('le pion capture aussi vers l\u2019arrière', () => {
    const b = vide();
    place(b, 5, 4, 'b');
    place(b, 6, 5, 'w'); // blanc "derrière" le pion noir (vers r croissant)
    const { captures } = allMoves(b, 'b');
    expect(captures).toHaveLength(1);
    expect(captures[0].path[0]).toEqual({ r: 7, c: 6, cap: { r: 6, c: 5 } });
  });

  it('on ne peut pas capturer deux fois la même pièce (dame volante)', () => {
    const b = vide();
    place(b, 0, 1, 'b', true);   // dame noire en coin
    place(b, 3, 4, 'w');         // seule pièce blanche sur la grande diagonale
    const seqs = capturesFrom(b, 0, 1, b[0][1]!, []);
    // aucune séquence ne doit repasser capturer (3,4) deux fois
    for (const s of seqs) {
      const caps = s.path.map(p => p.cap).filter(Boolean);
      const keys = caps.map(c => `${c!.r},${c!.c}`);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
});

describe('Déplacements et promotion', () => {
  it('le pion avance d\u2019une case en diagonale vers l\u2019avant uniquement', () => {
    const b = vide();
    place(b, 5, 4, 'b');
    const { quiet } = allMoves(b, 'b');
    const dests = quiet.map(m => m.path[0]).sort((a, z) => a.c - z.c);
    expect(dests).toEqual([{ r: 6, c: 3, cap: null }, { r: 6, c: 5, cap: null }]);
  });

  it('la dame se déplace à distance dans les 4 diagonales', () => {
    const b = vide();
    place(b, 0, 1, 'b', true);
    const { quiet } = allMoves(b, 'b');
    expect(quiet.length).toBeGreaterThan(4); // plusieurs cases par diagonale
    expect(quiet.every(m => m.path.length === 1)).toBe(true);
  });

  it('promotion en dame si le pion s\u2019arrête sur la dernière rangée', () => {
    const b = vide();
    place(b, 8, 3, 'b');
    const m: Move = { from: [8, 3], path: [{ r: 9, c: 4, cap: null }], board: null };
    const nb = applyMove(b, m);
    expect(nb[9][4]).toEqual({ col: 'b', k: true });
  });

  it('promotion via capture : pion blanc atterrissant rangée 0 devient dame', () => {
    const b = vide();
    place(b, 2, 4, 'w');
    place(b, 1, 5, 'b');
    const { captures } = allMoves(b, 'w');
    expect(captures).toHaveLength(1); // prise forcée (1,5) → (0,6)
    const nb = applyMove(b, captures[0]);
    expect(nb[0][6]).toEqual({ col: 'w', k: true });
    expect(nb[1][5]).toBeNull();
  });
});

describe('applyMove', () => {
  it('retire les pièces capturées le long du chemin', () => {
    const b = vide();
    place(b, 5, 4, 'b');
    place(b, 4, 3, 'w');
    const { captures } = allMoves(b, 'b');
    const nb = applyMove(b, captures[0]);
    expect(nb[4][3]).toBeNull();
    expect(nb[3][2]).toEqual({ col: 'b', k: false });
    expect(nb[5][4]).toBeNull();
  });

  it('ne mute pas le plateau d\u2019origine', () => {
    const b = vide();
    place(b, 5, 4, 'b');
    place(b, 4, 3, 'w');
    const { captures } = allMoves(b, 'b');
    applyMove(b, captures[0]);
    expect(b[4][3]).toEqual({ col: 'w', k: false });
    expect(b[5][4]).toEqual({ col: 'b', k: false });
  });
});
