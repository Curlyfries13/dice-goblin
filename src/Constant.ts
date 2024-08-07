import { StatisticalGenerator } from './StatisticalGenerator';

export class Constant implements StatisticalGenerator {
  value: () => number;
  pdf: (value: number) => number;
  multinomial: (value: number) => number;
  values: Generator<number, void, unknown>;
  statProps: {
    min: number;
    max: number;
    periodicity: number;
    average: number;
  };
  combinatoricMagnitude: number;

  constructor(constantValue: number) {
    this.value = () => constantValue;
    this.pdf = (value: number) => {
      return value === constantValue ? 1 : 0;
    };
    this.multinomial = (value: number) => {
      return value === constantValue ? 1 : 0;
    };
    // TODO: Consider if we do want to use generators throughout the project
    this.values = (function* () {
      yield constantValue;
    })();
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
