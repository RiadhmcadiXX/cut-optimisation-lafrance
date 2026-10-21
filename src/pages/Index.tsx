import { useState, useCallback } from 'react';
import { Scissors, Download, RotateCcw } from 'lucide-react';
import logoAcierLafrance from '@/assets/logo-acier-lafrance.png';
import { FileDropzone } from '@/components/FileDropzone';
import { ValidationErrors } from '@/components/ValidationErrors';
import { DataPreview } from '@/components/DataPreview';
import { StatsCards } from '@/components/StatsCards';
import { CuttingPlan } from '@/components/CuttingPlan';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { parseFile } from '@/lib/parser';
import { validate } from '@/lib/validator';
import { optimize } from '@/lib/optimizer';
import { exportToCSV, exportToXLSX } from '@/lib/exporter';
import type { ParseResult, CuttingResult } from '@/lib/types';

const Index = () => {
  const [barLength, setBarLength] = useState(6000);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [cuttingResult, setCuttingResult] = useState<CuttingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setCuttingResult(null);
    setFileName(file.name);
    setLoading(true);

    try {
      const { rows, qtyCol, lenCol } = await parseFile(file);
      const result = validate(rows, qtyCol, lenCol, barLength);
      setParseResult(result);

      if (result.pieces.length > 0 && result.errors.length === 0) {
        const cutting = optimize(result.pieces, barLength);
        setCuttingResult(cutting);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [barLength]);

  const handleOptimize = useCallback(() => {
    if (!parseResult || parseResult.pieces.length === 0) return;
    const result = validate(
      parseResult.pieces.map((p, i) => ({ rowIndex: i + 2, quantity: p.quantity, length: p.length })),
      'quantity',
      'length',
      barLength
    );
    setParseResult(result);
    if (result.pieces.length > 0) {
      setCuttingResult(optimize(result.pieces, barLength));
    }
  }, [parseResult, barLength]);

  const handleReset = useCallback(() => {
    setFileName(null);
    setParseResult(null);
    setCuttingResult(null);
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoAcierLafrance} alt="Acier Lafrance Inc" className="h-9 object-contain" />
            <div>
              <h1 className="text-lg font-bold text-foreground">CUT-Master-Pro</h1>
              <p className="text-xs text-muted-foreground">Optimisation de découpe de barres</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-muted-foreground">Longueur barre :</label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={barLength}
                onChange={(e) => setBarLength(Number(e.target.value) || 6000)}
                className="w-24 text-right font-mono"
                min={100}
                step={10}
              />
              <span className="text-sm text-muted-foreground">mm</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* File upload or reset */}
        {!fileName ? (
          <FileDropzone onFile={handleFile} />
        ) : (
          <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{fileName}</span>
              {parseResult && (
                <span className="text-xs text-muted-foreground">
                  — {parseResult.pieces.length} types, {parseResult.pieces.reduce((s, p) => s + p.quantity, 0)} pièces
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {parseResult && parseResult.pieces.length > 0 && (
                <Button size="sm" variant="outline" onClick={handleOptimize}>
                  Recalculer
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Nouveau fichier
              </Button>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-8 text-muted-foreground">Chargement...</div>
        )}

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">
            {error}
          </div>
        )}

        {/* Validation errors */}
        {parseResult && <ValidationErrors errors={parseResult.errors} />}

        {/* Data preview */}
        {parseResult && <DataPreview pieces={parseResult.pieces} />}

        {/* Results */}
        {cuttingResult && (
          <>
            <StatsCards stats={cuttingResult.stats} strategy={cuttingResult.strategy} />
            <CuttingPlan bars={cuttingResult.bars} barLength={barLength} />

            {/* Export */}
            <div className="flex items-center gap-3 justify-end">
              <Button variant="outline" onClick={() => exportToCSV(cuttingResult)}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={() => exportToXLSX(cuttingResult)}>
                <Download className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </>
        )}

        {/* Fallback: show raw data if no optimization possible */}
        {parseResult && parseResult.pieces.length === 0 && parseResult.errors.length > 0 && (
          <div className="rounded-xl border bg-card p-6 text-center text-muted-foreground">
            <p className="font-medium text-foreground mb-2">Aucune optimisation possible</p>
            <p className="text-sm">Corrigez les erreurs de validation ci-dessus puis réimportez le fichier.</p>
          </div>
        )}
      </main>

      <footer className="border-t bg-card mt-12">
        <div className="container mx-auto px-6 py-6 flex flex-col items-center gap-3">
          <img src={logoAcierLafrance} alt="Acier Lafrance Inc" className="h-16 object-contain" />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Acier d'Armature Lafrance Inc — Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
