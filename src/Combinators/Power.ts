import { Combinator, CombinatorGenerator, CombinatorInput } from '../Combinator';

export default class Power implements Combinator {
  name = 'multiply';
  left: CombinatorInput;
  right: CombinatorInput;
  constructor(left: CombinatorInput, right: CombinatorInput) {
    this.left = left;
    this.right = right;
  }

  apply() {
    return Math.pow(this.left(), this.right());
  }
}

export const PowerGenerator: CombinatorGenerator = (left, right) => new Power(left, right);
