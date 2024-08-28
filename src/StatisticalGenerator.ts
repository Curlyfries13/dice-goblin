/**
 * A Statistical Generator has a generator with well defined statistical properties.
 */

import { StatProps } from './StatProps';

export interface StatisticalGenerator {
  // TODO: (BIG) consider whether or not a values generator is a good idea
  // this is necessary for dice which don't start @ 1, or more complicated multinomials
  // values: Generator<number, void, unknown>;
  statProps: StatProps;
  // the number of ways this generator can generate values
  // e.g. for a d6, it is 6, for a constant it is 1, for 2d6 it is 36
  combinatoricMagnitude: number;

  // produce a value from this generator
  value: () => number;
  // the decimal probability of an outcome "value"
  pdf: (value: number) => number;
  // this is the number of ways this value can be created
  multinomial: (value: number) => number;
}
