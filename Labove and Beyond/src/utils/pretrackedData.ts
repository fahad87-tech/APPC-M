import { Point2D } from '../types/physics';

/**
 * Lab-ove and Beyond (Student Edition) by MR. F.
 * 
 * In this student edition, all pretracked coordinates are intentionally cleared
 * so students can discover physics principles through hands-on tracking and inquiry.
 */
export const PRETRACKED_EXPERIMENTS: Record<
  string,
  {
    sampleTrackPoints?: { frame: number; time: number; px: Point2D }[];
    sampleSeriesList?: {
      id: string;
      name: string;
      color: string;
      mass: number;
      points: { frame: number; time: number; px: Point2D }[];
    }[];
  }
> = {};
