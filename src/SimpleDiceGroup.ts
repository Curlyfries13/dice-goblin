import random, { RNG } from 'random';
import seedrandom, { PRNG } from 'seedrandom';

import { DiceTerm } from './DiceTerm';

/**
 * A dice group is a single type of Dice, e.g. a six-sided dice
 *
 * This Die doesn't handle modifiers, instead that should be handled by a
 * "Roll"
 */
export class SimpleDiceGroup implements DiceTerm {
  sides: number;
  count: number;
  min: number;
  max: number;
  average: number;
  seed: undefined | seedrandom;
  current: number[];

  constructor(sides: number = 6, count: number = 1, seed?: PRNG) {
    this.sides = sides;
    this.count = count;
    // this die engine always uses a minimum value of 1
    this.min = count;
    this.max = count * sides;
    this.average = ((1 + sides) / 2.0) * count;
    if (seed !== undefined) random.use(seed as unknown as RNG);
    this.current = [count].concat(Array(count).fill(1));
  }

  // Roll this group and return the result
  roll() {
    if (this.sides === undefined || this.count === undefined) {
      // the group is not defined, initialize first
      throw Error('Dice Group is not configured');
    }
    return this.rollGroup()[0];
  }

  /*
   * Roll the dice group and return the results
   * The first element of the group is the sum, the following results are the
   * individual die faces
   */
  rollGroup() {
    const results = Array.apply(0, Array(this.count)).map(() => {
      // Representing a regular die, the smallest side has 1 pip or shows 1
      return random.int(1, this.sides);
    });
    const reducer = (total: number, value: number): number => {
      return total + value;
    };
    const sum = results.reduce(reducer, 0);
    results.unshift(sum);
    this.current = results;
    return results;
  }
}
