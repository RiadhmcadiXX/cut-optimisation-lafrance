import type { PieceType, CuttingBar, CuttingResult, AssignedPiece, OptimizerStrategy } from './types';
import { computeStats } from './statistics';

/** Expand piece types into individual pieces, sorted descending */
function expandAndSort(pieces: PieceType[]): { lengths: number[]; typeIds: number[] } {
  const expanded: { length: number; typeId: number }[] = [];
  for (const p of pieces) {
    for (let i = 0; i < p.quantity; i++) {
      expanded.push({ length: p.length, typeId: p.id });
    }
  }
  // Stable sort descending by length, then by typeId for determinism
  expanded.sort((a, b) => b.length - a.length || a.typeId - b.typeId);
  return {
    lengths: expanded.map(e => e.length),
    typeIds: expanded.map(e => e.typeId),
  };
}

/** Internal bar representation for strategies */
interface WorkBar {
  pieces: AssignedPiece[];
  remaining: number;
}

/** Convert working bars to CuttingBar[] */
function toOutputBars(bars: WorkBar[], barLength: number): CuttingBar[] {
  return bars.map((b, i) => {
    const usedLength = barLength - b.remaining;
    return {
      barIndex: i + 1,
      pieces: b.pieces,
      usedLength,
      waste: b.remaining,
      wastePercent: (b.remaining / barLength) * 100,
    };
  });
}

/** First Fit Decreasing */
const firstFitDecreasing: OptimizerStrategy = (pieces, pieceTypeIds, barLength) => {
  const bars: WorkBar[] = [];

  for (let i = 0; i < pieces.length; i++) {
    const len = pieces[i];
    const typeId = pieceTypeIds[i];
    let placed = false;

    for (const bar of bars) {
      if (bar.remaining >= len) {
        bar.pieces.push({ pieceTypeId: typeId, length: len });
        bar.remaining -= len;
        placed = true;
        break;
      }
    }

    if (!placed) {
      bars.push({
        pieces: [{ pieceTypeId: typeId, length: len }],
        remaining: barLength - len,
      });
    }
  }

  return { bars: toOutputBars(bars, barLength) };
};

/** Best Fit Decreasing */
const bestFitDecreasing: OptimizerStrategy = (pieces, pieceTypeIds, barLength) => {
  const bars: WorkBar[] = [];

  for (let i = 0; i < pieces.length; i++) {
    const len = pieces[i];
    const typeId = pieceTypeIds[i];
    let bestIdx = -1;
    let bestRemaining = barLength + 1;

    for (let j = 0; j < bars.length; j++) {
      if (bars[j].remaining >= len && bars[j].remaining - len < bestRemaining) {
        bestRemaining = bars[j].remaining - len;
        bestIdx = j;
      }
    }

    if (bestIdx >= 0) {
      bars[bestIdx].pieces.push({ pieceTypeId: typeId, length: len });
      bars[bestIdx].remaining -= len;
    } else {
      bars.push({
        pieces: [{ pieceTypeId: typeId, length: len }],
        remaining: barLength - len,
      });
    }
  }

  return { bars: toOutputBars(bars, barLength) };
};

/** Local improvement: try to eliminate bars by redistributing their pieces */
function tryEliminateBars(bars: WorkBar[], barLength: number): boolean {
  // Sort bars by remaining desc (emptiest first = best candidates for elimination)
  bars.sort((a, b) => b.remaining - a.remaining);

  for (let i = bars.length - 1; i >= 0; i--) {
    const candidate = bars[i];
    const piecesToPlace = [...candidate.pieces];
    // Sort pieces descending for better packing
    piecesToPlace.sort((a, b) => b.length - a.length);

    // Try to fit all pieces of this bar into other bars
    const placements: { pieceIdx: number; barIdx: number }[] = [];
    const tempRemaining = bars.map(b => b.remaining);
    // Don't use the candidate bar itself
    tempRemaining[i] = -1;

    let allPlaced = true;
    for (let p = 0; p < piecesToPlace.length; p++) {
      const len = piecesToPlace[p].length;
      // Best fit into other bars
      let bestBar = -1;
      let bestRem = barLength + 1;
      for (let j = 0; j < bars.length; j++) {
        if (j === i) continue;
        if (tempRemaining[j] >= len && tempRemaining[j] - len < bestRem) {
          bestRem = tempRemaining[j] - len;
          bestBar = j;
        }
      }
      if (bestBar >= 0) {
        placements.push({ pieceIdx: p, barIdx: bestBar });
        tempRemaining[bestBar] -= len;
      } else {
        allPlaced = false;
        break;
      }
    }

    if (allPlaced) {
      // Apply the redistribution
      for (const pl of placements) {
        const piece = piecesToPlace[pl.pieceIdx];
        bars[pl.barIdx].pieces.push(piece);
        bars[pl.barIdx].remaining -= piece.length;
      }
      bars.splice(i, 1);
      return true; // Improved, caller should retry
    }
  }
  return false;
}

