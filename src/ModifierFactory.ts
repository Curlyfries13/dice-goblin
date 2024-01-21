import { DiceTerm } from './DiceTerm';
import { Modifier } from './Modifier';

export type ModifierFactory = (params: { base: DiceTerm }) => Modifier;
