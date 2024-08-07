import CompareMode from '../CompareMode';
import { Modifier } from '../Modifier';
import { SimpleDiceGroup } from '../SimpleDiceGroup';
import { DiceTerm } from '../DiceTerm';
import { StatisticalGenerator } from '../StatisticalGenerator';
import { Constant } from '../Constant';
import { pdfConvolution } from '../utils';

/*
 * The Reroll Once Modifier adds additional logic to the dice. Essentially, they
 * retry if the dice roll some value. This can be
 *
 */

export default class RerollOnce implements Modifier, DiceTerm {
  name = 'RerollOnce';
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

  rerollCount: number;
  // this value allows
  rerollRange: number;

  constructor(base: DiceTerm, target?: StatisticalGenerator, compare?: CompareMode) {
    this.base = base;
    // by default, a reroll happens on the minimum roll only (i.e. brutal 1's)
    // NOTE: I can't think of a way where we don't just reroll 1's
    this.target = target === undefined ? new Constant(1) : target;
    this.compareMode = compare === undefined ? CompareMode.Equal : compare;
    this.baseResults = [];
    this.current = [];
    this.sides = new Constant(base.sides.statProps.max);
    // Do not copy the base values: this causes weirdness when you try to modify their properties
    this.count = {
      value: () => {
        return this.current.length - 1;
      },
      // these properties are almost certainly not helpful
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
    // TODO: consolidate naming, this is similar for reroll. Maybe need to make
    // this consistent across all Statistical Generators
    this.rerollRange = 1;
    let averageMod = 0;
    let numerator = this.sides.statProps.average - this.target.statProps.average;
    let denominator = this.sides.statProps.average;
    if (compare === CompareMode.LessThan) {
      // NOTE this assumes that we're using dice that start at one always
      this.rerollRange = this.target.statProps.average;
      averageMod = numerator <= 0 ? 0 : numerator / denominator;
    } else if (compare === CompareMode.GreaterThan) {
      // due to greaterThan actually being greater than or equal to the target
      this.rerollRange = this.sides.statProps.average - this.target.statProps.average + 1;
      averageMod = numerator <= 0 ? 0 : -1 * (numerator / denominator);
    }

    // TODO: implement this
    this.combinatoricMagnitude = this.base.combinatoricMagnitude;
    // TODO: get the value of a dice roll targeting a specific number (average)
    this.statProps = {
      min: base.statProps.min,
      max: base.statProps.max,
      average: base.statProps.average + averageMod,
      periodicity: base.statProps.periodicity,
    };
    this.rerollCount = 0;
    // TODO: fix this for polymorphic dice?
    // The reroller is a duplicate of its die, but we need an individual member
    this.reroller = new SimpleDiceGroup(this.base.sides.statProps.max, 1);
    this.value = this.roll;
    this.pdf = (value: number) => {
      // NOTE: performance consider if this is a performance hit
      if (this.base.pdf(value) === 0) return 0;
      // this is busted for counts higher than 1
      if (
        this.base.count.statProps.min === 1 &&
        this.base.count.statProps.max === 1 &&
        this.base.sides.statProps.min === this.base.sides.statProps.max
      ) {
        if (this.thresholdFunc(value)) {
          return (1 / this.rerollRange) * this.base.pdf(value);
        } else {
          return this.base.pdf(value) + (1 / this.rerollRange) * this.base.pdf(value);
        }
      } else if (
        this.base.count.statProps.min === this.base.count.statProps.max &&
        this.base.sides.statProps.min === this.base.sides.statProps.max
      ) {
        // create a convolution sub-entity
        // NOTE: performance (this could get expensive)
        // TODO: this seems to invoke base sides twice, which could be a problem / bug
        // currently this isn't a bug because we're checking for effectively
        // _only_ working on constant exploders
        const left = new RerollOnce(new SimpleDiceGroup(this.base.sides.value(), 1), this.target, this.compareMode);
        const right = new RerollOnce(
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
    // TODO: implement this
    this.multinomial = (value: number) => this.base.multinomial(value);
  }

  thresholdFunc = (value: number): boolean => {
    // TODO: fix multiple 'r' rerolls, this is apparently a thing in the spec
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
    // console.log(`initial run: ${JSON.stringify(this.baseResults)}`);
    // console.log(`active: ${JSON.stringify(active)}`);

    if (active.length > 0) {
      // console.log(`pre-mod: ${JSON.stringify(this.baseResults)}`);
    }
    for (let i = 0; i < active.length; i++) {
      const newValue = this.reroller.value();
      // console.log(`replace ${i} value: ${this.baseResults[active[i] + 1]} => ${newValue}`);
      this.rerollCount++;
      this.baseResults[active[i] + 1] = newValue;
    }
    let sum = 0;
    for (let i = 1; i < this.baseResults.length; i++) {
      sum += this.baseResults[i];
    }
    this.baseResults[0] = sum;
    // console.log(`post - mod: ${JSON.stringify(this.baseResults)} `);
    return this.baseResults;
  }
}
