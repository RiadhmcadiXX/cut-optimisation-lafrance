import type { CuttingBar, CuttingStats, PieceType } from './types';

export function computeStats(bars: CuttingBar[], barLength: number, pieces: PieceType[]): CuttingStats {
  const totalDemandedLength = pieces.reduce((sum, p) => sum + p.quantity * p.length, 0);
  const theoreticalMinBars = Math.ceil(totalDemandedLength / barLength);
  const barsUsed = bars.length;
  const totalWaste = barsUsed * barLength - totalDemandedLength;
  const averageWastePerBar = barsUsed > 0 ? totalWaste / barsUsed : 0;
  const wastePercent = barsUsed > 0 ? (totalWaste / (barsUsed * barLength)) * 100 : 0;

  return {
    totalDemandedLength,
    theoreticalMinBars,
    barsUsed,
    totalWaste,
    averageWastePerBar,
    wastePercent,
    barLength,
  };
}
