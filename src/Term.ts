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

export interface Term {
  roll: () => number;
  rollGroup: () => number[];
  // If this dice term has a number of dice, then this should contain that
  // count.
  current: number[];
  // organize the term's statistical properties in a sub object to make tree-ing
  // easier, and quiet the TS engine
  // TODO: add percentile stats
  statProps: {
    count: number;
    average: number;
    min: number;
    max: number;
    [key: string]: any;
  };
}
