/** A single piece type from the input file */
export interface PieceType {
  id: number;
  quantity: number;
  length: number;
}

/** A raw row before validation */
export interface RawRow {
  rowIndex: number;
  quantity: unknown;
  length: unknown;
}

/** Validation error on a specific row */
export interface ValidationError {
  rowIndex: number;
  field: string;
  message: string;
}

/** Result of file parsing + validation */
export interface ParseResult {
  pieces: PieceType[];
  errors: ValidationError[];
  rawRowCount: number;
}

/** A single piece assigned to a bar */
export interface AssignedPiece {
  pieceTypeId: number;
  length: number;
}

/** A bar in the cutting plan */
export interface CuttingBar {
  barIndex: number;
  pieces: AssignedPiece[];
  usedLength: number;
  waste: number;
  wastePercent: number;
}

/** Full optimization result */
export interface CuttingResult {
  bars: CuttingBar[];
  stats: CuttingStats;
  strategy: string;
}

/** Computed statistics */
export interface CuttingStats {
  totalDemandedLength: number;
  theoreticalMinBars: number;
  barsUsed: number;
  totalWaste: number;
  averageWastePerBar: number;
  wastePercent: number;
  barLength: number;
}

/** Configuration for the optimizer */
export interface OptimizerConfig {
  barLength: number;
}

/** Strategy function signature */
export type OptimizerStrategy = (
  pieces: number[],
  pieceTypeIds: number[],
  barLength: number
) => { bars: CuttingBar[] };
