import { Term } from './Term';

export class Constant implements Term {
  sides: number;
  count: number;
  min: number;
  max: number;
  average: number;
  current: number[];

  constructor(value: number = 0) {
    this.sides = 0;
    this.count = 0;
    this.min = value;
    this.max = value;
    this.average = value;
    this.current = [value];
  }

  roll(): number {
    return this.max;
  }

  rollGroup(): number[] {
    return [this.max, this.max];
  }
}
