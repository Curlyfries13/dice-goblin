import { Modifier } from '../Modifier';
import { DiceTerm } from '../DiceTerm';

/*
 * The Drop modifier removes dice form the pool depending on if it's highest or
 * lowest in the group
 *
 * TODO Configure drop / keep defaults
 * Roll20 default is drop the lowest
 * TODO Roll20 deals with groups of rolls differently than just individual rolls.
 * e.g. {4d6+3d8}k4 rolls all 7 dice, and then drops the lowest 4
 * e.g. {4d6+2d8, 3d20+3, 5d10+1}d} rolls each roll individually, then drops whichever roll is lowest.
 * ... presumably, {4d6+2d8+3d20+3}k4 will drop whichever 5 dice are lowest, and add them all up.
 * This might be more to do with groupings
 */

export default class Drop implements Modifier {
  name = 'Drop'
  base: DiceTerm;
  baseResults: number[];
  dropQuantity: number;

  sides: number;
  count: number;
  min: number;
  max: number;
  average: number;
  current: number[];

  // TODO add exceptions in the following case(s)
  // 1) the drop number == the number of dice
  constructor(base: DiceTerm, dropQuantity: number = 1) {
    this.base = base;
    this.dropQuantity = dropQuantity;

    this.baseResults = [];
    this.current = [];
    // NOTE: this property can change when rolled
    this.count = base.count - dropQuantity;
    this.sides = base.sides;
    // these properties do not change...
    // TODO: re-evaluate the minimum if the minimum for a die is not 1
    this.min = base.min - 1 * dropQuantity;
    // TODO: re-evaluate the minimum if the maximum for a die is not the total number of sides
    this.max = base.max - base.sides * dropQuantity;
    // TODO: correctly calculate the average for this system
    this.average = base.average;
  }

  roll(): number {
    return this.rollGroup()[0];
  }

  rollGroup(): number[] {
    const base = this.base.rollGroup();
    // drop the
    this.baseResults = this.base.current.slice(0);
    // sort the results... but keep the index too
    const temp: number[][] = [];
    // skip the first element - it is the sum of the base element.
    this.baseResults.slice(1).map((element, i) => {
      temp.push([element, i]);
    })
    temp.sort((a, b) => {
      return a[0] - b[0];
    });
    // temp is now sorted ascending; slice the first elements, and filter out the original
    this.current = temp.slice(this.dropQuantity).map((valueIndex) => {
      // NOTE this is the same tricky gotcha in the Keep.ts file
      // we constructed the mapping for this by getting rid of the result at
      // index 0, but now we're retrieving the value from that original array
      return this.baseResults[valueIndex[1] + 1];
    });
    const sum = this.current.reduce((acc, curr) => {
      return acc + curr;
    });
    this.current.unshift(sum);
    return this.current;
  }
}
