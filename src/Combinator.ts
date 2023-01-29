import { StatisticalGenerator } from './StatisticalGenerator';
/**
 * A combinator combines two terms in a consistent way
 * basic examples are + and -
 * Combinators are always dyadic, and therefore need left and right-hand sides
 */
// NOTE: consider rewording this to 'operators', cspell does not like the word
// 'combinator', and it also implies that it can only take functions (which it
// technically does).

export interface Combinator extends StatisticalGenerator {
  name: string;
  left: StatisticalGenerator;
  right: StatisticalGenerator;
  // decide whether or not we use value or apply... currently there's not much need for both
  apply: () => number;
  inverse: (x: number, y: number) => number;
}

export type CombinatorGenerator = (left: StatisticalGenerator, right: StatisticalGenerator) => Combinator;
