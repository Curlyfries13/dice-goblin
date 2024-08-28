import { Modifier } from '../Modifier';
import { DiceTerm } from '../DiceTerm';
import { StatisticalGenerator } from '../StatisticalGenerator';
import Constant from '../Constant';
import KeepDropMode from './KeepDropMode';
import { dropMultinomial } from '../utils';

/*
 * The Keep modifier removes dice form the pool if the vale is over or under a
 * target value
 *
 * Super similar to Drop, in fact it's a reciprocal of sorts
 */

export default class Keep implements Modifier {
  name = 'Keep';

  base: DiceTerm;

  baseResults: number[];

  keepQuantity: StatisticalGenerator;

  keepMode: KeepDropMode;

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

  value: () => number;

  pdf: (value: number) => number;

  multinomial: (value: number) => number;

  // TODO: add a group that handles groups of dice and allows keeping / dropping
  // from a collection
  // TODO: add exceptions in the following case(s)
  // 1) the keep number == 0
  // 2) the keep number > number of dice
  constructor(
    base: DiceTerm,
    keepQuantity: StatisticalGenerator = new Constant(1),
    keepMode: KeepDropMode = KeepDropMode.High,
  ) {
    this.base = base;
    this.keepQuantity = keepQuantity;
    this.keepMode = keepMode;

    this.baseResults = [];
    this.current = [];
    this.sides = base.sides;
    this.currentSides = base.sides.statProps.max;
    this.count = keepQuantity;
    this.currentCount = keepQuantity.statProps.max;
    this.combinatoricMagnitude = base.sides.statProps.average ** base.count.statProps.average;

    // NOTE: this property can change when rolled
    this.statProps = {
      // these properties do not change...
      // TODO: re-evaluate the minimum if the minimum for a die is not 1
      min: this.keepQuantity.statProps.average,
      // TODO: re-evaluate the minimum if the maximum for a die is not the total number of sides
      max: base.sides.statProps.max * this.keepQuantity.statProps.average,
      // TODO: correctly calculate the average for this system
      average: base.statProps.average,
      periodicity: base.statProps.periodicity,
    };
    this.value = this.roll;
    this.pdf = (value: number) =>
      this.multinomial(value) /
      (1.0 / this.base.sides.statProps.average) ** this.base.count.statProps.average;
    this.multinomial = (value: number) =>
      dropMultinomial(
        1,
        this.base.sides.statProps.max,
        1,
        this.count.statProps.max,
        this.keepMode,
        keepQuantity.statProps.max,
        value,
      );
  }

  roll(): number {
    return this.rollGroup()[0];
  }

  rollGroup(): number[] {
    this.base.rollGroup();
    this.baseResults = this.base.current.slice(0);
    // sort the results... but keep the index too
    const temp: number[][] = [];
    // skip the first element - it is the sum of the base element.
    // create a [value, index] mapping
    this.baseResults.slice(1).forEach((element, i) => {
      temp.push([element, i]);
    });
    temp.sort((a, b) => a[0] - b[0]);
    // temp is now sorted ascending; slice the last elements, and filter out the original by the index
    this.current = temp.slice(-1 * this.keepQuantity.value()).map(
      (valueIndex) =>
        // NOTE this is a tricky gotcha:
        // we constructed the value mapping by removing the sum from the base
        // element, however in this case we're retrieving the original value from
        // that array. Therefore, we're effectively working in the mapping array
        // +1. This could also be fixed during the construction of the temp array.
        this.baseResults[valueIndex[1] + 1],
    );
    const sum = this.current.reduce((acc, curr) => acc + curr);
    this.current.unshift(sum);
    return this.current;
  }
}
