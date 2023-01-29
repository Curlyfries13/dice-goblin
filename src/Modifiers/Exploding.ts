import CompareMode from '../CompareMode';
import { Modifier } from '../Modifier';
import { SimpleDiceGroup } from '../SimpleDiceGroup';
import { DiceTerm } from '../DiceTerm';

/*
 * The Exploding mode a
dds additional logic to continue rolling
 *
 * With this modifier a roll that meets a target will roll additional dice!
 * This means that the dice count for this can't be known before a roll.
 */

export default class Exploding implements Modifier {
  name = 'Exploding'
  target: number;
  compareMode: CompareMode;
  base: DiceTerm;
  baseResults: number[];

  sides: number;
  count: number;
  min: number;
  max: number;
  average: number;
  current: number[];
  reroller: SimpleDiceGroup;

  constructor(base: DiceTerm, target?: number, compare?: CompareMode) {
    this.base = base;
    this.target = target === undefined ? this.base.sides : target;
    this.compareMode = compare === undefined ? CompareMode.Equal : compare;
    this.baseResults = [];
    this.current = [];
    // NOTE: this property can change when rolled
    this.count = base.count;
    this.sides = base.sides;
    // TODO: this property can change if the explosion target includes the
    // minimum value
    this.min = base.min;
    this.max = Infinity;
    // TODO: correctly calculate the average for this system
    this.average = base.average;
    // The reroller is a duplicate of its die, but we need an individual member
    this.reroller = new SimpleDiceGroup(this.base.sides, 1);
  }

  thresholdFunc = (value) => {
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
    // roll the base, if any results hit the threshold, roll those again.
    this.base.rollGroup();
    this.baseResults = this.base.current.slice(0);
    this.current = this.base.current.slice(0);
    // skip the first result
    let active = this.baseResults.slice(1).filter(this.thresholdFunc).length;
    // keep rerolling
    while (active > 0) {
      const subRoll: number[] = Array(active).fill(0).map(() => {
        return this.reroller.roll()
      });
      active = subRoll.filter(this.thresholdFunc).length;
      this.current = this.current.concat(subRoll);
    }
    const sum = this.current.slice(1).reduce((acc, curr) => {
      return acc + curr;
    });
    this.current[0] = sum;
    this.count = this.current.length - 1;
    // TODO there is no way to distinguish base results from modified results
    // TODO there is no way to see how exploded dice explode
    return this.current;
  }
}
