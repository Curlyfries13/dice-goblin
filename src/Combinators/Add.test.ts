import Add from './Add';
import { Constant } from '../Constant';
import { PolyDiceGroup } from '../PolyDiceGroup';

it('should add two constant generators', () => {
  const termA = new Constant(1);
  const termB = new Constant(4);
  const combinator = new Add(termA, termB);
  expect(combinator.apply()).toBe(5);
});

it('should add two dice generators with proper statistical props', () => {
  const termA = new PolyDiceGroup(new Constant(6), new Constant(3));
  const termB = new PolyDiceGroup(new Constant(10), new Constant(2));
  const combinator = new Add(termA, termB);
  expect(combinator.statProps.min).toBe(5);
  expect(combinator.statProps.max).toBe(38);
});
