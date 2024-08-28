import CompareMode from '../CompareMode';
import { Modifier } from '../Modifier';
import SimpleDiceGroup from '../SimpleDiceGroup';
import { DiceTerm } from '../DiceTerm';
import { StatisticalGenerator } from '../StatisticalGenerator';
import Constant from '../Constant';
import { convolution } from '../utils';

/*
 * The Exploding mode adds additional logic to continue rolling
 *
 * With this modifier a roll that meets a target will roll additional dice!
 * This means that the dice count for this can't be known before a roll.
 */

// NOTE: the average for the count of this system is not computable, so we get
// arbitrarily close.
const AVERAGE_EPSILON = 16;

export default class Exploding implements Modifier, DiceTerm {
  name = 'Exploding';

  target: StatisticalGenerator;

  compareMode: CompareMode;

  base: DiceTerm;

  baseResults: number[];

  // not sure if these should be StatisticalGenerators or not
  sides: StatisticalGenerator;

  currentSides: number;

  count: StatisticalGenerator;

  currentCount: number;

  statProps: {
    min: number;
    max: number;
    average: number;
    periodicity: number;
  };

  combinatoricMagnitude: number;

  current: number[];

  reroller: SimpleDiceGroup;

  explosionCount: number;

  explosionProbability: number;

  value: () => number;

  pdf: (value: number) => number;

  multinomial: (value: number) => number;

  constructor(base: DiceTerm, target?: StatisticalGenerator, compare?: CompareMode) {
    this.base = base;
    this.baseResults = [];
    this.current = [];
    // by default, an explosion happens on the largest result.
    // if the dice are polymorphic, then that means you have to roll a max sides roll
    // and a max roll for those dice.
    this.target = target === undefined ? new Constant(this.base.sides.statProps.max) : target;
    this.compareMode = compare === undefined ? CompareMode.Equal : compare;

    // BUG: if these values are polymorphic, then our statistical models do not
    // work
    this.sides = new Constant(base.sides.statProps.max);
    this.currentSides = base.sides.statProps.max;

    // NOTE: if the base roll is polymorphic then we're out of luck.
    // TODO: handle polymorphic dice
    // the probability is the chance that you do not stop rolling
    this.explosionCount = 0;
    this.explosionProbability = 0;
    if (this.compareMode === CompareMode.Equal) {
      // should the compareMode be a strict equal, then it's one in x
      this.explosionCount = 1;
      this.explosionProbability = 1.0 / this.sides.statProps.max;
    } else if (this.compareMode === CompareMode.LessThan) {
      // if the target is undefined, we should throw an error
      // wrangle the floating point goblins
      // TODO: implement cdf
      // TODO: assumes dice start at 1
      this.explosionCount = this.target.statProps.average - 1;
      this.explosionProbability = (this.explosionCount * 1.0) / this.sides.statProps.max;
    } else {
      this.explosionCount = this.sides.statProps.max - (this.target.statProps.average - 1);
      this.explosionProbability = (this.explosionCount * 1.0) / this.sides.statProps.max;
    }

    // Calculate the average (almost)
    let averageAcc = 1 - this.explosionProbability;
    for (let i = 1; i <= AVERAGE_EPSILON; i += 1) {
      averageAcc += (i + 2) / this.sides.statProps.average ** i;
    }
    // NOTE: this is actually not 100% calculable - it's a non-converging sum.
    const average = averageAcc * this.base.count.statProps.average;
    // Do not copy the base values: this causes weirdness when you try to modify their properties
    this.count = {
      value: () => this.current.length - 1,

      combinatoricMagnitude: Infinity,
      // these properties are almost certainly not helpful
      statProps: {
        min: this.base.count.statProps.min,
        max: Infinity,
        average,
        periodicity: this.base.sides.statProps.max,
      },
      pdf: (value: number) => this.base.pdf(value),
      multinomial: (value: number) => this.base.multinomial(value),
    };
    this.currentCount = this.base.count.statProps.max;
    let probabilityMultiplier = 1;
    if (this.compareMode === CompareMode.Equal) {
      probabilityMultiplier = this.sides.statProps.average / (this.sides.statProps.average - 1);
    } else {
      probabilityMultiplier = this.sides.statProps.average / (this.target.statProps.average - 1);
    }
    this.combinatoricMagnitude = Infinity;
    this.statProps = {
      // TODO: implement minimum for low explosions this property can change if the explosion target includes the
      // minimum value
      min: base.statProps.min,
      max: Infinity,
      average: ((this.base.sides.statProps.average + 1) / 2) * probabilityMultiplier,
      periodicity: base.statProps.max,
    };
    // TODO: fix this for polymorphic dice
    // The reroller is a duplicate of its die, but we need an individual member
    this.reroller = new SimpleDiceGroup(this.base.sides.statProps.max, 1);
    this.value = this.roll;
    this.pdf = (value: number) => {
      // NOTE: we can't use the multinomial, because it panics and drops out to the base if it can't calculate

      // if it's a simple explosion, e.g. 1d6!, this is simple
      // if not, then we convolute.
      // figure out if it's a simple expression, and not polymorphic craziness
      if (value < this.base.statProps.min) return 0;
      if (
        this.base.count.statProps.min === 1 &&
        this.base.count.statProps.max === 1 &&
        this.base.sides.statProps.min === this.base.sides.statProps.max
      ) {
        // get the multiplier and mod of the target value
        const div = Math.trunc(value / this.base.sides.statProps.max);
        const mod = value % this.base.sides.statProps.max;
        // determine if the mod value can't be rolled because of the modifier's
        // explosion threshold
        if (this.thresholdFunc(value)) return 0;
        if (div === 0) return this.base.pdf(value);
        return this.explosionProbability * div * this.base.pdf(mod);
      }
      if (
        this.base.count.statProps.min === this.base.count.statProps.max &&
        this.base.sides.statProps.min === this.base.sides.statProps.max
      ) {
        // create a convolution sub-entity
        // PERFORMANCE: (this could get expensive)
        const left = new Exploding(
          new SimpleDiceGroup(this.base.sides.value(), 1),
          this.target,
          this.compareMode,
        );
        const right = new Exploding(
          new SimpleDiceGroup(this.base.sides.value(), this.base.count.value() - 1),
          this.target,
          this.compareMode,
        );
        return convolution(value, left, right, (x, y) => x - y, 'pdf');
      }
      // give up
      // TODO: implement PDF for non-constant / polymorphic dice or error messages
      return this.base.pdf(value);
    };

    this.multinomial = (value: number) => {
      if (value < this.base.statProps.min) return 0;
      // check for a single die: this acts in a special way
      if (
        this.base.count.statProps.min === 1 &&
        this.base.count.statProps.max === 1 &&
        this.base.sides.statProps.min === this.base.sides.statProps.max
      ) {
        // get the multiplier and mod of the target value
        const div = Math.trunc(value / this.base.sides.statProps.max);
        const mod = value % this.base.sides.statProps.max;
        if (this.thresholdFunc(value)) return 0;
        if (div === 0) return this.base.multinomial(value);
        return this.explosionCount * div * this.base.multinomial(mod);
      }
      if (
        this.base.count.statProps.min === this.base.count.statProps.max &&
        this.base.sides.statProps.min === this.base.sides.statProps.max
      ) {
        // create a convolution sub-entity, see note and TODO above
        const left = new Exploding(
          new SimpleDiceGroup(this.base.sides.value(), 1),
          this.target,
          this.compareMode,
        );
        const right = new Exploding(
          new SimpleDiceGroup(this.base.sides.value(), this.base.count.value() - 1),
          this.target,
          this.compareMode,
        );
        return convolution(value, left, right, (x, y) => x - y, 'multinomial');
      }
      // give up
      // TODO: implement multinomial for non-constant / polymorphic dice
      // TODO: add not implemented messages
      return this.base.multinomial(value);
    };
  }

