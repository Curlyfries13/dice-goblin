import CompareMode from '../CompareMode';
import { Modifier } from '../Modifier';
import { SimpleDiceGroup } from '../SimpleDiceGroup';
import { DiceTerm } from '../DiceTerm';
import { StatisticalGenerator } from '../StatisticalGenerator';
import { Constant } from '../Constant';
import { pdfConvolution } from '../utils';
/*
 * The Reroll Modifier adds additional logic to the dice. Essentially, they
 * prevent specific values from surfacing.
 *
 */

export default class Reroll implements Modifier, DiceTerm {
  name = 'Reroll';
  // TODO: I don't like rewriting classes to have all of these elements
  // belonging to all other similar classes
  target: StatisticalGenerator;
  compareMode: CompareMode;
  base: DiceTerm;
  baseResults: number[];

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
  reroller: StatisticalGenerator;
  value: () => number;
  pdf: (value: number) => number;
  multinomial: (value: number) => number;

  // these members are only for reroll
  // this represents the total number of values which are possible
  rerollValuesMagnitude: StatisticalGenerator;
  rerollCount: number;

  constructor(base: DiceTerm, target?: StatisticalGenerator, compare?: CompareMode) {
    this.base = base;
    // by default, a reroll happens on the minimum roll only (i.e. brutal 1's)
    // TODO: figure out how this works with Groups (e.g. {3d8, 2d6}r)
    // NOTE: I can't think of a way where you can have a minimum that's not 1
    this.target = target === undefined ? new Constant(1) : target;
    this.compareMode = compare === undefined ? CompareMode.Equal : compare;
    this.baseResults = this.base.current;
    this.current = this.base.current;
    this.sides = new Constant(base.sides.statProps.max);

    // Do not copy the base values: this causes weirdness when you try to modify their properties
    this.count = {
      value: () => {
        return this.current.length - 1;
      },
      combinatoricMagnitude: this.base.combinatoricMagnitude,
      statProps: {
        min: this.base.statProps.min,
        max: this.base.statProps.max,
        average: this.base.count.statProps.average,
        periodicity: this.base.sides.statProps.max,
      },
      pdf: (value: number) => {
        return this.base.pdf(value);
      },
      multinomial: (value: number) => {
        return this.base.multinomial(value);
      },
    };
    let newMin = base.statProps.min;
    let newMax = base.statProps.max;
    if (this.compareMode === CompareMode.Equal) {
      if (
        base.statProps.min === this.target.statProps.min &&
        base.statProps.min === this.target.statProps.max &&
        // NOTE: in exotic situations this may actually be wrong, but it
        // doesn't seem to be possible to actually construct such a situation
        base.statProps.min + 1 <= base.statProps.max
      ) {
        // NOTE: this may actually cause weird artifacts on more exotic rolls,
        // but as-is this language may not be able to fully use this
        newMin = base.statProps.min + 1;
      }
      if (base.statProps.max === this.target.statProps.max && base.statProps.max === this.target.statProps.max) {
        newMax = base.statProps.max - 1;
      }
    }
    // TODO: implement this
    this.combinatoricMagnitude = this.base.combinatoricMagnitude;
    this.statProps = {
      min: newMin,
      max: newMax,
      average: base.statProps.average,
      periodicity: base.statProps.periodicity,
    };
    this.rerollCount = 0;
    // TODO: fix this for polymorphic dice?
    // The reroller is a duplicate of its die, but we need an individual member
    this.reroller = new SimpleDiceGroup(this.base.sides.statProps.max, 1);
    this.value = this.roll;
    // the target matters if it's value is within the range of this
    const isTargetImpactful =
      this.target.statProps.min <= this.sides.statProps.max || this.target.statProps.max >= this.sides.statProps.min;

    if (!isTargetImpactful) {
      this.rerollValuesMagnitude = new Constant(this.sides.statProps.average);
    }
    if (this.compareMode === CompareMode.Equal) {
      // TODO: this assumes that we're always comparing against a constant generator.
      this.rerollValuesMagnitude = new Constant(this.sides.statProps.average - 1);
    } else {
      const diff = Math.abs(this.sides.statProps.average - this.target.statProps.average);
      this.rerollValuesMagnitude = new Constant(this.sides.statProps.average - diff);
    }
    this.pdf = (value: number) => {
      // NOTE: performance consider if this is a performance hit for convolution
      // Much like the other modifiers, we use convolution for more complicated
      // situations
      if (this.base.pdf(value) === 0) return 0;
      if (
        this.base.count.statProps.min === 1 &&
        this.base.count.statProps.max === 1 &&
        this.base.sides.statProps.min === this.base.sides.statProps.max
      ) {
        if (this.thresholdFunc(value)) {
          return 0;
        }
        // this is 1 die and within range
        return 1 / this.rerollValuesMagnitude.statProps.average;
      } else if (
        this.base.count.statProps.min === this.base.count.statProps.max &&
        this.base.sides.statProps.min === this.base.sides.statProps.max
      ) {
        const left = new Reroll(new SimpleDiceGroup(this.base.sides.value(), 1), this.target, this.compareMode);
        const right = new Reroll(
          new SimpleDiceGroup(this.base.sides.value(), this.base.count.value() - 1),
          this.target,
          this.compareMode,
        );
        return pdfConvolution(value, left, right, (x, y) => x - y);
      } else {
        // give up
        // TODO: implement PDF for non-constant dice
        return this.base.pdf(value);
      }
    };
    // TODO: implement multinomial for this
    this.multinomial = (value: number) => {
      return this.base.multinomial(value);
    };
  }

  thresholdFunc = (value: number): boolean => {
    // TODO: implement multiple 'r' rerolls, this is apparently a thing in the spec
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

  // TODO: determine if it's actually worth it to literally reroll, or if it'd
  // be better to just construct the kind of dice that would be created by
  // restricting the randomized values
  rollGroup(): number[] {
    // roll the base, if any results don't pass the threshold, roll those again.
    this.base.rollGroup();
    this.rerollCount = 0;
    this.baseResults = this.base.current.slice(0);
    let active = this.baseResults.slice(1).reduce((acc, value, i) => {
      if (this.thresholdFunc(value)) {
        acc.push(i);
      }
      return acc;
    }, [] as number[]);
    if (active.length === 0) {
      return this.baseResults;
    }
    while (active.length > 0) {
      // TODO if we want to track rerolls, we do it here
      const newValue = this.reroller.value();
      this.rerollCount++;
      if (!this.thresholdFunc(newValue)) {
        this.baseResults[active[0] + 1] = newValue;
        active.shift();
      }
    }
    // TODO: this looks like it could be a performance bottleneck for very small systems
    // recompute the sum
    let sum = 0;
    for (let i = 1; i < this.baseResults.length; i++) {
      sum += this.baseResults[i];
    }
    this.baseResults[0] = sum;
    return this.baseResults;
  }
}
