import Multiply from './Multiply';

describe('multiplies constant generators', () => {
  it.each([
    [3, 2, 6],
    [-2, 2, -4],
    [0, 99, 0],
  ])('given %p * %p returns %p', (a, b, result) => {
    const termA = () => a;
    const termB = () => b;
    const combinator = new Multiply(termA, termB);
    expect(combinator.apply()).toBe(result);
  });
});
