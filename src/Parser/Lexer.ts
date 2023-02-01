import chevrotain from 'chevrotain';

const Lexer = chevrotain.Lexer;
const createToken = chevrotain.createToken;

// This will be exported in the Parser definition - this pattern is taken from
// the example implementation from the chevrotain docs
const tokenVocabulary = {};

// this dice language roughly emulates the roll20 system.
// Notable exclusions are macros, abilities, queries, or dice matching

const Integer = createToken({ name: 'Integer', pattern: /0|[1-9]\d*/ });
const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /\s+/,
});

const DieSeparator = createToken({ name: 'DieSeparator', pattern: /d/ });
const Combinator = createToken({ name: 'Combinator', pattern: /(\+|-|\/|%|\*|\*\*)/ });
const FudgeDie = createToken({ name: 'FudgeDie', pattern: /F/ });
const KeepMod = createToken({ name: 'KeepMod', pattern: /k(l|h)?/ })
const DropMod = createToken({ name: 'DropMod', pattern: /d(l|h)?/ })
// const Comparison = createToken({ name: 'Comparison', pattern: '' });
const RerollMod = createToken({ name: 'RerollMod', pattern: /ro?/ });
// 'regular', compounding, or penetrating exploding
const ExplodingMod = createToken({ name: 'ExplodeMod', pattern: /!(!|p)?/ });
const Comparison = createToken({ name: 'Comparison', pattern: /=|(<|>)=?/ });
const FailurePoint = createToken({ name: 'FailurePoint', pattern: /f/ });
// grouping tokens
const LCurly = createToken({ name: "LCurly", pattern: /{/ });
const RCurly = createToken({ name: "RCurly", pattern: /}/ });
// commas only separate members of
const Comma = createToken({ name: "Comma", pattern: /,/ });
const LParen = createToken({ name: "LCurly", pattern: /\(/ });
const RParen = createToken({ name: "RCurly", pattern: /\)/ });

const allTokens = [
  WhiteSpace,
  Integer,
  DieSeparator,
  FudgeDie,
  LCurly,
  RCurly,
  LParen,
  RParen,
  Comma,
  KeepMod,
  DropMod,
  RerollMod,
  ExplodingMod,
  FailurePoint,
  Comparison
];

const DiceLexer = new Lexer(allTokens);

allTokens.forEach((tokenType) => {
  tokenVocabulary[tokenType.name] = tokenType
});

const lex = function (inputText: string) {
  const lexingResult = DiceLexer.tokenize(inputText);

  if (lexingResult.errors.length > 0) {
    throw Error("Lexing errors detected parsing dice");
  }

  return lexingResult;
}

export {
  lex,
  tokenVocabulary,
}
