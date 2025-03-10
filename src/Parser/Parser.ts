import { CstParser, Lexer, createToken } from 'chevrotain';

// This will be exported in the Parser definition - this pattern is taken from
// the example implementation from the chevrotain docs
// this dice language roughly emulates the roll20 system.
// Notable exclusions are macros, abilities, queries, inline rolls, or dice matching

// this Lexer is bimodal: before and after a die separator. Once A dice
// separator is found we expect mods, after the mod is found we expect dice

// NOTE: we don't pop lexer modes, because it's essentially not necessary. We do
// need state though.  What this means is that there's a theoretical stack limit
// where we overflow.

// Integers and Whitespace are pretty much the only tokens that do not interact with this system
const Integer = createToken({ name: 'Integer', pattern: /0|[1-9]\d*/ });
// Fudge dice act like integers... but they are not.
const FudgeDie = createToken({ name: 'FudgeDie', pattern: /F/ });
// ignore whitespace
const WhiteSpace = createToken({
  name: 'WhiteSpace',
  pattern: /\s+/,
  group: Lexer.SKIPPED,
});

const Combinator = createToken({ name: 'Combinator', pattern: /(\+|-|\/|%|\*|\*\*)/ });
const DieSeparator = createToken({
  name: 'DieSeparator',
  pattern: /d/,
  push_mode: 'postDicePattern',
});
const KeepMod = createToken({ name: 'KeepMod', pattern: /k(l|h)?/, push_mode: 'dicePattern' });
const DropMod = createToken({ name: 'DropMod', pattern: /d(l|h)?/, push_mode: 'dicePattern' });
const RerollMod = createToken({ name: 'RerollMod', pattern: /ro?/, push_mode: 'dicePattern' });
const ExplodingMod = createToken({
  name: 'ExplodeMod',
  pattern: /!(!|p)?/,
  push_mode: 'dicePattern',
});
const Comparison = createToken({
  name: 'Comparison',
  pattern: /=|(<|>)=?/,
  push_mode: 'dicePattern',
});
const FailurePoint = createToken({ name: 'FailurePoint', pattern: /f/, push_mode: 'dicePattern' });

// grouping tokens
const LCurly = createToken({ name: 'LCurly', pattern: /{/, push_mode: 'dicePattern' });
const RCurly = createToken({ name: 'RCurly', pattern: /}/, push_mode: 'dicePattern' });
// commas only separate members of groups, e.g. { 3d8, 2d4 } elsewhere it's not
// clear exactly what they mean
const Comma = createToken({ name: 'Comma', pattern: /,/, push_mode: 'dicePattern' });
const LParen = createToken({ name: 'LParen', pattern: /\(/, push_mode: 'dicePattern' });
const RParen = createToken({ name: 'RParen', pattern: /\)/, push_mode: 'dicePattern' });

const commonTokens = [
  Integer,
  FudgeDie,
  WhiteSpace,
  Combinator,
  Comparison,
  FailurePoint,
  Comma,
  LParen,
  RParen,
];

const modesTokens = {
  modes: {
    dicePattern: commonTokens.concat(DieSeparator),
    postDicePattern: commonTokens.concat(KeepMod, DropMod, RerollMod, ExplodingMod),
  },
  defaultMode: 'dicePattern',
};
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

const DiceLexer = new Lexer(modesTokens);
// the Goblin parser; this emulates features of Roll 20 and Foundry TTS
// it also has a few improvements.
class DieParser extends CstParser {
  // top-level declaration
  // TODO: fix this typing issue, it may be possible to fix this w/ Chevrotain
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expression: () => any;

  constructor() {
    super(allTokens);
    // this is for 'conciseness' per the example implementations also cast as
    // any so that I don't have to worry about TS2339: we create a lot of
    // forward declarations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const $ = this as any;
    // top-level declaration to avoid tst complaints; this is handled by the
    // self validation
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
        $.OR([
          { ALT: () => $.SUBRULE1($.scalar, { LABEL: 'sides' }) },
          { ALT: () => $.CONSUME(FudgeDie) },
        ]);
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
    cst,
    lexErrors: lexResult.errors,
    parseErrors: parser.errors,
  };
};

export { DieParser, parse };
