import interpreter from './Interpreter';
import { parse } from './Parser/Parser';

const resolver = new interpreter();

function parseDice(pattern: string) {
  const result = parse(pattern);
  return resolver.visit(result.cst);
}

export default parseDice;
