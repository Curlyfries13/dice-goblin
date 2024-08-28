import { StatisticalGenerator } from 'StatisticalGenerator';

export default class Constant implements StatisticalGenerator {
  value: () => number;

  pdf: (value: number) => number;

  multinomial: (value: number) => number;

  // TODO: if we go to generators for all values, this is how it could be done
  // values: Generator<number, void, unknown>;

  statProps: {
    min: number;
    max: number;
    periodicity: number;
    average: number;
  };

  combinatoricMagnitude: number;

  constructor(constantValue: number) {
    this.value = () => constantValue;
    this.pdf = (value: number) => (value === constantValue ? 1 : 0);
    this.multinomial = (value: number) => (value === constantValue ? 1 : 0);
    this.statProps = {
      min: constantValue,
      max: constantValue,
      // for periodic values a constant always produces the same value
      periodicity: 1,
      average: constantValue,
    };
    this.combinatoricMagnitude = 1;
  }
}
