import fc from 'fast-check';
import parseDice from './index';
import { Modifier } from './Modifier';

function isModifier(object: any): object is Modifier {
  return 'name' in object;
}

describe('Parser-Interpreter integration tests', () => {
  it('it parses modifiers correctly', () => {
    const modifiers = ['!', '!!', '!p', 'r', 'ro', 'd', 'k', 'dh', 'dl', 'kh', 'kl'];
    fc.assert(
      fc.property(
        fc.nat({ max: modifiers.length - 1 }),
        // number of dice
        fc.integer({ min: 1, max: 1000000 }),
        // number of sides
        fc.integer({ min: 1, max: 1000000 }),
        (index, count, sides) => {
          const parseText = `${count}d${sides}${modifiers[index]}`;
          const parseResult = parseDice(parseText);
          expect(isModifier(parseResult)).toBe(true);
        }
      )
    );
  });
  it('it parses magnitude modifiers correctly', () => {
    const modifiers = ['d', 'k', 'dh', 'dl', 'kh', 'kl'];
    fc.assert(
      fc.property(
        fc
          .record({
            mod: fc.nat({ max: modifiers.length - 1 }),
            // number of dice
            count: fc.integer({ min: 1, max: 1000000 }),
            // number of sides
            sides: fc.integer({ min: 1, max: 1000000 }),
            magnitude: fc.integer({ min: 1, max: 1000000 }),
          })
          .filter(({ mod, count, sides, magnitude }) => count <= magnitude),
        ({ mod, count, sides, magnitude }) => {
          const parseText = `${count}d${sides}${modifiers[mod]}${magnitude}`;
          const parseResult = parseDice(parseText);
          expect(isModifier(parseResult)).toBe(true);
        }
      )
    );
  });
  it('it parses target modifiers correctly', () => {
    const modifiers = ['!', '!!', '!p'];
    const comparison = ['', '<', '>', '<=', '>=', '='];
    fc.assert(
      fc.property(
        fc
          .record({
            mod: fc.nat({ max: modifiers.length - 1 }),
            comp: fc.nat({ max: comparison.length - 1 }),
            // number of dice
            count: fc.integer({ min: 1, max: 1000000 }),
            // number of sides
            sides: fc.integer({ min: 1, max: 1000000 }),
            target: fc.integer({ min: 1, max: 1000000 }),
          })
          .filter(({ mod, count, sides, target }) => sides <= target),
        ({ mod, comp, count, sides, target }) => {
          const parseText = `${count}d${sides}${modifiers[mod]}${comparison[comp]}${target}`;
          const parseResult = parseDice(parseText);
          expect(isModifier(parseResult)).toBe(true);
        }
      )
    );
  });
});
