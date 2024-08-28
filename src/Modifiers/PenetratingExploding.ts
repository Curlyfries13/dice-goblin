import CompareMode from '../CompareMode';
import { Modifier } from '../Modifier';
import SimpleDiceGroup from '../SimpleDiceGroup';
import { DiceTerm } from '../DiceTerm';
import { StatisticalGenerator } from '../StatisticalGenerator';
import Constant from '../Constant';
import Subtract from '../Combinators/Subtract';
import { convolution } from '../utils';

/*
 * The Exploding modifier adds additional logic to continue rolling
 *
 * With this modifier a roll that meets a target will roll additional dice!
 * This means that the dice count for this can't be known before a roll.
 */

export default class PenetratingExploding implements Modifier, DiceTerm {
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

  reroller: StatisticalGenerator;

  // exploder only props
  seriesBase: number;

  explosionProbability: number;

  value: () => number;

  pdf: (value: number) => number;

  multinomial: (value: number) => number;

  // thresholdFuncGenerator: (isPenetrating: boolean) => (value: number) => boolean;

  constructor(base: DiceTerm, target?: StatisticalGenerator, compare?: CompareMode) {
    this.base = base;
    // by default, an explosion happens on the largest result.
    // if the dice are polymorphic, then that means you have to roll a max sides roll
    // and a max roll for those dice.
    this.target = target === undefined ? new Constant(this.base.sides.statProps.max) : target;
    this.compareMode = compare === undefined ? CompareMode.Equal : compare;
    this.baseResults = [];
    this.current = [];
    // BUG: if these values are polymorphic, then our statistical models do not
    // work
    this.sides = new Constant(base.sides.statProps.max);
    this.currentSides = base.sides.statProps.max;
    // Do not copy the base values: this causes weirdness when you try to modify their properties
    this.count = {
      value: () => this.current.length - 1,

      // these properties are almost certainly not helpful
      statProps: {
        min: this.base.count.statProps.min,
        max: Infinity,
        // TODO calculate this
        average: this.base.count.statProps.average,
        periodicity: this.base.sides.statProps.max,
      },
      // this should be correct
      combinatoricMagnitude: Infinity,
      // TODO: actually calculate these properties
      pdf: (value: number) => this.base.pdf(value),
      multinomial: (value: number) => this.base.multinomial(value),
    };
    this.currentCount = base.count.statProps.max;

    // NOTE: this property can change when rolled
    // the series base is the average value of a terminal roll.
    this.seriesBase = 0;
    // NOTE: if the base roll is polymorphic then we're out of luck.
    // TODO: handle polymorphic dice the probability is the chance that you do not stop rolling
    this.explosionProbability = 0;
    if (this.compareMode === CompareMode.Equal) {
      // should the compareMode be a strict equal, then it's one in x
      this.explosionProbability = 1.0 / this.sides.statProps.max;
    } else if (this.compareMode === CompareMode.LessThan) {
      // if the target is undefined, we should throw an error
      // wrangle the floating point goblins
      this.explosionProbability =
        ((this.target.statProps.average - 1) * 1.0) / this.sides.statProps.max;
    } else {
      this.explosionProbability =
        ((this.sides.statProps.max - (this.target.statProps.average - 1)) * 1.0) /
        this.sides.statProps.max;
    }
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
      // Do not ask me why this works. but it does.
      average: ((this.base.sides.statProps.average + 1) / 2) * probabilityMultiplier,
      periodicity: base.statProps.max,
    };
    // TODO: fix this for polymorphic dice?
    // The reroller is a duplicate of its die, but we need an individual member
    this.reroller = new Subtract(
      new SimpleDiceGroup(this.base.sides.statProps.max, 1),
      new Constant(1),
    );
    this.value = this.roll;
    // DONE: fully implement the PDF function for modifiers
    // TODO: investigate if there are optimizations for calculating pdf, e.g. using known values.
    this.pdf = (value: number) => {
      // if it's a simple explosion, e.g. 1d6!, this is simple
      // if not, then we convolute.
      // figure out if it's a simple expression, and not polymorphic craziness
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
        const outerThreshold = this.thresholdFuncGenerator(false);
        if (outerThreshold(value)) return 0;
        if (div === 0) return this.base.pdf(value);
        return this.explosionProbability * div * this.base.pdf(mod);
      }
      if (
        this.base.count.statProps.min === this.base.count.statProps.max &&
        this.base.sides.statProps.min === this.base.sides.statProps.max
      ) {
        // create a convolution sub-entity (this could get expensive)
        const left = new PenetratingExploding(
          new SimpleDiceGroup(this.base.sides.value(), 1),
          this.target,
          this.compareMode,
        );
        const right = new PenetratingExploding(
          new SimpleDiceGroup(this.base.sides.value(), this.base.count.value() - 1),
          this.target,
          this.compareMode,
        );
        return convolution(value, left, right, (x, y) => x - y, 'pdf');
      }
      // give up
      return this.base.pdf(value);
    };
    // TODO: consolidate into 1 function (since they use the same math)
    // make a helper function which takes either "pdf" or "multinomial"
    this.multinomial = (value: number) => {
      // This is a copy of the pdf function above
      // we cannot simply use this for PDF, because of the possibility of dropping out to the base
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
        const outerThreshold = this.thresholdFuncGenerator(false);
        if (outerThreshold(value)) return 0;
        if (div === 0) return this.base.pdf(value);
        return this.explosionProbability * div * this.base.multinomial(mod);
      }
      if (
        this.base.count.statProps.min === this.base.count.statProps.max &&
        this.base.sides.statProps.min === this.base.sides.statProps.max
      ) {
        // create a convolution sub-entity (this could get expensive)
        const left = new PenetratingExploding(
          new SimpleDiceGroup(this.base.sides.value(), 1),
          this.target,
          this.compareMode,
        );
        const right = new PenetratingExploding(
          new SimpleDiceGroup(this.base.sides.value(), this.base.count.value() - 1),
          this.target,
          this.compareMode,
        );
        return convolution(value, left, right, (x, y) => x - y, 'multinomial');
      }
      // give up
      return this.base.multinomial(value);
    };
  }

  // because we filter in 2 different states, we sorta have to generate the threshold function
  // I don't really like this because it means we have to build 2 functions every time we roll, rather than just 1
  thresholdFuncGenerator = (isPenetrating: boolean) => {
    const targetValue = isPenetrating ? this.target.value() - 1 : this.target.value();
    return (value: number): boolean => {
      switch (this.compareMode) {
        case CompareMode.LessThan:
          // according to the Roll20 spec, '<' actually means '<='
          return value <= targetValue;
        case CompareMode.GreaterThan:
          return value >= targetValue;
        case CompareMode.Equal:
        default:
          return value === this.target.value();
      }
    };
  };

  roll(): number {
    return this.rollGroup()[0];
  }

  rollGroup(): number[] {
    // roll the base, if any results hit the threshold, roll those again.
    this.base.rollGroup();
    this.currentSides = this.base.currentSides;
    this.baseResults = this.base.current.slice(0);
    this.current = this.base.current.slice(0);
    // skip the first result
    const outerThreshold = this.thresholdFuncGenerator(false);
    const innerThreshold = this.thresholdFuncGenerator(true);
    let active = this.baseResults.slice(1).filter(outerThreshold).length;
    // keep rerolling
    while (active > 0) {
      const subRoll: number[] = Array(active)
        .fill(0)
        .map(() => this.reroller.value());
      active = subRoll.filter(innerThreshold).length;
      this.current = this.current.concat(subRoll);
    }
    const sum = this.current.slice(1).reduce((acc, curr) => acc + curr);
    this.currentCount = this.current.length - 1;
    this.current[0] = sum;
    // NOTE: there's a todo in Explode to cover these
    // there is no way to distinguish base results from modified results
    // there is no way to see how exploded dice explode
    return this.current;
  }
}
