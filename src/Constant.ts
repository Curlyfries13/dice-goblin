import { Term } from './Term';

export class Constant implements Term {
  sides: number;
  statProps: {
    count: number;
    min: number;
    max: number;
    average: number;
  };
  current: number[];

  constructor(value: number = 0) {
    this.sides = 0;
    this.statProps = {
      count: 0,
      min: value,
      max: value,
      average: value,
    };
    this.current = [value];
  }

  roll(): number {
    return this.statProps.max;
  }

  rollGroup(): number[] {
    return [this.statProps.max, this.statProps.max];
  }
}
