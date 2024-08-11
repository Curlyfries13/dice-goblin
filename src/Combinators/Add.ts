import { Combinator, CombinatorGenerator } from '../Combinator';
import { StatisticalGenerator } from '../StatisticalGenerator';
import { convolution } from '../utils';
// TODO: I'm not a fan of relative imports, I'd like to fix the typescript config

/*
 * The add combinator is one of the simplest combinators
 */
export default class Add implements Combinator {
  name = 'add';
  left: StatisticalGenerator;
  right: StatisticalGenerator;
  value: () => number;
  statProps: {
    min: number;
    max: number;
    // we can expect this to be the maximum periodicity
    periodicity: number;
    average: number;
  };
  combinatoricMagnitude: number;
  inverse: (x: number, y: number) => number;
  pdf: (value: number) => number;
  multinomial: (value: number) => number;

  constructor(left: StatisticalGenerator, right: StatisticalGenerator) {
    this.left = left;
    this.right = right;
    this.statProps = {
      min: left.statProps.min + right.statProps.min,
      max: left.statProps.max + right.statProps.max,
      periodicity: Math.max(left.statProps.periodicity, right.statProps.periodicity),
      average: left.statProps.average + right.statProps.average,
    };
    this.value = this.apply;
    this.combinatoricMagnitude = left.combinatoricMagnitude * right.combinatoricMagnitude;
    this.inverse = (x: number, y: number) => {
      return x - y;
    };
    // TODO: determine if pdf here is more efficient, or multinomial is more efficient
    this.pdf = (value: number) => {
      return convolution(value, left, right, this.inverse, 'pdf');
    };
    // TODO: determine if there's an efficient way to get this info
    this.multinomial = (value: number) => {
      return convolution(value, left, right, this.inverse, 'multinomial');
    };
  }

  apply() {
    return this.left.value() + this.right.value();
  }
}

export const AddGenerator: CombinatorGenerator = (left, right) => new Add(left, right);
