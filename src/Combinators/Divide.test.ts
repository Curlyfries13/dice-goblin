import Divide from './Divide';
import { Constant } from '../Constant';

describe('subtracts constant generators', () => {
  it.each([
    [6, 2, 3],
    [2, 3, 2 / 3],
    [2, -2, -1],
    [0, 22, 0],
  ])('given %p - %p returns %p', (a, b, result) => {
    const termA = new Constant(a);
    const termB = new Constant(b);
    const combinator = new Divide(termA, termB);
    expect(combinator.apply()).toBe(result);
  });
});
