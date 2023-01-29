import { Constant } from './Constant';
import { FudgeDiceGroup } from './FudgeDice';
import CompareMode from './CompareMode';

import { DieParser } from './Parser/Parser';
import ExplodingFactory from './Modifiers/ExplodingFactory';
import CompoundingExplodingFactory from './Modifiers/CompoundingExplodingFactory';
import PenetratingExplodingFactory from './Modifiers/PenetratingExplodingFactory';
import RerollFactory from './Modifiers/RerollFactory';
import RerollOnceFactory from './Modifiers/RerollOnceFactory';
import KeepFactory from './Modifiers/KeepFactory';
import DropFactory from './Modifiers/DropFactory';

import Add from './Combinators/Add';

import { StatisticalGenerator } from './StatisticalGenerator';
import { DiceTerm } from './DiceTerm';
import { PolyDiceGroup } from './PolyDiceGroup';
import Subtract from './Combinators/Subtract';
import Divide from './Combinators/Divide';
import Modulo from './Combinators/Modulo';
import Multiply from './Combinators/Multiply';
import Power from './Combinators/Power';
import { TargetModifierFactory } from './TargetModifierFactory';
import { MagnitudeModifierFactory } from './MagnitudeModifierFactory';

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

  // return a factory that can be passed back up
  // TODO: implement adding targets or other magnitudes
  modifier(ctx: any): {
    factory: TargetModifierFactory;
    target: number | undefined;
    compare: CompareMode;
  } {
    let factory: TargetModifierFactory;
    let target: number | undefined;
    let compare: CompareMode = CompareMode.Equal;
    if (ctx.magnitudeModifier) {
      factory = this.visit(ctx.magnitudeModifier);
    } else {
      factory = this.visit(ctx.targetModifier);
    }
    if (ctx.magnitude_value) {
      target = this.visit(ctx.magnitude_value);
    }
    if (ctx.direct_target) {
      target = this.visit(ctx.direct_target);
    }
    if (ctx.Comparison) {
      compare = this.getComparison(ctx);
    }
    if (ctx.comparison_target) {
      target = this.visit(ctx.comparison_target);
    }
    return { factory, target, compare };
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
      let modifierConfig = this.visit(ctx.modifier);
      const modifierFactory = modifierConfig.factory;
      const target = modifierConfig.target;
      const compare = modifierConfig.compare;
      // TODO: this doesn't work for capturing the final diceExpression we're
      // not capturing target, or magnitude information.  We'll probably want to
      // migrate the return function from the modifier to give all the values to
      // use the factory. At that point though, we do not need the factory?
      return modifierFactory({ base: output, target, compare });
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
