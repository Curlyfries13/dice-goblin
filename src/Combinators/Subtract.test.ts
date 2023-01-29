import Subtract from './Subtract';
import { Constant } from '../Constant';

describe('subtracts constant generators', () => {
  it.each([
    [3, 2, 1],
    [2, 3, -1],
  ])('given %p - %p returns %p', (a, b, result) => {
    const termA = new Constant(a);
    const termB = new Constant(b);
    const combinator = new Subtract(termA, termB);
    expect(combinator.apply()).toBe(result);
  });
});
