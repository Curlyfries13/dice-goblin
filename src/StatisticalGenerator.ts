/**
 * A Statistical Generator has a generator with well defined statistical properties.
 */

import { StatProps } from './StatProps';

/* use in conjunction with CDF
export enum CDF_DIRECTION {
  NEGATIVE,
  POSITIVE,
}
*/

export interface StatisticalGenerator {
  value: () => number;

  // TODO: add a name, or generator that might make it easier to memoize
  pdf: (value: number) => number;
  // get the multinomial coefficient for this group
  // this is the number of ways this value can be created
  multinomial: (value: number) => number;
  // cdf: (value: number, direction: CDF_DIRECTION) => number;

  // TODO: (BIG) consider whether or not a values generator is a good idea
  // values: Generator<number, void, unknown>;
  // NOTE: Adding a values generator would be necessary for the dynamic programming algorithm.
  // TODO: (BIG) add memoization

  statProps: StatProps;
  // the number of ways this generator can generate values
  // e.g. for a d6, it is 6, for a constant it is 1, for 2d6 it is 36
  combinatoricMagnitude: number;
}
