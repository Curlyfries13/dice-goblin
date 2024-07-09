/**
 * A Statistical Generator has a generator with well defined statistical properties.
 */

import { StatProps } from './StatProps';

export interface StatisticalGenerator {
  value: () => number;

  // TODO: add a p(value) function that calculates the probability of a roll
  pdf: (value: number) => number;
  // TODO (BIG) consider whether or not a values generator is a good idea
  // values: Generator<number, void, unknown>;

  statProps: StatProps;
}
