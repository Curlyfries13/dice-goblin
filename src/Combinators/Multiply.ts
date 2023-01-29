import { Combinator, CombinatorGenerator, CombinatorInput } from '../Combinator';

export default class Multiply implements Combinator {
  name = 'multiply';
  left: CombinatorInput;
  right: CombinatorInput;
  constructor(left: CombinatorInput, right: CombinatorInput) {
    this.left = left;
    this.right = right;
  }

  apply() {
    return this.left() * this.right();
  }
}

export const MultiplyGenerator: CombinatorGenerator = (left, right) => new Multiply(left, right);
