import { DiceTerm } from './DiceTerm';
import { Modifier } from './Modifier';
import { StatisticalGenerator } from './StatisticalGenerator';
import KeepDropMode from './Modifiers/KeepDropMode';

export type MagnitudeModifierFactory = (params: {
  base: DiceTerm;
  magnitude: StatisticalGenerator | undefined;
  mode: KeepDropMode | undefined;
}) => Modifier;
