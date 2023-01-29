import { Term } from './Term';
import { Combinator, CombinatorGenerator } from './Combinator';

/**
 * A Roll is a combination of several dice groups, combinators, and constants
 */
export class Roll implements Term {
  min: number;
  max: number;
  average: number;
  count: number;
  current: number[];
  roller: () => number;
  terms: Term[];
  generators: CombinatorGenerator[];
  combinators: Combinator[];
  // The execution tree which when provided a function creates the derived stats
  tree: (method: string, isCallable: boolean) => number;
  hasRolled: boolean;

  // create a Roll with a set of terms and combinator generators
  constructor(terms: Term[], generators: CombinatorGenerator[]) {
    this.terms = terms;

    this.generators = generators;
    // the number of combinators should be 1 less than the number of terms
    // TODO validate that this is the case
    this.current = [];
    this.combinators = [];
    // construct the tree for this roll. A tree should be used to generate
    // statistics about the parts of the roll
    this.tree = (method, isCallable) => {
      return this.terms.reduce((acc, current) => {
        if (isCallable) {
          return (acc += current[method]());
        } else {
          return (acc += current[method]);
        }
      }, 0);
    };

    this.count = this.tree('count', false);
    this.average = this.tree('average', false);
    this.min = this.tree('min', false);
    this.max = this.tree('max', false);
    // create the combinators for this group
    this.generators.map((curr, i) => {
      // if this is the first roll, then roll the first die, otherwise the
      // left-hand side of the current combinator is the result of the last
      // combinator, which lags the generator list by 1.
      const left = i === 0 ? this.terms[0].roll : this.combinators[i].apply;
      // The current term is 1 after the current
      const combinator = curr(left, this.terms[i + 1].roll);
      this.combinators = this.combinators.concat(combinator);
    });
    this.hasRolled = false;
  }

  // Roll the dice an give a result
  roll() {
    return this.rollGroup()[0];
  }

  // Roll all dice, and return the results.
  rollGroup() {
    const result = this.combinators[this.combinators.length - 1].apply();
    const groupResults = this.terms.flatMap((element) => {
      return element.current.slice(1);
    });
    this.hasRolled = true;
    return [result].concat(groupResults);
  }
}
