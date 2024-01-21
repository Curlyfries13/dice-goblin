import { parse } from './Parser';

it.each(['3d6', '1d20', '1d100'])('should parse simple dice expressions: %p', (inputText) => {
  const parseResult = parse(inputText);
  expect(parseResult.lexErrors).toHaveLength(0);
  expect(parseResult.parseErrors).toHaveLength(0);
});

it.each(['1d20+5', '2d10+4', '3dF+2'])('should parse simple dice expressions with modifiers %p', (inputText) => {
  const parseResult = parse(inputText);
  expect(parseResult.lexErrors).toHaveLength(0);
  expect(parseResult.parseErrors).toHaveLength(0);
});

it.each(['1d6!', '2d6!<2', '3d8!2', '10d6!', '2d10dl1', '4d8k2', '5d6kh2', '6d8d', '3d6d2'])(
  'should parse dice expressions with modifiers %p',
  (inputText) => {
    const parseResult = parse(inputText);
    expect(parseResult.lexErrors).toHaveLength(0);
    expect(parseResult.parseErrors).toHaveLength(0);
  }
);

it.each(['6d6d2', '4d8k3'])('should parse modifier expressions with magnitudes %p', (inputText) => {
  const parseResult = parse(inputText);
  expect(parseResult.lexErrors).toHaveLength(0);
  expect(parseResult.parseErrors).toHaveLength(0);
});
