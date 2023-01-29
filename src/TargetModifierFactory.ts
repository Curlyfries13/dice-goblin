import { DiceTerm } from './DiceTerm';
import { Modifier } from './Modifier';
import { StatisticalGenerator } from './StatisticalGenerator';
import CompareMode from './CompareMode';

export type TargetModifierFactory = (params: {
  base: DiceTerm;
  target: StatisticalGenerator | undefined;
  compare: CompareMode;
}) => Modifier;
