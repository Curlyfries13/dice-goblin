import random, { RNG } from 'random';
import seedrandom, { PRNG } from 'seedrandom';

import { BATCH_SIZE } from './EngineConfig';
import { Constant } from './Constant';
import { DiceTerm } from './DiceTerm';
import { StatisticalGenerator } from './StatisticalGenerator';
import { dicePDF } from './DiceGroupPDF';

/**
 * A dice group is a single type of Dice, e.g. a six-sided dice
 *
 * This Die doesn't handle modifiers, instead that should be handled by a
 * "Roll"
 *
 * The die also doesn't handle polymorphic rolls, i.e. if the number of dice or
 * the faces on a die change
 */
export class SimpleDiceGroup implements DiceTerm, StatisticalGenerator {
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
  // placeholder
  value: () => number;
  pdf: (value: number) => number;

  constructor(sides: number = 6, count: number = 1, seed?: PRNG) {
    this.sides = new Constant(sides);
    this.count = new Constant(count);
    this.statProps = {
      // this die engine always uses a minimum value of 1
      // Note this acts strangely if the number of sides is 0. In this case an
      // error should be thrown
      min: count,
      max: count * sides,
      // this is a helper for PDF calculation and convolution
      periodicity: count * sides - count,
      average: ((1 + sides) / 2.0) * count,
    };

    if (seed !== undefined) random.use(seed as unknown as RNG);
    this.current = [count].concat(Array(count).fill(1));
    this.value = this.roll;
    this.pdf = (value: number) => dicePDF(this.count.value(), this.sides.value(), value);
  }

  // Roll this group and return the result
  roll(): number {
    if (this.sides === undefined || this.count === undefined) {
      // the group is not defined, initialize first
      // TODO: write more descriptive errors
      // TODO: create custom error types
      throw Error('Dice Group is not configured');
    }
    return this.rollGroup()[0];
  }

  /*
   * Roll the dice group and return the results
   * The first element of the group is the sum, the following results are the
   * individual die faces
   */
  rollGroup(): number[] {
    const count = this.count.value();
    const sides = this.sides.value();
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
            return random.int(1, sides);
          })
        );
        resultCount += BATCH_SIZE;
      } else {
        const subBatchSize = count - resultCount;
        results = results.concat(
          Array.apply(0, Array(subBatchSize)).map(() => {
            return random.int(1, sides);
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
