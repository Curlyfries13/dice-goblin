import { DiceTerm } from './DiceTerm';

/**
 * A "dice" group that returns a constant result
 *
 */

export class ConstantDiceGroup implements DiceTerm {
  sides: number;
  count: number;
  min: number;
  max: number;
  average: number;
  current: number[];
  results: number[];

  constructor(results: number[], sides?: number) {
    this.results = results;
    this.count = results.length;
    if (sides === undefined) {
      this.sides = Math.max(...results);
    } else {
      this.sides = sides;
    }
    const sum = results.reduce((acc, curr) => {
      return acc += curr;
    }, 0);

    this.min = sum;
    this.max = sum;
    this.average = sum;
    this.current = [sum].concat(this.results);
  }

  roll() {
    return this.rollGroup()[0];
  }

  rollGroup() {
    return this.current;
  }
}
