import { Modifier } from '../Modifier';
import { DiceTerm } from '../DiceTerm';

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
  keepQuantity: number;

  sides: number;
  statProps: {
    count: number;
    min: number;
    max: number;
    average: number;
  };
  current: number[];

  // NOTE this is the same as dropping, but in the reciprocal
  // TODO add exceptions in the following case(s)
  // 1) the keep number == 0
  // 2) the keep number > number of dice
  constructor(base: DiceTerm, keepQuantity: number = 1) {
    this.base = base;
    this.keepQuantity = keepQuantity;

    this.baseResults = [];
    this.current = [];
    this.sides = base.sides;
    // NOTE: this property can change when rolled
    this.statProps = {
      count: keepQuantity,
      // these properties do not change...
      // TODO: re-evaluate the minimum if the minimum for a die is not 1
      min: 1 * keepQuantity,
      // TODO: re-evaluate the minimum if the maximum for a die is not the total number of sides
      max: base.sides * keepQuantity,
      // TODO: correctly calculate the average for this system
      average: base.statProps.average,
    };
  }

  roll(): number {
    return this.rollGroup()[0];
  }

  rollGroup(): number[] {
    const base = this.base.rollGroup();
    this.baseResults = this.base.current.slice(0);
    // sort the results... but keep the index too
    const temp: number[][] = [];
    // skip the first element - it is the sum of the base element.
    // create a [value, index] mapping
    this.baseResults.slice(1).map((element, i) => {
      temp.push([element, i]);
    });
    temp.sort((a, b) => {
      return a[0] - b[0];
    });
    // temp is now sorted ascending; slice the last elements, and filter out the original by the index
    this.current = temp.slice(-1 * this.keepQuantity).map((valueIndex) => {
      // NOTE this is a tricky gotcha:
      // we constructed the value mapping by removing the sum from the base
      // element, however in this case we're retrieving the original value from
      // that array. Therefore, we're effectively working in the mapping array
      // +1. This could also be fixed during the construction of the temp array.
      return this.baseResults[valueIndex[1] + 1];
    });
    const sum = this.current.reduce((acc, curr) => {
      return acc + curr;
    });
    this.current.unshift(sum);
    return this.current;
  }
}
