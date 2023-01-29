/*
 * Collect the configuration values for the dice engine.
 * TODO: this should probably be configured in some user-side configurable
 * location
 */

const BATCH_SIZE = 5000;
// Epsilon is the limit at which convolutions stop calculating: this is due to
// exploding dice having an infinite range
const CONVOLUTION_EPSILON = 0.0001;

export { BATCH_SIZE, CONVOLUTION_EPSILON };
