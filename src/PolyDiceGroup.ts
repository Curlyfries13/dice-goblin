import random, { RNG } from 'random';
import seedrandom, { PRNG } from 'seedrandom';

import { BATCH_SIZE } from './EngineConfig';
import { DiceTerm } from './DiceTerm';
import { StatisticalGenerator } from './StatisticalGenerator';
import { multinomialCoefficient, multinomialPDF } from './utils';

/**
 * A Polymorphic dice group capable of handling any kind of dice
 *
 * Dice don't handle modifiers, instead that should be handled by a "Roll"
 */
export default class PolyDiceGroup implements DiceTerm, StatisticalGenerator {
  sides: StatisticalGenerator;

  currentSides: number;

  count: StatisticalGenerator;

  currentCount: number;

  statProps: {
    min: number;
    max: number;
    periodicity: number;
    average: number;
  };

  combinatoricMagnitude: number;

  seed: undefined | seedrandom;

  current: number[];

  value: () => number;

  pdf: (value: number) => number;

  multinomial: (value: number) => number;

  constructor(sides: StatisticalGenerator, count: StatisticalGenerator, seed?: PRNG) {
    // TODO: determine if this is going to be a problem with reference passing
    this.sides = sides;
    this.currentSides = sides.statProps.average;
    this.count = count;
    this.currentCount = count.statProps.average;
    // TODO: verify that this is correct; it feels correct
    this.combinatoricMagnitude = sides.statProps.average ** count.statProps.average;
    this.statProps = {
      min: count.statProps.min,
      max: count.statProps.max * sides.statProps.max,
      // as a safety precaution, set periodicity to is maximum value
      // TODO: Consider moving this into a variable for more readability around line 80
      periodicity: sides.statProps.max,
      // TODO: verify that this is true
      average: ((1 + sides.statProps.average) / 2.0) * count.statProps.average,
    };
    if (seed !== undefined) random.use(seed as unknown as RNG);
    // PERFORMANCE: consider cost if .pdf() is never invoked
    const countRange = count.statProps.max - count.statProps.min + 1;
    const sidesRange = sides.statProps.max - sides.statProps.min + 1;
    const countProb = Array(countRange)
      .fill(0)
      .map((_, i) => i + count.statProps.min)
      .map((value) => count.pdf(value));
    const sidesProb = Array(sidesRange)
      .fill(0)
      .map((_, i) => i + sides.statProps.min)
      .map((value) => sides.pdf(value));

    this.current = [count.statProps.min].concat(Array(count.statProps.min).fill(1));
    this.value = this.roll;
    this.pdf = (value: number) => {
      // PERFORMANCE: performance this seems like it'll be pretty expensive
      // get all combinations
      let acc = 0;
      // double for loop, feels bad man
      if (value < count.statProps.min || value > sides.statProps.max * count.statProps.max) {
        return acc;
      }
      for (let i = 0; i < countRange; i += 1) {
        for (let j = 0; j < sidesRange; j += 1) {
          // calculate the probability for this combination
          acc +=
            multinomialPDF(count.statProps.min + i, sides.statProps.min + j, value) *
            countProb[i] *
            sidesProb[j];
        }
      }
      return acc;
    };
    // TODO: calculate this
    this.multinomial = (value: number) => {
      // PERFORMANCE: performance this seems like it'll be pretty expensive
      // get all combinations
      let acc = 0;
      // double for loop, feels bad man
      if (value < count.statProps.min || value > sides.statProps.max * count.statProps.max) {
        return acc;
      }
      for (let i = 0; i < countRange; i += 1) {
        for (let j = 0; j < sidesRange; j += 1) {
          // calculate the probability for this combination
          acc +=
            multinomialCoefficient(count.statProps.min + i, sides.statProps.min + j, value) *
            countProb[i] *
            sidesProb[j];
        }
      }
      return acc;
    };

    // generate the possible values
    // TODO: implement a default depth for this (with overrides)
    /*
    this.values = function* () {
      let value = count.statProps.min;
      // if we don't add anything after the period, then we're out of values
      let guard = 0;

      while (true && value < this.statProps.max) {
        // can't get to `this`, must use a variable
        if (this.pdf(value) !== 0) {
          guard = 0;
          yield value;
          value++;
        } else {
          guard += 1;
          if (guard >= sides.statProps.max) return;
        }
      }
    }()
    */
  }

  // Roll this group and return the result
  roll() {
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
  rollGroup() {
    const count = this.count.value();
    const sides = this.sides.value();
    this.currentCount = count;
    this.currentSides = sides;
    let results: number[] = [];
    // This batch size is picked arbitrarily, but it should be below the call
    // limit for your target browsers
    let resultCount = 0;
    // avoid the call stack error by running in batches
    for (let i = 0; i < count; i += BATCH_SIZE) {
      // determine if we run a full batch or a smaller batch
      if (resultCount + BATCH_SIZE < count) {
        results = results.concat(Array.apply(0, Array(BATCH_SIZE)).map(() => random.int(1, sides)));
        resultCount += BATCH_SIZE;
      } else {
        const subBatchSize = count - resultCount;
        results = results.concat(
          Array.apply(0, Array(subBatchSize)).map(() => random.int(1, sides)),
        );
      }
    }
    const reducer = (total: number, value: number): number => total + value;
    const sum = results.reduce(reducer, 0);
    results.unshift(sum);
    this.current = results;
    return results;
  }
}
