import { DiceTerm } from './DiceTerm';
import { Term } from './Term';

/**
 * Modifiers change how dice behave based on their results
 * Simple examples include the "Drop" and "Keep" modifiers drop or keep the
 * lowest results of a roll.
 *
 * Modifiers often change the average, min, and maximum of the base roll
 * Modifiers can change the total number of dice.
 * Modifiers also act as Terms.
 */

export interface Modifier extends Term {
  name: string;
  base: DiceTerm;
  // TODO: consider whether or not we will save all possible rolls?
  // for instance, w/ a drop roll we may want to show the original roll
  baseResults: number[];
}
