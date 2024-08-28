import { Combinator, CombinatorGenerator } from '../Combinator';
import { StatisticalGenerator } from '../StatisticalGenerator';
import { convolution } from '../utils';
/*
 * The subtract combinator is another simple combinator
 */
export default class Subtract implements Combinator {
  name = 'add';

  left: StatisticalGenerator;

  right: StatisticalGenerator;

  value: () => number;

  statProps: {
    min: number;
    max: number;
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
      min: left.statProps.min - right.statProps.max,
      max: left.statProps.max - right.statProps.min,
      periodicity: Math.max(left.statProps.periodicity, right.statProps.periodicity),
      average: left.statProps.average - right.statProps.average,
    };
    this.value = this.apply;
    this.combinatoricMagnitude = left.combinatoricMagnitude * right.combinatoricMagnitude;
    this.inverse = (x: number, y: number) => x + y;
    this.pdf = (value: number) => convolution(value, left, right, this.inverse, 'pdf');
    this.multinomial = (value: number) =>
      convolution(value, left, right, this.inverse, 'multinomial');
  }

  apply() {
    return this.left.value() - this.right.value();
  }
}

export const SubtractGenerator: CombinatorGenerator = (left, right) => new Subtract(left, right);