  // returns true if the provided value should explode
  thresholdFunc = (value: number): boolean => {
    switch (this.compareMode) {
      case CompareMode.LessThan:
        // according to the Roll20 spec, '<' actually means '<='
        return value <= this.target.value();
      case CompareMode.GreaterThan:
        return value >= this.target.value();
      case CompareMode.Equal:
      default:
        return value === this.target.value();
    }
  };

  roll(): number {
    return this.rollGroup()[0];
  }

  rollGroup(): number[] {
    // roll the base, if any results hit the threshold, roll those again.
    this.base.rollGroup();
    this.baseResults = this.base.current.slice(0);
    this.currentSides = this.base.currentSides;
    this.current = this.base.current.slice(0);
    // skip the first result, it's the total result
    let active = this.baseResults.slice(1).filter(this.thresholdFunc).length;
    // keep rerolling
    while (active > 0) {
      const subRoll: number[] = Array(active)
        .fill(0)
        .map(() => this.reroller.roll());
      active = subRoll.filter(this.thresholdFunc).length;
      this.current = this.current.concat(subRoll);
    }
    const sum = this.current.slice(1).reduce((acc, curr) => acc + curr);
    this.currentCount = this.current.length - 1;
    this.current[0] = sum;
    // TODO: there is no way to distinguish base results from modified results
    // TODO: there is no way to see how exploded dice explode
    return this.current;
  }
}
