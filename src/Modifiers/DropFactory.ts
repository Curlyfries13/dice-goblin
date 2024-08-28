import Drop from './Drop';
import { MagnitudeModifierFactory } from '../MagnitudeModifierFactory';
import { DiceTerm } from '../DiceTerm';
import { StatisticalGenerator } from '../StatisticalGenerator';
import KeepDropMode from './KeepDropMode';

const DropFactory: MagnitudeModifierFactory = (params: {
  base: DiceTerm;
  magnitude: StatisticalGenerator | undefined;
  mode: KeepDropMode | undefined;
}) => new Drop(params.base, params.magnitude, params.mode);

export default DropFactory;
