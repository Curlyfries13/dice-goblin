import { Combinator, CombinatorGenerator, CombinatorInput } from '../Combinator';

export default class Divide implements Combinator {
  name = 'multiply';
  left: CombinatorInput;
  right: CombinatorInput;
  constructor(left: CombinatorInput, right: CombinatorInput) {
    this.left = left;
    this.right = right;
  }

  apply() {
    // TODO dividing by zero should throw an exception that shows where the
    // breakdown happens
    return this.left() / this.right();
  }
}

export const DivideGenerator: CombinatorGenerator = (left, right) => new Divide(left, right);
