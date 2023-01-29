import { Combinator, CombinatorGenerator } from '../Combinator';
import { StatisticalGenerator } from '../StatisticalGenerator';
import { convolution } from '../utils';

export default class Modulo implements Combinator {
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
    this.statProps = {
      // TODO: this is (technically) dependent on the inputs
      min: 1,
      max: right.statProps.max,
      // TODO: this is super wonky and not correct
      periodicity: Math.max(left.statProps.periodicity, right.statProps.periodicity),
      average: left.statProps.average + right.statProps.average,
    };
    this.value = this.apply;
    // one inverse function is +; it's dumb but it works!
    this.inverse = (x: number, y: number) => {
      return x + y;
    };
    this.pdf = (value: number) => {
      return convolution(value, left, right, this.inverse);
    };
  }

  apply() {
    return this.left.value() % this.right.value();
  }
}

export const ModuloGenerator: CombinatorGenerator = (left, right) => new Modulo(left, right);
