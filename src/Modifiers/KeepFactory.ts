import Keep from './Keep';
import { DiceTerm } from '../DiceTerm';
import { StatisticalGenerator } from '../StatisticalGenerator';
import { MagnitudeModifierFactory } from '../MagnitudeModifierFactory';
import KeepDropMode from './KeepDropMode';

const KeepFactory: MagnitudeModifierFactory = (params: {
  base: DiceTerm;
  magnitude: StatisticalGenerator | undefined;
  mode: KeepDropMode | undefined;
}) => new Keep(params.base, params.magnitude, params.mode);

export default KeepFactory;
