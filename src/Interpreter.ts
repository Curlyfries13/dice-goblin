import { CstNode, ILexingError, IRecognitionException } from 'chevrotain';

import { Constant } from './Constant';
import { FudgeDiceGroup } from './FudgeDice';
import CompareMode from './CompareMode';
import { DieParser } from './Parser/Parser';
import { PolyDiceGroup } from './PolyDiceGroup';

import ExplodingFactory from './Modifiers/ExplodingFactory';
import CompoundingExplodingFactory from './Modifiers/CompoundingExplodingFactory';
import PenetratingExplodingFactory from './Modifiers/PenetratingExplodingFactory';
import RerollFactory from './Modifiers/RerollFactory';
import RerollOnceFactory from './Modifiers/RerollOnceFactory';
import KeepFactory from './Modifiers/KeepFactory';
import DropFactory from './Modifiers/DropFactory';
import KeepDropMode from './Modifiers/KeepDropMode';

import { StatisticalGenerator } from './StatisticalGenerator';
import { DiceTerm } from './DiceTerm';
import Add from './Combinators/Add';
import Subtract from './Combinators/Subtract';
import Divide from './Combinators/Divide';
import Modulo from './Combinators/Modulo';
import Multiply from './Combinators/Multiply';
import Power from './Combinators/Power';
import { ModifierFactory } from './ModifierFactory';
import { TargetModifierFactory } from './TargetModifierFactory';
import { MagnitudeModifierFactory } from './MagnitudeModifierFactory';
import { Modifier } from './Modifier';

/**
 * The Parser from Chevrotain produces a tree
 * The Roll engine can roll any combination of dice
 * This Interpreter moves the result from the tree to execution
 */
const parserInstance = new DieParser();
const BaseDiceVisitor = parserInstance.getBaseCstVisitorConstructor();

class DieToAstVisitor extends BaseDiceVisitor {
  constructor() {
    super();
    this.validateVisitor();
  }

  // Silence the TS compiler
  // TODO: it may be possible to fix the typing from the visit method using chevrotain.

  expression(ctx: any) {
    // an expression is represented by a "roll" which is a series of expressions
    // and combinators.
    const left = this.visit(ctx.expressionMember);
    if (ctx.Combinator) {
      // get the right value
      const combinator = ctx.Combinator[0].image;
      const right = this.visit(ctx.expression);
      switch (combinator) {
        case '+':
          return new Add(left, right);
        case '-':
          return new Subtract(left, right);
        case '/':
          return new Divide(left, right);
        case '%':
          return new Modulo(left, right);
        case '*':
          return new Multiply(left, right);
        case '**':
          return new Power(left, right);
        // not sure what to do about defaulting
      }
      // get the combination
    } else if (ctx.Comparison) {
      // TODO: implement comparison
    } else {
      return left;
    }
  }

  expressionMember(ctx: any): StatisticalGenerator {
    if (ctx.group) {
      return this.visit(ctx.group);
    } else {
      return this.visit(ctx.dieExpression);
    }
  }

  group(ctx: any): StatisticalGenerator {
    // implicitly we add members of a group and then apply any modifiers
    // NOTE: skip lexer chain
    const groupElements = this.visit(ctx.groupElements);
    if (groupElements.length === 1) {
      return groupElements[0];
    } else {
      // combine all groups
      // TODO: fix this to allow modifiers to operate correctly, currently it
      // just bunches them all together
      const subExpression = groupElements.reduce((acc: StatisticalGenerator, curr: StatisticalGenerator) => {
        return new Add(acc, curr);
      });
      return subExpression;
    }
  }

  groupElements(ctx: any): DiceTerm[] {
    const subResults: DiceTerm[] = ctx.dieExpression.map((diceToken: any) => this.visit(ctx.dieExpression));
    return subResults;
  }

  magnitudeModifier(ctx: any): MagnitudeModifierFactory {
    if (ctx.DropMod) {
      return DropFactory;
    } else {
      // TODO: don't always assume this is a keep mod, and add interpreter error codes
      // Should be keep mod
      return KeepFactory;
    }
  }

