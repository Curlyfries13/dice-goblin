import { Combinator, CombinatorGenerator } from '../Combinator';
import { StatisticalGenerator } from '../StatisticalGenerator';
import { convolution } from '../utils';

export default class Multiply implements Combinator {
  name = 'multiply';
  left: StatisticalGenerator;
  right: StatisticalGenerator;
  value: () => number;
  statProps: {
    min: number;
    max: number;
    periodicity: number;
    average: number;
  };
  inverse: (x: number, y: number) => number;
  pdf: (value: number) => number;

  constructor(left: StatisticalGenerator, right: StatisticalGenerator) {
    this.left = left;
    this.right = right;
    this.value = this.apply;
    this.statProps = {
      min: left.statProps.min * right.statProps.max,
      max: left.statProps.min * right.statProps.min,
      periodicity: left.statProps.periodicity * right.statProps.periodicity,
      average: left.statProps.average * right.statProps.average,
    };
    this.value = this.apply;
    this.inverse = (x: number, y: number) => {
      // this seems like a bad idea due to floating point madness
      // this case makes it feel like a good idea to use generators and the
      // values member function so we can iterate all possibilities (to a point)
      return x / y;
    };
    this.pdf = (value: number) => {
      return convolution(value, left, right, this.inverse);
    };
  }

  apply() {
    return this.left.value() * this.right.value();
  }
}

export const MultiplyGenerator: CombinatorGenerator = (left, right) => new Multiply(left, right);
