import { Combinator, CombinatorGenerator, CombinatorInput } from '../Combinator';
// TODO: I'm not a fan of relative imports, I'd like to fix the typescript config

/*
 * The add combinator is one of the simplest combinators
 */
export default class Add implements Combinator {
  name = 'add';
  left: CombinatorInput;
  right: CombinatorInput;
  constructor(left: CombinatorInput, right: CombinatorInput) {
    this.left = left;
    this.right = right;
  }

  apply() {
    return this.left() + this.right();
  }
}

export const AddGenerator: CombinatorGenerator = (left, right) => new Add(left, right);
