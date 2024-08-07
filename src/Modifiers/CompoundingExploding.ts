import CompareMode from '../CompareMode';
import { Constant } from '../Constant';
import { Modifier } from '../Modifier';
import { SimpleDiceGroup } from '../SimpleDiceGroup';
import { DiceTerm } from '../DiceTerm';
import { StatisticalGenerator } from '../StatisticalGenerator';

/*
 * The Compounding Exploding mode adds additional logic to continue rolling
 *
 * With this modifier a roll that meets a target will roll additional dice, but
 * these additional rolls will add themselves into the original rolls. This is a
 * bit awkward.
 */

export default class CompoundingExploding implements Modifier {
  name = 'Compounding Exploding';
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
  reroller: SimpleDiceGroup;
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
    // TODO properly calculate the count for this modifier
    this.count = base.count;
    // there's technically an infinite number of combinations
    this.combinatoricMagnitude = Infinity;
    this.statProps = {
      // TODO: this property can change if the explosion target includes the
      // minimum value
      min: base.statProps.min,
      max: Infinity,
      // TODO: correctly calculate the average for this system
      average: base.statProps.average,
      periodicity: base.sides.statProps.max,
    };
    // The reroller is a duplicate of its die, but we need an individual member
    this.reroller = new SimpleDiceGroup(this.base.sides.value(), 1);
    this.value = this.roll;
    // TODO: fully implement the PDF function for this modifier
    this.pdf = (value: number) => this.base.pdf(value);
    // TODO: fully implement multinomial function for this modifier
    this.multinomial = (value: number) => this.base.multinomial(value);
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
    let activeMap = this.baseResults.slice(1).map(this.thresholdFunc);
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
    const sum = this.current.slice(1).reduce((acc, curr) => {
      return acc + curr;
    });
    this.current[0] = sum;
    return this.current;
  }
}
