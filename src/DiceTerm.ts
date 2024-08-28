import { Term } from 'Term';
import { StatisticalGenerator } from 'StatisticalGenerator';

/**
 * A Dice term is a term that includes rolling dice.
 * Some modifiers or functions act on the fact that dice are in-play
 * (drop / keep)
 */

export interface DiceTerm extends Term {
  sides: StatisticalGenerator;
  // for things like polyDice, this interface interacts with modifiers
  currentSides: number;
  count: StatisticalGenerator;
  currentCount: number;
}
