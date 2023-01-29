import { Term } from './Term';

/**
 * A Dice term is a term that includes rolling dice.
 * Some modifiers or functions act on the fact that dice are in-play
 */

export interface DiceTerm extends Term {
  sides: number;
}
