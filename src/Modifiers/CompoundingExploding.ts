import CompareMode from '../CompareMode';
import { Modifier } from '../Modifier';
import { SimpleDiceGroup } from '../SimpleDiceGroup';
import { DiceTerm } from '../DiceTerm';

/*
 * The Compounding Exploding mode adds additional logic to continue rolling
 *
 * With this modifier a roll that meets a target will roll additional dice, but these additional rolls will add themselves into the original rolls. This is a bit awkward.
 */

export default class Exploding implements Modifier {
  name = 'Compounding Exploding';
  target: number;
  compareMode: CompareMode;
  base: DiceTerm;
  baseResults: number[];

  sides: number;
  statProps: {
    count: number;
    min: number;
    max: number;
    average: number;
  };
  current: number[];
  reroller: SimpleDiceGroup;

  constructor(base: DiceTerm, target?: number, compare?: CompareMode) {
    this.base = base;
    this.target = target === undefined ? this.base.sides : target;
    this.compareMode = compare === undefined ? CompareMode.Equal : compare;
    this.baseResults = [];
    this.current = [];
    this.sides = base.sides;
    this.statProps = {
      count: base.statProps.count,
      // TODO: this property can change if the explosion target includes the
      // minimum value
      min: base.statProps.min,
      max: Infinity,
      // TODO: correctly calculate the average for this system
      average: base.statProps.average,
    };
    // The reroller is a duplicate of its die, but we need an individual member
    this.reroller = new SimpleDiceGroup(this.base.sides, 1);
  }

  thresholdFunc = (value: number) => {
    switch (this.compareMode) {
      case CompareMode.LessThan:
        // according to the Roll20 spec, '<' actually means '<='
        return value <= this.target;
      case CompareMode.GreaterThan:
        return value >= this.target;
      case CompareMode.Equal:
      default:
        return value === this.target;
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
