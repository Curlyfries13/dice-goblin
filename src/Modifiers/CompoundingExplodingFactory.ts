import CompoundingExploding from './CompoundingExploding';
import { TargetModifierFactory } from '../TargetModifierFactory';
import { DiceTerm } from '../DiceTerm';
import { StatisticalGenerator } from '../StatisticalGenerator';
import CompareMode from '../CompareMode';

const CompoundingExplodingFactory: TargetModifierFactory = (params: {
  base: DiceTerm;
  target: StatisticalGenerator | undefined;
  compare: CompareMode;
}) => new CompoundingExploding(params.base, params.target, params.compare);

export default CompoundingExplodingFactory;
