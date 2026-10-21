import * as XLSX from 'xlsx';
import type { CuttingResult } from './types';

function buildExportData(result: CuttingResult) {
  const rows: Record<string, unknown>[] = [];

  for (const bar of result.bars) {
    const pieceSummary = bar.pieces
      .map(p => `${p.length} mm`)
      .join(' + ');

    rows.push({
      'Barre N°': bar.barIndex,
      'Pièces': pieceSummary,
      'Nombre de pièces': bar.pieces.length,
      'Longueur utilisée (mm)': bar.usedLength,
      'Perte (mm)': bar.waste,
      'Taux de perte (%)': Math.round(bar.wastePercent * 100) / 100,
    });
  }

  // Summary row
  rows.push({});
  rows.push({
    'Barre N°': 'RÉSUMÉ',
    'Pièces': `Stratégie: ${result.strategy}`,
    'Nombre de pièces': '',
    'Longueur utilisée (mm)': result.stats.totalDemandedLength,
    'Perte (mm)': result.stats.totalWaste,
    'Taux de perte (%)': Math.round(result.stats.wastePercent * 100) / 100,
  });
  rows.push({
    'Barre N°': '',
    'Pièces': `Barres utilisées: ${result.stats.barsUsed} (min théorique: ${result.stats.theoreticalMinBars})`,
  });

  return rows;
}

export function exportToCSV(result: CuttingResult): void {
  const rows = buildExportData(result);
  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  downloadFile(csv, 'plan-de-coupe.csv', 'text/csv');
}

export function exportToXLSX(result: CuttingResult): void {
  const rows = buildExportData(result);
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  ws['!cols'] = [
    { wch: 10 },
    { wch: 40 },
    { wch: 16 },
    { wch: 22 },
    { wch: 14 },
    { wch: 16 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Plan de coupe');
  const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadFile(blob, 'plan-de-coupe.xlsx');
}

function downloadFile(content: string | Blob, filename: string, mime?: string): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
