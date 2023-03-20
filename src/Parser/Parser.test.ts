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

it.each(['1d6!', '10d6!', '2d10dl1', '4d8k2', '5d6kh2'])(
  'should parse dice expressions with modifiers %p',
  (inputText) => {
    const parseResult = parse(inputText);
    expect(parseResult.lexErrors).toHaveLength(0);
    expect(parseResult.parseErrors).toHaveLength(0);
  }
);
