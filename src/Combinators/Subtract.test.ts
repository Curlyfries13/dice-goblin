import Subtract from './Subtract';

describe('subtracts constant generators', () => {
  it.each([
    [3, 2, 1],
    [2, 3, -1],
  ])('given %p - %p returns %p', (a, b, result) => {
    const termA = () => a;
    const termB = () => b;
    const combinator = new Subtract(termA, termB);
    expect(combinator.apply()).toBe(result);
  });
});
