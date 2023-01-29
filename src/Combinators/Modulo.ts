import { Combinator, CombinatorGenerator, CombinatorInput } from '../Combinator';

export default class Modulo implements Combinator {
  name = 'multiply';
  left: CombinatorInput;
  right: CombinatorInput;
  constructor(left: CombinatorInput, right: CombinatorInput) {
    this.left = left;
    this.right = right;
  }

  apply() {
    return this.left() % this.right();
  }
}

export const ModuloGenerator: CombinatorGenerator = (left, right) => new Modulo(left, right);
