import Reroll from './Reroll';
import { TargetModifierFactory } from '../TargetModifierFactory';
import { DiceTerm } from '../DiceTerm';
import { StatisticalGenerator } from '../StatisticalGenerator';
import CompareMode from '../CompareMode';

const RerollFactory: TargetModifierFactory = (params: {
  base: DiceTerm;
  target: StatisticalGenerator | undefined;
  compare: CompareMode;
}) => new Reroll(params.base, params.target, params.compare);

export default RerollFactory;
