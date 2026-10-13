import { EXOS_THEMES } from './exos-gen';
/* ============================================================
 * Exercices « Coups de Dame » — Cours de jeu, 3ᵉ partie, ch. 21
 * Source : jeudedames.toulouse.free.fr (PDF 24775), transcrit puis
 * VALIDÉ au moteur (règles FID, prise majoritaire) : chaque solution
 * se rejoue légalement et se termine par une dame blanche.
 * Convention cases 1-50 : Noirs 1-20 (haut), Blancs 31-50 (bas),
 * case 1 = case foncée en haut à gauche.
 * `paths` = solution demi-coup par demi-coup ; une rafle est la liste
 * COMPLÈTE de ses cases d'arrivée (le chemin exact est imposé car les
 * variantes de rafle ne gardent pas toutes le gain).
 * ============================================================ */
export interface Exo {
  id: string; cat: string; goal: 'dame' | 'mat' | 'gain';
  /** camp au trait au départ ('w' par défaut). */
  trait?: 'b' | 'w';
  b: number[]; w: number[]; paths: number[][]; solTxt: string; note?: string;
  /** dames au départ (optionnel) : bd = dames noires, wd = dames blanches. */
  bd?: number[]; wd?: number[];
}

/** case 1-50 → (r,c), r=0 en haut. Foncée : (r+c) pair — case 1 = 1ʳᵉ foncée de la rangée (coin haut-gauche clair, cas 46 foncée). */
export function caseToRc(n: number): [number, number] {
  const r = Math.floor((n - 1) / 5);
  const k = (n - 1) % 5;
  const cols = [0,1,2,3,4,5,6,7,8,9].filter(c => (r + c) % 2 === 1);
  return [r, cols[k]];
}

/** (r,c) → case 1-50 (inverse de caseToRc). */
export function rcToCase(r: number, c: number): number {
  const cols = [0,1,2,3,4,5,6,7,8,9].filter(x => (r + x) % 2 === 1);
  return r * 5 + cols.indexOf(c) + 1;
}


/* v20 : seuls les exercices SOURCÉS des PDF (avec image extraite) sont gardés.
 * Les anciens blocs sans image extraite (EXOS_DAME, MATEXOS, EXOS_MARCHAND,
 * EXOS_AILE) ont été retirés — historique dans git. */
export const EXOS: Exo[] = [...EXOS_THEMES];
