import { StatisticalGenerator } from './StatisticalGenerator';

/**
 * A Term is a distinct part of a Dice expression.
 *
 * Each term has a generator which can be invoked during a 'roll'
 *
 * roll():
 *   a parameterless function which returns a number
 *
 * rollGroup():
 *   a parameterless function which returns a list of numbers. The first result
 *   is always the sum, or the result that would have been returned if they would
 *   have been invoked by the roll() function.
 */

export interface Term extends StatisticalGenerator {
  roll: () => number;
  rollGroup: () => number[];
  // this will often be a mirror of roll
  value: () => number;
  // If this dice term has a number of dice, then this should contain that
  // count.
  current: number[];
}
