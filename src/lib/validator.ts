import type { RawRow, PieceType, ValidationError, ParseResult } from './types';

export function validate(
  rows: RawRow[],
  qtyCol: string | null,
  lenCol: string | null,
  barLength: number
): ParseResult {
  const errors: ValidationError[] = [];
  const pieces: PieceType[] = [];

  if (!qtyCol) {
    errors.push({ rowIndex: 0, field: 'quantité', message: 'Colonne "Quantité" introuvable. Noms acceptés : Quantité, quantite, qty, quantity' });
  }
  if (!lenCol) {
    errors.push({ rowIndex: 0, field: 'longueur', message: 'Colonne "Longueur" introuvable. Noms acceptés : Longueur, longueur_mm, length' });
  }

  if (!qtyCol || !lenCol) {
    return { pieces: [], errors, rawRowCount: rows.length };
  }

  let nextId = 1;

  for (const row of rows) {
    const { rowIndex, quantity, length } = row;

    // Skip fully empty rows
    if (quantity == null && length == null) continue;
    if (quantity === '' && length === '') continue;

    // Validate quantity
    const qty = Number(quantity);
    if (isNaN(qty) || !Number.isInteger(qty) || qty <= 0) {
      errors.push({ rowIndex, field: 'quantité', message: `Quantité invalide "${quantity}" — entier positif attendu` });
      continue;
    }

    // Validate length
    const len = Number(length);
    if (isNaN(len) || len <= 0) {
      errors.push({ rowIndex, field: 'longueur', message: `Longueur invalide "${length}" — nombre positif attendu` });
      continue;
    }

    if (len > barLength) {
      errors.push({ rowIndex, field: 'longueur', message: `Longueur ${len} mm dépasse la barre (${barLength} mm)` });
      continue;
    }

    pieces.push({ id: nextId++, quantity: qty, length: len });
  }

  return { pieces, errors, rawRowCount: rows.length };
}
