import { Coordinates, FeasibilityStatus } from '../types';

// Pure math helpers if needed for future features
// Currently the AI Service handles the heavy lifting of distance finding

export const calculateFeasibility = (minutes: number): FeasibilityStatus => {
  if (minutes < 10) return 'Highly Feasible';
  if (minutes <= 15) return 'Borderline';
  return 'Unlikely';
};