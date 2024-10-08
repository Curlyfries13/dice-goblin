import { Combinator, CombinatorGenerator } from '../Combinator';
import { StatisticalGenerator } from '../StatisticalGenerator';
import { convolution } from '../utils';

export default class Divide implements Combinator {
  name = 'multiply';

  left: StatisticalGenerator;

  right: StatisticalGenerator;

  value: () => number;

  statProps: {
    min: number;
    max: number;
    average: number;
    // this gets wonky due to floating point madness
    periodicity: number;
  };

  combinatoricMagnitude: number;

  inverse: (x: number, y: number) => number;

  pdf: (value: number) => number;

  multinomial: (value: number) => number;

  constructor(left: StatisticalGenerator, right: StatisticalGenerator) {
    this.left = left;
    this.right = right;
    this.statProps = {
      min: left.statProps.min / right.statProps.max,
      max: left.statProps.max / right.statProps.min,
      // TODO: this is entirely wrong
      // The expected value of the inverse of a random variable doesn't equal
      // the inverse of the random variable's expected value as is implied here
      average: left.statProps.average / right.statProps.average,
      periodicity: left.statProps.min / right.statProps.max,
    };
    this.combinatoricMagnitude = left.combinatoricMagnitude * right.combinatoricMagnitude;
    this.value = this.apply;
    this.inverse = (x: number, y: number) => x * y;
    this.pdf = (value: number) => convolution(value, left, right, this.inverse, 'pdf');
    this.multinomial = (value: number) =>
      convolution(value, left, right, this.inverse, 'multinomial');
  }

  apply() {
    // TODO dividing by zero should throw an exception that shows where the
    // breakdown happens
    return this.left.value() / this.right.value();
  }
}

export const DivideGenerator: CombinatorGenerator = (left, right) => new Divide(left, right);