/** Local improvement: try swapping pieces between bars to free up space */
function trySwapPieces(bars: WorkBar[], _barLength: number): boolean {
  for (let i = 0; i < bars.length; i++) {
    for (let j = i + 1; j < bars.length; j++) {
      for (let pi = 0; pi < bars[i].pieces.length; pi++) {
        for (let pj = 0; pj < bars[j].pieces.length; pj++) {
          const pieceI = bars[i].pieces[pi];
          const pieceJ = bars[j].pieces[pj];
          const diff = pieceI.length - pieceJ.length;

          // Swap only if it makes the more-full bar fuller (reduces max waste)
          if (diff > 0 && bars[j].remaining >= diff) {
            // This swap moves a larger piece to bar j and smaller to bar i
            // Only useful if it helps eliminate a bar later
            const wasteI_before = bars[i].remaining;
            const wasteJ_before = bars[j].remaining;
            const wasteI_after = wasteI_before + diff;
            const wasteJ_after = wasteJ_before - diff;

            // Accept if it concentrates waste (makes one bar emptier)
            if (Math.max(wasteI_after, wasteJ_after) > Math.max(wasteI_before, wasteJ_before)) {
              bars[i].pieces[pi] = pieceJ;
              bars[j].pieces[pj] = pieceI;
              bars[i].remaining = wasteI_after;
              bars[j].remaining = wasteJ_after;
              return true;
            }
          } else if (diff < 0 && bars[i].remaining >= -diff) {
            const wasteI_before = bars[i].remaining;
            const wasteJ_before = bars[j].remaining;
            const wasteI_after = wasteI_before + diff;
            const wasteJ_after = wasteJ_before - diff;

            if (Math.max(wasteI_after, wasteJ_after) > Math.max(wasteI_before, wasteJ_before)) {
              bars[i].pieces[pi] = pieceJ;
              bars[j].pieces[pj] = pieceI;
              bars[i].remaining = wasteI_after;
              bars[j].remaining = wasteJ_after;
              return true;
            }
          }
        }
      }
    }
  }
  return false;
}

/** Local improvement: move a piece from one bar to another */
function tryMovePieces(bars: WorkBar[], _barLength: number): boolean {
  for (let i = 0; i < bars.length; i++) {
    for (let pi = 0; pi < bars[i].pieces.length; pi++) {
      const piece = bars[i].pieces[pi];
      // Try to move piece to bar with best fit
      let bestBar = -1;
      let bestRem = bars[i].remaining + piece.length; // Only move if target fits better

      for (let j = 0; j < bars.length; j++) {
        if (j === i) continue;
        if (bars[j].remaining >= piece.length && bars[j].remaining - piece.length < bestRem) {
          bestRem = bars[j].remaining - piece.length;
          bestBar = j;
        }
      }

      if (bestBar >= 0) {
        bars[bestBar].pieces.push(piece);
        bars[bestBar].remaining -= piece.length;
        bars[i].pieces.splice(pi, 1);
        bars[i].remaining += piece.length;

        // If bar i is now empty, remove it
        if (bars[i].pieces.length === 0) {
          bars.splice(i, 1);
          return true;
        }
      }
    }
  }
  return false;
}

/** Apply local improvement to a solution */
function improvePlanLocally(inputBars: CuttingBar[], barLength: number): { bars: CuttingBar[]; improved: boolean } {
  // Convert to working representation
  const bars: WorkBar[] = inputBars.map(b => ({
    pieces: [...b.pieces],
    remaining: b.waste,
  }));

  const initialCount = bars.length;
  const maxIterations = 500;
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;
    // Priority: eliminate > move > swap
    if (tryEliminateBars(bars, barLength)) continue;
    if (tryMovePieces(bars, barLength)) continue;
    if (trySwapPieces(bars, barLength)) continue;
    break; // No improvement found
  }

  const improved = bars.length < initialCount;

  if (typeof console !== 'undefined') {
    console.log(`[OptiCoupe] Local improvement: ${initialCount} → ${bars.length} bars (${iterations} iterations)`);
  }

  return { bars: toOutputBars(bars, barLength), improved };
}

/** Compare two plans: return the better one */
function comparePlans(
  a: { bars: CuttingBar[]; waste: number },
  b: { bars: CuttingBar[]; waste: number }
): 'a' | 'b' {
  // Fewer bars wins
  if (a.bars.length < b.bars.length) return 'a';
  if (b.bars.length < a.bars.length) return 'b';
  // Less waste wins
  if (a.waste <= b.waste) return 'a';
  return 'b';
}

/** Run FFD + BFD, pick best, then apply local improvement */
export function optimize(pieces: PieceType[], barLength: number): CuttingResult {
  const { lengths, typeIds } = expandAndSort(pieces);

  const ffd = firstFitDecreasing(lengths, typeIds, barLength);
  const bfd = bestFitDecreasing(lengths, typeIds, barLength);

  const ffdWaste = ffd.bars.reduce((s, b) => s + b.waste, 0);
  const bfdWaste = bfd.bars.reduce((s, b) => s + b.waste, 0);

  if (typeof console !== 'undefined') {
    console.log(`[OptiCoupe] FFD: ${ffd.bars.length} bars, waste=${ffdWaste}`);
    console.log(`[OptiCoupe] BFD: ${bfd.bars.length} bars, waste=${bfdWaste}`);
  }

  // Pick best heuristic
  const winner = comparePlans(
    { bars: ffd.bars, waste: ffdWaste },
    { bars: bfd.bars, waste: bfdWaste }
  );
  let best = winner === 'a' ? ffd : bfd;
  let strategy = winner === 'a' ? 'First Fit Decreasing' : 'Best Fit Decreasing';

  if (typeof console !== 'undefined') {
    console.log(`[OptiCoupe] Best heuristic: ${strategy}`);
  }

  // Apply local improvement
  const { bars: improvedBars, improved } = improvePlanLocally(best.bars, barLength);
  if (improved) {
    best = { bars: improvedBars };
    strategy += ' + Local Improvement';
  }

  const stats = computeStats(best.bars, barLength, pieces);

  if (typeof console !== 'undefined') {
    console.log(`[OptiCoupe] Final: ${stats.barsUsed} bars, waste=${stats.totalWaste}, rate=${stats.wastePercent.toFixed(2)}%`);
  }

  return { bars: best.bars, stats, strategy };
}
