import PenetratingExploding from './PenetratingExploding';
import { TargetModifierFactory } from '../TargetModifierFactory';
import { DiceTerm } from '../DiceTerm';
import { StatisticalGenerator } from '../StatisticalGenerator';
import CompareMode from '../CompareMode';

const PenetratingExplodingFactory: TargetModifierFactory = (params: {
  base: DiceTerm;
  target: StatisticalGenerator | undefined;
  compare: CompareMode;
}) => new PenetratingExploding(params.base, params.target, params.compare);

export default PenetratingExplodingFactory;
