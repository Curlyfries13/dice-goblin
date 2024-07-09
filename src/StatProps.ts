/**
 * Common statistics Properties that all Terms should have
 */

// TODO: add percentile stats
export interface StatProps {
  average: number;
  min: number;
  max: number;
  periodicity: number;
  // Allow arbitrary extension
  [key: string]: any;
}
