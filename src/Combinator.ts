/**
 * A combinator combines two terms in a consistent way
 * basic examples are + and -
 * Combinators are always dyadic, and therefore need left and right-hand sides
 */
// NOTE: consider rewording this to 'operators', cspell does not like the word
// 'combinator', and it also implies that it can only take functions (which it
// technically does).

// This Input type is convenient for letting rolling functions handle
// themselves. In this scheme the combinator's application can simply call the
// left and right-hand side of its inputs
export type CombinatorInput = () => number;

export interface Combinator {
  name: string;
  left: CombinatorInput;
  right: CombinatorInput;
  apply: () => number;
}

export type CombinatorGenerator = (left: CombinatorInput, right: CombinatorInput) => Combinator;
