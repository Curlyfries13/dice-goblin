import RerollOnce from './RerollOnce';
import { TargetModifierFactory } from '../TargetModifierFactory';
import { DiceTerm } from '../DiceTerm';
import { StatisticalGenerator } from '../StatisticalGenerator';
import CompareMode from '../CompareMode';

const RerollOnceFactory: TargetModifierFactory = (params: {
  base: DiceTerm;
  target: StatisticalGenerator | undefined;
  compare: CompareMode;
}) => new RerollOnce(params.base, params.target, params.compare);

export default RerollOnceFactory;
