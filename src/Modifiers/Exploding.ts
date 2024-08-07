import CompareMode from '../CompareMode';
import { Modifier } from '../Modifier';
import { SimpleDiceGroup } from '../SimpleDiceGroup';
import { DiceTerm } from '../DiceTerm';
import { StatisticalGenerator } from '../StatisticalGenerator';
import { Constant } from '../Constant';
import { pdfConvolution } from '../utils';

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
  count: StatisticalGenerator;

  statProps: {
    min: number;
    max: number;
    average: number;
    periodicity: number;
  };
  combinatoricMagnitude: number;
  current: number[];
  reroller: SimpleDiceGroup;
  // exploder only props
  seriesBase: number;
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

    // BUG if these values are polymorphic, then our statistical models do not
    // work
    this.sides = new Constant(base.sides.statProps.max);

    // NOTE: if the base roll is polymorphic then we're out of luck.
    // TODO: handle polymorphic dice
    // the probability is the chance that you do not stop rolling
    this.explosionProbability = 0;
    if (this.compareMode === CompareMode.Equal) {
      // should the compareMode be a strict equal, then it's one in x
      this.explosionProbability = 1.0 / this.sides.statProps.max;
    } else if (this.compareMode === CompareMode.LessThan) {
      // if the target is undefined, we should throw an error
      // wrangle the floating point goblins
      this.explosionProbability = ((this.target.statProps.average - 1) * 1.0) / this.sides.statProps.max;
    } else {
      this.explosionProbability =
        ((this.sides.statProps.max - (this.target.statProps.average - 1)) * 1.0) / this.sides.statProps.max;
    }

    // Calculate the average (almost)
    let averageAcc = 1 - this.explosionProbability;
    for (let i = 1; i <= AVERAGE_EPSILON; i++) {
      averageAcc += (i + 2) / Math.pow(this.sides.statProps.average, i);
    }
    // NOTE: this is actually not 100% calculable - it's a non-converging sum.
    const average = averageAcc * this.base.count.statProps.average;
    // Do not copy the base values: this causes weirdness when you try to modify their properties
    this.count = {
      value: () => {
        return this.current.length - 1;
      },

      combinatoricMagnitude: Infinity,
      // these properties are almost certainly not helpful
      statProps: {
        min: this.base.count.statProps.min,
        max: Infinity,
        average: average,
        periodicity: this.base.sides.statProps.max,
      },
      pdf: (value: number) => {
        return this.base.pdf(value);
      },
      multinomial: (value: number) => {
        return this.base.multinomial(value);
      },
    };
    // NOTE: this property can change when rolled
    // the series base is the average value of a terminal roll.
    this.seriesBase = 0;
    let probabilityMultiplier = 1;
    if (this.compareMode === CompareMode.Equal) {
      probabilityMultiplier = this.sides.statProps.average / (this.sides.statProps.average - 1);
    } else {
      probabilityMultiplier = this.sides.statProps.average / (this.target.statProps.average - 1);
    }
    this.combinatoricMagnitude = Infinity;
    this.statProps = {
      // TODO: this property can change if the explosion target includes the
      // minimum value
      min: base.statProps.min,
      max: Infinity,
      // TODO: correctly calculate the average for this system
      // Forbidden math knowledge: the average of an exploding die is a
      // Geometric Maclauren Series
      // This is basically magic, but it works
      average: ((this.base.sides.statProps.average + 1) / 2) * probabilityMultiplier,
      periodicity: base.statProps.max,
    };
    // TODO: fix this for polymorphic dice?
    // The reroller is a duplicate of its die, but we need an individual member
    this.reroller = new SimpleDiceGroup(this.base.sides.statProps.max, 1);
    this.value = this.roll;
    // TODO: performance investigate if there are optimizations for calculating
    // pdf, e.g. using known values.
    this.pdf = (value: number) => {
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
      } else if (
        this.base.count.statProps.min === this.base.count.statProps.max &&
        this.base.sides.statProps.min === this.base.sides.statProps.max
      ) {
        // create a convolution sub-entity
        // NOTE: performance (this could get expensive)
        // TODO: this seems to invoke base sides twice, which could be a problem / bug
        // currently this isn't a bug because we're checking for effectively
        // _only_ working on constant exploders
        const left = new Exploding(new SimpleDiceGroup(this.base.sides.value(), 1), this.target, this.compareMode);
        const right = new Exploding(
          new SimpleDiceGroup(this.base.sides.value(), this.base.count.value() - 1),
          this.target,
          this.compareMode,
        );
        return pdfConvolution(value, left, right, (x, y) => x - y);
      } else {
        // give up
        // TODO: implement PDF for non-constant / polymorphic dice
        return this.base.pdf(value);
      }
    };
    // TODO: fully implement multinomial for this
    this.multinomial = (value: number) => this.base.multinomial(value);
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
    this.current = this.base.current.slice(0);
    // skip the first result
    let active = this.baseResults.slice(1).filter(this.thresholdFunc).length;
    // keep rerolling
    while (active > 0) {
      const subRoll: number[] = Array(active)
        .fill(0)
        .map(() => {
          return this.reroller.roll();
        });
      active = subRoll.filter(this.thresholdFunc).length;
      this.current = this.current.concat(subRoll);
    }
    const sum = this.current.slice(1).reduce((acc, curr) => {
      return acc + curr;
    });
    this.current[0] = sum;
    // TODO there is no way to distinguish base results from modified results
    // TODO there is no way to see how exploded dice explode
    return this.current;
  }
}
