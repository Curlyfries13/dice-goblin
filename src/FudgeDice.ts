import random, { RNG } from 'random';
import seedrandom, { PRNG } from 'seedrandom';
import { Term } from './Term';

/**
 * A group of any number of fudge dice
 *
 * Fudge dice are 6-sided dice with 2 '+' symbols, 2 '-' symbols, and 2 blank
 * sides. When rolled they are often specified like so:
 *
 * 6dF *
 * Fudge Dice are simple plus, minus system with results as a +/- some number (or zero).
 */
export class FudgeDiceGroup implements Term {
  sides: number;
  statProps: {
    count: number;
    min: number;
    max: number;
    average: number;
  };
  seed: undefined | seedrandom;
  current: number[];

  constructor(count: number = 1, seed?: PRNG) {
    // Fudge Dice have 6 sides
    this.sides = 6;
    this.statProps = {
      count: count,
      min: count * -1,
      max: count,
      average: 0,
    };
    if (seed !== undefined) random.use(seed as unknown as RNG);
    this.current = [count].concat(Array(count).fill(0));
  }

  roll(): number {
    return this.rollGroup()[0];
  }

  rollGroup(): number[] {
    const results = Array.apply(0, Array(this.statProps.count)).map(() => {
      return random.int(-1, 1);
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
