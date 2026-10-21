import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import type { RawRow } from './types';

const QUANTITY_ALIASES = ['quantité', 'quantite', 'qty', 'quantity', 'qté', 'qte'];
const LENGTH_ALIASES = ['longueur', 'longueur_mm', 'length', 'longueur (mm)', 'long'];

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[_\-\s()]+/g, '_').replace(/_+$/, '');
}

function findColumn(headers: string[], aliases: string[]): string | null {
  for (const h of headers) {
    const norm = normalizeHeader(h);
    if (aliases.some(a => normalizeHeader(a) === norm)) return h;
  }
  return null;
}

function rowsToRawRows(data: Record<string, unknown>[], headers: string[]): { rows: RawRow[]; qtyCol: string | null; lenCol: string | null } {
  const qtyCol = findColumn(headers, QUANTITY_ALIASES);
  const lenCol = findColumn(headers, LENGTH_ALIASES);

  const rows: RawRow[] = data.map((row, i) => ({
    rowIndex: i + 2, // 1-indexed, header is row 1
    quantity: qtyCol ? row[qtyCol] : undefined,
    length: lenCol ? row[lenCol] : undefined,
  }));

  return { rows, qtyCol, lenCol };
}

export function parseCSV(text: string): { rows: RawRow[]; qtyCol: string | null; lenCol: string | null } {
  const result = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  const headers = result.meta.fields || [];
  return rowsToRawRows(result.data, headers);
}

export function parseXLSX(buffer: ArrayBuffer): { rows: RawRow[]; qtyCol: string | null; lenCol: string | null } {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });

  const headers = data.length > 0 ? Object.keys(data[0]) : [];
  return rowsToRawRows(data, headers);
}

export function parseFile(file: File): Promise<{ rows: RawRow[]; qtyCol: string | null; lenCol: string | null }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const isCSV = file.name.toLowerCase().endsWith('.csv');

    reader.onload = (e) => {
      try {
        if (isCSV) {
          resolve(parseCSV(e.target?.result as string));
        } else {
          resolve(parseXLSX(e.target?.result as ArrayBuffer));
        }
      } catch (err) {
        reject(new Error(`Erreur de lecture du fichier: ${(err as Error).message}`));
      }
    };

    reader.onerror = () => reject(new Error('Impossible de lire le fichier'));

    if (isCSV) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
}
