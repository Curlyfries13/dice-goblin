import Add from './Add';

it('should add two constant generators', () => {
  const termA = () => 1;
  const termB = () => 4;
  const combinator = new Add(termA, termB);
  expect(combinator.apply()).toBe(5);
});
