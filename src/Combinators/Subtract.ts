import { Combinator, CombinatorGenerator, CombinatorInput } from '../Combinator';
/*
 * The subtract combinator is another simple combinator
 */
export default class Subtract implements Combinator {
  name = 'add';
  left: CombinatorInput;
  right: CombinatorInput;
  constructor(left: CombinatorInput, right: CombinatorInput) {
    this.left = left;
    this.right = right;
  }

  apply() {
    return this.left() - this.right();
  }
}

export const SubtractGenerator: CombinatorGenerator = (left, right) => new Subtract(left, right);
