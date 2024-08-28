import Exploding from './Exploding';
import { TargetModifierFactory } from '../TargetModifierFactory';
import { DiceTerm } from '../DiceTerm';
import { StatisticalGenerator } from '../StatisticalGenerator';
import CompareMode from '../CompareMode';

const ExplodingFactory: TargetModifierFactory = (params: {
  base: DiceTerm;
  target: StatisticalGenerator | undefined;
  compare: CompareMode;
}) => new Exploding(params.base, params.target, params.compare);

export default ExplodingFactory;
