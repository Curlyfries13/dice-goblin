import { CstParser, Lexer, createToken } from 'chevrotain';

// This will be exported in the Parser definition - this pattern is taken from
// the example implementation from the chevrotain docs
// this dice language roughly emulates the roll20 system.
// Notable exclusions are macros, abilities, queries, inline rolls, or dice matching

const Integer = createToken({ name: 'Integer', pattern: /0|[1-9]\d*/ });
const WhiteSpace = createToken({
  name: 'WhiteSpace',
  pattern: /\s+/,
});

const Combinator = createToken({ name: 'Combinator', pattern: /(\+|-|\/|%|\*|\*\*)/ });
const FudgeDie = createToken({ name: 'FudgeDie', pattern: /F/ });
const KeepMod = createToken({ name: 'KeepMod', pattern: /k(l|h)?/ });
const DropMod = createToken({ name: 'DropMod', pattern: /d(l|h)?/ });
// const Comparison = createToken({ name: 'Comparison', pattern: '' });
const RerollMod = createToken({ name: 'RerollMod', pattern: /ro?/ });
// 'regular', compounding, or penetrating exploding
const ExplodingMod = createToken({ name: 'ExplodeMod', pattern: /!(!|p)?/ });
// define the dieSeparator here, because it shares a character 'd'
const DieSeparator = createToken({ name: 'DieSeparator', pattern: /d/, longer_alt: DropMod });
const Comparison = createToken({ name: 'Comparison', pattern: /=|(<|>)=?/ });
const FailurePoint = createToken({ name: 'FailurePoint', pattern: /f/ });
// grouping tokens
const LCurly = createToken({ name: 'LCurly', pattern: /{/ });
const RCurly = createToken({ name: 'RCurly', pattern: /}/ });
// commas only separate members of
const Comma = createToken({ name: 'Comma', pattern: /,/ });
const LParen = createToken({ name: 'LParen', pattern: /\(/ });
const RParen = createToken({ name: 'RParen', pattern: /\)/ });

const allTokens = [
  WhiteSpace,
  Integer,
  DieSeparator,
  FudgeDie,
  LCurly,
  RCurly,
  LParen,
  RParen,
  Combinator,
  Comma,
  KeepMod,
  DropMod,
  RerollMod,
  ExplodingMod,
  FailurePoint,
  Comparison,
];

const DiceLexer = new Lexer(allTokens);
// the Goblin parser; this emulates features of Roll 20 and Foundry TTS
// it also has a few improvements.
class DieParser extends CstParser {
  // top-level declaration
  expression: () => any;

  constructor() {
    super(allTokens);
    // this is for 'conciseness' per the example implementations
    // also cast as any so that I don't have to worry about TS2339: we create a
    // lot of forward declarations
    const $ = this as any;
    // top-level declaration to avoid ts complaints; this is handled by
    this.expression = () => {};

    // there's a need to ignore some of the TS errors, because they'll be fixed
    // by the self Analysis
    $.RULE('expression', () => {
      $.SUBRULE($.expressionMember);
      $.OPTION(() => {
        $.CONSUME(Combinator);
        $.SUBRULE($.expression);
      });
      $.OPTION1(() => {
        $.CONSUME(Comparison);
        $.SUBRULE($.scalar);
      });
    });

    $.RULE('expressionMember', () => {
      $.OR([{ ALT: () => $.SUBRULE($.group) }, { ALT: () => $.SUBRULE($.dieExpression) }]);
    });

    $.RULE('group', () => {
      $.CONSUME(LCurly);
      $.SUBRULE($.groupElements);
      $.CONSUME(RCurly);
      $.OPTION(() => {
        $.SUBRULE($.modifier);
      });
    });

    $.RULE('groupElements', () => {
      $.AT_LEAST_ONE_SEP({
        SEP: Comma,
        DEF: () => {
          $.SUBRULE($.dieExpression);
        },
      });
    });

    $.RULE('subGroup', () => {
      $.CONSUME(LParen);
      $.SUBRULE($.expression);
      $.CONSUME(RParen);
    });

    $.RULE('scalar', () => {
      $.OR([{ ALT: () => $.CONSUME(Integer) }, { ALT: () => $.SUBRULE($.subGroup) }]);
    });

    $.RULE('modifier', () => {
      $.OR([
        {
          ALT: () => {
            $.SUBRULE($.magnitudeModifier);
            $.OPTION(() => {
              $.SUBRULE($.expressionMember, { LABEL: 'magnitude_value' });
            });
          },
        },
        {
          ALT: () => {
            $.SUBRULE($.targetModifier);
            $.OPTION1(() => {
              $.OR2([
                { ALT: () => $.SUBRULE2($.expressionMember, { LABEL: 'direct_target' }) },
                {
                  ALT: () => {
                    $.CONSUME(Comparison);
                    $.SUBRULE3($.expressionMember, { LABEL: 'comparison_target' });
                  },
                },
              ]);
            });
          },
        },
      ]);
    });

    $.RULE('magnitudeModifier', () => {
      $.OR([{ ALT: () => $.CONSUME(DropMod) }, { ALT: () => $.CONSUME(KeepMod) }]);
    });

    $.RULE('targetModifier', () => {
      $.OR([{ ALT: () => $.CONSUME(ExplodingMod) }, { ALT: () => $.CONSUME(RerollMod) }]);
    });

    $.RULE('dieExpression', () => {
      $.SUBRULE($.scalar, { LABEL: 'magnitude' });
      $.OPTION(() => {
        $.CONSUME(DieSeparator);
        $.OR([{ ALT: () => $.SUBRULE1($.scalar, { LABEL: 'sides' }) }, { ALT: () => $.CONSUME(FudgeDie) }]);
        $.OPTION1(() => {
          $.SUBRULE($.modifier);
        });
      });
    });

    this.performSelfAnalysis();
  }
}

const parser = new DieParser();
const parse = function parse(text: string) {
  const lexResult = DiceLexer.tokenize(text);
  parser.input = lexResult.tokens;
  // top level rule
  const cst = parser.expression();

  return {
    cst: cst,
    lexErrors: lexResult.errors,
    parseErrors: parser.errors,
  };
};

export { DieParser, parse };
