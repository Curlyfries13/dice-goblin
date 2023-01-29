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
  inverse: (x: number, y: number) => number;
  pdf: (value: number) => number;

  constructor(left: StatisticalGenerator, right: StatisticalGenerator) {
    this.left = left;
    this.right = right;
    this.statProps = {
      min: Math.pow(left.statProps.min, right.statProps.min),
      max: Math.pow(left.statProps.max, right.statProps.max),
      // TODO: this is (specifically) wrong
      average: Math.pow(left.statProps.average, right.statProps.average),
      // this does not work... Power series don't have a
      periodicity: Math.pow(left.statProps.max, right.statProps.max),
    };
    this.value = this.apply;
    this.inverse = (x: number, y: number) => {
      return Math.pow(x, 1.0 / y);
    };
    this.pdf = (value: number) => {
      return convolution(value, left, right, this.inverse);
    };
  }

  apply() {
    return Math.pow(this.left.value(), this.right.value());
  }
}

export const PowerGenerator: CombinatorGenerator = (left, right) => new Power(left, right);
