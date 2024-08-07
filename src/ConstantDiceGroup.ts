import { DiceTerm } from './DiceTerm';
import { Constant } from './Constant';
import { StatisticalGenerator } from './StatisticalGenerator';

/**
 * A "dice" group that returns a constant result
 *
 * Mostly useful for testing
 */

export class ConstantDiceGroup implements DiceTerm {
  sides: StatisticalGenerator;
  count: StatisticalGenerator;

  statProps: {
    min: number;
    max: number;
    average: number;
    periodicity: number;
  };
  combinatoricMagnitude: number;
  value: () => number;
  pdf: (value: number) => number;
  multinomial: (value: number) => number;
  current: number[];
  results: number[];

  constructor(results: number[], sides?: number) {
    this.results = results;
    if (sides === undefined) {
      this.sides = new Constant(Math.max(...results));
    } else {
      this.sides = new Constant(sides);
    }
    const sum = results.reduce((acc, curr) => {
      return (acc += curr);
    }, 0);

    this.count = new Constant(results.length);
    this.statProps = {
      min: sum,
      max: sum,
      average: sum,
      periodicity: sum,
    };
    this.combinatoricMagnitude = 1;

    this.current = [sum].concat(this.results);
    this.value = this.roll;
    this.pdf = (value: number) => {
      if (value === this.current[0]) {
        return 1;
      }
      return 0;
    };
    this.multinomial = (value: number) => {
      if (value === this.current[0]) {
        return 1;
      }
      return 0;
    };
  }

  roll() {
    return this.rollGroup()[0];
  }

  rollGroup() {
    return this.current;
  }
}
