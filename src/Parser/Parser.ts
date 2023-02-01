import lexer from './Lexer';
import { CstParser } from 'chevrotain';

class DieParser extends CstParser {
  constructor() {
    super(lexer.tokenVocabulary);
  }

  // this is for 'conciseness' per the other info
  const $ = this;

  $.RULE("dice", () => {

});
}
