import Power from './Power';
import { Constant } from '../Constant';

describe('subtracts constant generators', () => {
  it.each([
    [6, 2, 36],
    [2, 3, 8],
    [2, -2, 1 / 4],
    [0, 22, 0],
    [22, 0, 1],
  ])('given %p - %p returns %p', (a, b, result) => {
    const termA = new Constant(a);
    const termB = new Constant(b);
    const combinator = new Power(termA, termB);
    expect(combinator.apply()).toBe(result);
  });
});
