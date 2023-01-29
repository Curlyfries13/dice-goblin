import Modulo from './Modulo';
import { Constant } from '../Constant';

describe('subtracts constant generators', () => {
  it.each([
    [6, 2, 0],
    [2, 3, 2],
    [2, -2, 0],
    [15, 9, 6],
  ])('given %p % %p returns %p', (a, b, result) => {
    const termA = new Constant(a);
    const termB = new Constant(b);
    const combinator = new Modulo(termA, termB);
    expect(combinator.apply()).toBe(result);
  });
});
