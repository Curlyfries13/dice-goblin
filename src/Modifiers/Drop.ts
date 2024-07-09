import { Modifier } from '../Modifier';
import { DiceTerm } from '../DiceTerm';
import { StatisticalGenerator } from '../StatisticalGenerator';
import { Constant } from '../Constant';
import KeepDropMode from './KeepDropMode';

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
  name = 'Drop';
  base: DiceTerm;
  baseResults: number[];

  dropQuantity: StatisticalGenerator;
  dropMode: KeepDropMode;

  sides: StatisticalGenerator;
  count: StatisticalGenerator;

  statProps: {
    min: number;
    max: number;
    average: number;
    periodicity: number;
  };
  current: number[];
  value: () => number;
  pdf: (value: number) => number;

  // TODO add exceptions in the following case(s)
  // 1) the drop number == the number of dice
  constructor(
    base: DiceTerm,
    dropQuantity: StatisticalGenerator = new Constant(1),
    dropMode: KeepDropMode = KeepDropMode.Low,
  ) {
    this.base = base;
    this.dropQuantity = dropQuantity;
    this.dropMode = dropMode;

    this.baseResults = [];
    this.current = [];
    this.sides = base.sides;
    // NOTE: this could lead to weirdness
    this.count = new Constant(base.count.statProps.average - dropQuantity.statProps.average);

    this.statProps = {
      // TODO: re-evaluate the minimum if the minimum for a die is not 1, or if
      // there is an unknown setup which could lead to strangeness here
      min: base.statProps.min - 1 * dropQuantity.statProps.max,
      // TODO: re-evaluate the minimum if the maximum for a die is not the total number of sides
      max: base.statProps.max - base.sides.statProps.max * dropQuantity.statProps.min,
      // TODO: correctly calculate the average for this system
      average: base.statProps.average,
      // NOTE: we expect the periodicity to be transitive
      periodicity: base.statProps.periodicity,
    };
    this.value = this.roll;
    // TODO: fully implement the PDF function for modifiers
    this.pdf = (value: number) => this.base.pdf(value);
  }

  // use simple statistics if dropping from a mono-type
  // e.g. 3d6, or 4d6,
  //
  // NOTE: _not_ tested for poly dice or groups
  simpleStatistics() {}

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
    });
    temp.sort((a, b) => {
      return a[0] - b[0];
    });
    // temp is now sorted ascending; slice the first elements, and filter out the original
    this.current = temp.slice(this.dropQuantity.value()).map((valueIndex) => {
      // NOTE this is the same tricky gotcha in the Keep.ts file
      // we constructed the mapping for this by getting rid of the result at
      // index 0, but now we're retrieving the value from that original array
      return this.baseResults[valueIndex[1] + 1];
    });
    const sum = this.current.reduce((acc, curr) => {
      return acc + curr;
    }, 0);
    this.current.unshift(sum);
    return this.current;
  }
}
