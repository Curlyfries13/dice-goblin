import fc from 'fast-check';
import { parse } from './Parser';

describe('simple dice rolls', () => {
  it('parses simple dice specs', () => {
    fc.assert(
      fc.property(
        // number of dice
        fc.integer({ min: 1, max: 1000000 }),
        // number of sides
        fc.integer({ min: 1, max: 1000000 }),
        (n, s) => {
          const parseText = `${n}d${s}`;
          const parseResult = parse(parseText);
          expect(parseResult.lexErrors).toHaveLength(0);
          expect(parseResult.parseErrors).toHaveLength(0);
        },
      ),
    );
  });
  it('parses fudge dice', () => {
    fc.assert(
      fc.property(
        // number of dice
        fc.integer({ min: 1, max: 1000000 }),
        (n) => {
          const parseText = `${n}dF`;
          const parseResult = parse(parseText);
          expect(parseResult.lexErrors).toHaveLength(0);
          expect(parseResult.parseErrors).toHaveLength(0);
        },
      ),
    );
  });
  it('parses simple dice expressions', () => {
    fc.assert(
      fc.property(
        // number of dice
        fc.integer({ min: 1, max: 1000000 }),
        // number of sides
        fc.integer({ min: 1, max: 1000000 }),
        // modifier value3
        fc.integer({ min: 1, max: 1000000 }),
        // modifier function
        fc.integer({ min: 0, max: 3 }).map((v) => {
          if (v === 0) {
            return '+';
          } else if (v === 1) {
            return '-';
          } else if (v === 2) {
            return '*';
          } else if (v === 3) {
            return '/';
          }
        }),
        (n, s, m, f) => {
          const parseText = `${n}d${s}${f}${m}`;
          const parseResult = parse(parseText);
          expect(parseResult.lexErrors).toHaveLength(0);
          expect(parseResult.parseErrors).toHaveLength(0);
        },
      ),
    );
  });
  it('parses simple modifier expressions', () => {
    const modifiers = ['', '!', '!!', '!p', 'r', 'ro', 'd', 'k', 'dh', 'dl', 'kh', 'kl'];
    fc.assert(
      fc.property(
        fc.nat({ max: modifiers.length - 1 }),
        // number of dice
        fc.integer({ min: 1, max: 1000000 }),
        // number of sides
        fc.integer({ min: 1, max: 1000000 }),
        (index, count, sides) => {
          const parseText = `${count}d${sides}${modifiers[index]}`;
          const parseResult = parse(parseText);
          expect(parseResult.lexErrors).toHaveLength(0);
          expect(parseResult.parseErrors).toHaveLength(0);
        },
      ),
    );
  });
  it('parses magnitude modifiers with values', () => {
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
          const parseResult = parse(parseText);
          expect(parseResult.lexErrors).toHaveLength(0);
          expect(parseResult.parseErrors).toHaveLength(0);
        },
      ),
    );
  });
  it('parses target modifiers with values', () => {
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
          const parseResult = parse(parseText);
          expect(parseResult.lexErrors).toHaveLength(0);
          expect(parseResult.parseErrors).toHaveLength(0);
        },
      ),
    );
  });
});
