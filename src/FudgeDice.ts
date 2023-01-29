import random, { RNG } from 'random';
import seedrandom, { PRNG } from 'seedrandom';

import { BATCH_SIZE } from './EngineConfig';
import { Constant } from './Constant';
import { DiceTerm } from './DiceTerm';
import { StatisticalGenerator } from './StatisticalGenerator';
import { dicePDF } from './DiceGroupPDF';

/**
 * A group of any number of fudge dice
 *
 * Fudge dice are 6-sided dice with 2 '+' symbols, 2 '-' symbols, and 2 blank
 * sides. When rolled they are often specified like so:
 *
 * 6dF *
 * Fudge Dice are simple plus, minus system with results as a +/- some number (or zero).
 */
export class FudgeDiceGroup implements DiceTerm, StatisticalGenerator {
  sides: StatisticalGenerator;
  count: StatisticalGenerator;

  statProps: {
    min: number;
    max: number;
    periodicity: number;
    average: number;
  };
  seed: undefined | seedrandom;
  current: number[];
  value: () => number;
  pdf: (value: number) => number;

  // TODO: consider if polymorphic dice need to be part of the model
  constructor(count: number = 1, seed?: PRNG) {
    // Fudge Dice have 6 sides
    this.sides = new Constant(3);
    this.count = new Constant(count);
    this.statProps = {
      min: count * -1,
      max: count,
      periodicity: 3 * count,
      average: 0,
    };
    if (seed !== undefined) random.use(seed as unknown as RNG);
    this.current = [count].concat(Array(count).fill(0));
    this.value = this.roll;
    this.pdf = (value: number) => {
      // Fudge dice are 3-sided dice, but moved up
      let total = value + this.count.value() * 2;
      return dicePDF(this.count.value(), this.sides.value(), total);
    };
  }

  roll(): number {
    return this.rollGroup()[0];
  }

  rollGroup(): number[] {
    const count = this.count.value();
    let results: number[] = [];
    // This batch size is picked arbitrarily, but it should be below the call
    // limit for your target browsers
    let resultCount = 0;
    // avoid the call stack error by running in batches
    for (let i = 0; i < count; i += BATCH_SIZE) {
      // determine if we run a full batch or a smaller batch
      if (resultCount + BATCH_SIZE < count) {
        results = results.concat(
          Array.apply(0, Array(BATCH_SIZE)).map(() => {
            return random.int(-1, 1);
          })
        );
        resultCount += BATCH_SIZE;
      } else {
        const subBatchSize = count - resultCount;
        results = results.concat(
          Array.apply(0, Array(subBatchSize)).map(() => {
            return random.int(-1, 1);
          })
        );
      }
    }
    const reducer = (total: number, value: number): number => {
      return total + value;
    };
    const sum = results.reduce(reducer, 0);
    results.unshift(sum);
    this.current = results;
    return results;
  }
}