  targetModifier(ctx: any): TargetModifierFactory {
    if (ctx.ExplodeMod) {
      if (ctx.ExplodeMod[0].image === '!p') {
        return PenetratingExplodingFactory;
      } else if (ctx.ExplodeMod[0].image === '!!') {
        return CompoundingExplodingFactory;
      } else {
        return ExplodingFactory;
      }
    } else {
      if (ctx.RerollMod[0].image === 'ro') {
        return RerollOnceFactory;
      } else {
        return RerollFactory;
      }
    }
  }

  // give me a function that takes a base
  modifier(ctx: any): ModifierFactory {
    let factory: TargetModifierFactory | MagnitudeModifierFactory;
    let compare: CompareMode = CompareMode.Equal;
    let kdMode: KeepDropMode | undefined;
    let statGen: StatisticalGenerator;
    let isMagnitude = true;
    if (ctx.magnitudeModifier) {
      isMagnitude = true;
      factory = this.visit(ctx.magnitudeModifier);
    } else {
      isMagnitude = false;
      factory = this.visit(ctx.targetModifier);
    }
    if (ctx.magnitude_value) {
      statGen = this.visit(ctx.magnitude_value);
    }
    if (ctx.direct_target) {
      statGen = this.visit(ctx.direct_target);
    }
    if (ctx.Comparison) {
      compare = this.getComparison(ctx);
    }
    if (ctx.comparison_target) {
      statGen = this.visit(ctx.comparison_target);
    }
    const out = ({ base }: { base: DiceTerm }): Modifier => {
      if (isMagnitude) {
        const resolved: MagnitudeModifierFactory = factory as MagnitudeModifierFactory;
        return resolved({
          base,
          magnitude: statGen,
          mode: kdMode,
        });
      } else {
        const resolved: TargetModifierFactory = factory as TargetModifierFactory;
        return resolved({
          base,
          target: statGen,
          compare: compare,
        });
      }
    };
    return out;
  }

  // funnily enough, a die expression can literally be a single value?
  dieExpression(ctx: any): StatisticalGenerator {
    let magnitude = this.visit(ctx.magnitude);
    // the output of a dieExpression
    let output: StatisticalGenerator;

    if (!ctx.DieSeparator) {
      // no die separator in this die expression - this is a scalar (captured by magnitude)
      return magnitude;
    } else if (ctx.FudgeDice) {
      output = new FudgeDiceGroup(magnitude);
    } else {
      // get the number of sides
      let sides = this.visit(ctx.sides);
      output = new PolyDiceGroup(sides, magnitude);
    }
    // check for modifiers: they are optional
    if (ctx.modifier) {
      let modifierFactory = this.visit(ctx.modifier);
      return modifierFactory({ base: output });
    }
    return output;
  }

  // TODO: resolve code smell: there is a secret external dependency for bare
  // array access
  getComparison(ctx: any): CompareMode {
    if (ctx.Comparison[0].image === '>') {
      return CompareMode.GreaterThan;
    }
    if (ctx.Comparison[0].image === '<') {
      return CompareMode.LessThan;
    }
    return CompareMode.Equal;
  }

  scalar(ctx: any): StatisticalGenerator {
    if (ctx.Integer) {
      const constant = new Constant(parseInt(ctx.Integer[0].image));
      return constant;
    } else {
      const subGroup = this.visit(ctx.subGroup);
      return subGroup;
    }
  }

  subGroup(ctx: any): StatisticalGenerator {
    // we only care about the expression inside, but we may want to add
    // additional information for the editor
    const result = this.visit(ctx.expression);
    return result;
  }

  // Tokens should be analyzed in their subrule
  /*
  Integer(ctx: any): Constant {
    // this shouldn't fail: the pattern for this token should always work.
    console.log(`got integer pattern: ${ctx.image}`);
    return new Constant(parseInt(ctx.image));
  }
  */
}

export default DieToAstVisitor;
