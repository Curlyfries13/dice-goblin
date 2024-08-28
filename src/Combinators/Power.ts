import { Combinator, CombinatorGenerator } from '../Combinator';
import { StatisticalGenerator } from '../StatisticalGenerator';
import { convolution } from '../utils';

export default class Power implements Combinator {
  name = 'multiply';

  left: StatisticalGenerator;

  right: StatisticalGenerator;

  value: () => number;

  statProps: {
    min: number;
    max: number;
    average: number;
    periodicity: number;
  };

  combinatoricMagnitude: number;

  inverse: (x: number, y: number) => number;

  pdf: (value: number) => number;

  multinomial: (value: number) => number;

  constructor(left: StatisticalGenerator, right: StatisticalGenerator) {
    this.left = left;
    this.right = right;
    this.combinatoricMagnitude = left.combinatoricMagnitude * right.combinatoricMagnitude;
    this.statProps = {
      min: left.statProps.min ** right.statProps.min,
      max: left.statProps.max ** right.statProps.max,
      // TODO: this is (specifically) wrong
      average: left.statProps.average ** right.statProps.average,
      // this does not work... Power series don't have a
      periodicity: left.statProps.max ** right.statProps.max,
    };
    this.value = this.apply;
    this.inverse = (x: number, y: number) => x ** (1.0 / y);
    this.pdf = (value: number) => convolution(value, left, right, this.inverse, 'pdf');
    this.multinomial = (value: number) =>
      convolution(value, left, right, this.inverse, 'multinomial');
  }

  apply() {
    return this.left.value() ** this.right.value();
  }
}

export const PowerGenerator: CombinatorGenerator = (left, right) => new Power(left, right);
