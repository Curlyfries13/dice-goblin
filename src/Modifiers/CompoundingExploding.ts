import CompareMode from 'CompareMode';
import Constant from 'Constant';
import { Modifier } from 'Modifier';
import SimpleDiceGroup from 'SimpleDiceGroup';
import { DiceTerm } from 'DiceTerm';
import { StatisticalGenerator } from 'StatisticalGenerator';
import { convolution } from 'utils';

/*
 * The Compounding Exploding mode adds additional logic to continue rolling
 *
 * With this modifier a roll that meets a target will roll additional dice, but
 * these additional rolls will add themselves into the original rolls. This is a
 * bit awkward, but it acts essentially the same as Exploding
 */

export default class CompoundingExploding implements Modifier {
  name = 'Compounding Exploding';

  target: StatisticalGenerator;

  compareMode: CompareMode;

  base: DiceTerm;

  baseResults: number[];

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
    this.target = target === undefined ? new Constant(this.base.sides.statProps.max) : target;
    this.compareMode = compare === undefined ? CompareMode.Equal : compare;
    this.baseResults = [];
    this.current = [];

    this.sides = base.sides;
    this.currentSides = base.sides.statProps.max;
    this.count = {
      value: () => this.current.length - 1,

      combinatoricMagnitude: Infinity,
      statProps: {
        min: this.base.count.statProps.min,
        max: this.base.count.statProps.max,
        average: this.base.count.statProps.average,
        periodicity: this.base.sides.statProps.max,
      },
      pdf: (value: number) => this.base.count.pdf(value),
      multinomial: (value: number) => this.base.count.multinomial(value),
    };
    this.currentCount = base.sides.statProps.max;

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

    let probabilityMultiplier = 1;
    if (this.compareMode === CompareMode.Equal) {
      probabilityMultiplier = this.sides.statProps.average / (this.sides.statProps.average - 1);
    } else {
      probabilityMultiplier = this.sides.statProps.average / (this.target.statProps.average - 1);
    }
    // there's technically an infinite number of combinations
    this.combinatoricMagnitude = Infinity;
    this.statProps = {
      // TODO: this property can change if the explosion target includes the
      // minimum value
      min: base.statProps.min,
      max: Infinity,
      // TODO: correctly calculate the average for this system
      average: ((this.base.sides.statProps.average + 1) / 2) * probabilityMultiplier,
      periodicity: base.sides.statProps.max,
    };
    // The reroller is a duplicate of its die, but we need an individual member
    this.reroller = new SimpleDiceGroup(this.base.sides.value(), 1);
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
        // NOTE: performance (this could get expensive)
        // TODO: this seems to invoke base sides twice, which could be a problem / bug
        // currently this isn't a bug because we're checking for effectively
        // _only_ working on constant exploders
        const left = new CompoundingExploding(
          new SimpleDiceGroup(this.base.sides.value(), 1),
          this.target,
          this.compareMode,
        );
        const right = new CompoundingExploding(
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
        const left = new CompoundingExploding(
          new SimpleDiceGroup(this.base.sides.value(), 1),
          this.target,
          this.compareMode,
        );
        const right = new CompoundingExploding(
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

  thresholdFunc = (value: number) => {
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
    // roll the base, if any results hit the
    this.base.rollGroup();
    this.baseResults = this.base.current.slice(0);
    this.current = this.base.current.slice(0);
    const activeMap = this.baseResults.slice(1).map(this.thresholdFunc);
    let active = activeMap.filter((element) => element).length;
    // keep rerolling
    while (active > 0) {
      const subRoll: number[] = Array(activeMap.length)
        .fill(0)
        .map((_, i) => {
          let res = 0;
          if (activeMap[i]) {
            res = this.reroller.roll();
            if (this.thresholdFunc(res)) {
              activeMap[i] = true;
            } else {
              activeMap[i] = false;
            }
          }
          return res;
        });
      active = subRoll.filter(this.thresholdFunc).length;
      subRoll.forEach((element, i) => {
        this.current[i + 1] += element;
      });
    }
    const sum = this.current.slice(1).reduce((acc, curr) => acc + curr);
    this.current[0] = sum;
    return this.current;
  }
}
