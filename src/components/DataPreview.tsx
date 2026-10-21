import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PieceType } from '@/lib/types';

interface DataPreviewProps {
  pieces: PieceType[];
}

const INITIAL_ROWS = 5;

export function DataPreview({ pieces }: DataPreviewProps) {
  const [expanded, setExpanded] = useState(false);

  if (pieces.length === 0) return null;

  const totalPieces = pieces.reduce((s, p) => s + p.quantity, 0);
  const hasMore = pieces.length > INITIAL_ROWS;
  const visiblePieces = expanded ? pieces : pieces.slice(0, INITIAL_ROWS);

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Données importées</h3>
        <span className="text-sm text-muted-foreground">
          {pieces.length} types — {totalPieces} pièces
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="text-left py-2 px-3 font-medium">N°</th>
              <th className="text-right py-2 px-3 font-medium">Quantité</th>
              <th className="text-right py-2 px-3 font-medium">Longueur (mm)</th>
              <th className="text-right py-2 px-3 font-medium">Sous-total (mm)</th>
            </tr>
          </thead>
          <tbody>
            {visiblePieces.map((p) => (
              <tr key={p.id} className="border-b border-border/50 hover:bg-muted/50">
                <td className="py-2 px-3 font-mono text-muted-foreground">{p.id}</td>
                <td className="py-2 px-3 text-right font-mono">{p.quantity}</td>
                <td className="py-2 px-3 text-right font-mono">{p.length}</td>
                <td className="py-2 px-3 text-right font-mono">{p.quantity * p.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <div className="flex justify-center pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Voir moins
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Voir plus ({pieces.length - INITIAL_ROWS} restants)
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
