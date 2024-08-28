import Multiply from './Multiply';
import Constant from '../Constant';

describe('multiplies constant generators', () => {
  it.each([
    [3, 2, 6],
    [-2, 2, -4],
    [0, 99, 0],
  ])('given %p * %p returns %p', (a, b, result) => {
    const termA = new Constant(a);
    const termB = new Constant(b);
    const combinator = new Multiply(termA, termB);
    expect(combinator.apply()).toBe(result);
  });
});
