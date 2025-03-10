import parseDice from 'index';
import { Modifier } from 'Modifier';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isModifier(object: any): object is Modifier {
  return 'name' in object;
}

it.each(['1d20!', '1d8r2', '1d4r(1d4)', '3d6r', '1d20d'])(
  'it parses modifiers correctly: %p',
  (inputText) => {
    const parseResult = parseDice(inputText);
    expect(isModifier(parseResult)).toBeTruthy();
  },
);
