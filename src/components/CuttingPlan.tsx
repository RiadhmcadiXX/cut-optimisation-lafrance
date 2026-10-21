import { useState, useMemo } from 'react';
import { Filter, ChevronDown, ArrowUpDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CuttingBar } from '@/lib/types';

interface CuttingPlanProps {
  bars: CuttingBar[];
  barLength: number;
}

const PIECE_COLORS = [
  'hsl(215, 80%, 55%)',
  'hsl(160, 60%, 45%)',
  'hsl(38, 85%, 50%)',
  'hsl(280, 55%, 55%)',
  'hsl(350, 65%, 55%)',
  'hsl(190, 70%, 45%)',
  'hsl(100, 50%, 45%)',
  'hsl(25, 80%, 55%)',
];

function getColor(typeId: number): string {
  return PIECE_COLORS[(typeId - 1) % PIECE_COLORS.length];
}

type FilterType = 'all' | 'full' | 'partial';
type SortType = 'default' | 'waste-asc' | 'waste-desc';

export function CuttingPlan({ bars, barLength }: CuttingPlanProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('default');

  const { fullBars, partialBars, filteredBars } = useMemo(() => {
    const full = bars.filter(b => b.usedLength === barLength);
    const partial = bars.filter(b => b.usedLength < barLength);
    let filtered = filter === 'all' ? [...bars] : filter === 'full' ? [...full] : [...partial];
    if (sort === 'waste-asc') filtered.sort((a, b) => a.waste - b.waste);
    else if (sort === 'waste-desc') filtered.sort((a, b) => b.waste - a.waste);
    return { fullBars: full, partialBars: partial, filteredBars: filtered };
  }, [bars, barLength, filter, sort]);

  const toggleSort = () => {
    setSort(s => s === 'default' ? 'waste-desc' : s === 'waste-desc' ? 'waste-asc' : 'default');
  };

  const filteredTotalWaste = filteredBars.reduce((s, b) => s + b.waste, 0);
  const filteredTotalUsed = filteredBars.reduce((s, b) => s + b.usedLength, 0);

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="font-semibold text-foreground">Plan de coupe</h3>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Button
            size="sm"
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className="h-7 text-xs"
          >
            Toutes
            <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[10px]">
              {bars.length}
            </Badge>
          </Button>
          <Button
            size="sm"
            variant={filter === 'full' ? 'default' : 'outline'}
            onClick={() => setFilter('full')}
            className="h-7 text-xs"
          >
            Remplies ({barLength} mm)
            <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[10px]">
              {fullBars.length}
            </Badge>
          </Button>
          <Button
            size="sm"
            variant={filter === 'partial' ? 'default' : 'outline'}
            onClick={() => setFilter('partial')}
            className="h-7 text-xs"
          >
            Avec pertes
            <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[10px]">
              {partialBars.length}
            </Badge>
          </Button>
          <div className="w-px h-5 bg-border" />
          <Button
            size="sm"
            variant={sort !== 'default' ? 'default' : 'outline'}
            onClick={toggleSort}
            className="h-7 text-xs"
          >
            <ArrowUpDown className="w-3 h-3 mr-1" />
            Pertes {sort === 'waste-desc' ? '↓' : sort === 'waste-asc' ? '↑' : ''}
          </Button>
        </div>
      </div>

      {/* Filter summary */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground border-b pb-3">
        <span>
          <strong className="text-foreground">{filteredBars.length}</strong> barre{filteredBars.length > 1 ? 's' : ''}
        </span>
        <span>
          Longueur utilisée : <strong className="text-foreground">{filteredTotalUsed.toLocaleString('fr-FR')} mm</strong>
        </span>
        <span>
          Chute totale : <strong className={filteredTotalWaste === 0 ? 'text-success' : 'text-foreground'}>
            {filteredTotalWaste.toLocaleString('fr-FR')} mm
          </strong>
        </span>
      </div>

      

      {/* Grouped Bars */}
      <div className="space-y-2">
        {(() => {
          // Group bars by their piece signature (same lengths in same order)
          const groups: { key: string; bars: typeof filteredBars; representative: typeof filteredBars[0] }[] = [];
          const groupMap = new Map<string, typeof filteredBars>();
          
          filteredBars.forEach((bar) => {
            const key = bar.pieces.map(p => `${p.length}-${p.pieceTypeId}`).join('|');
            if (!groupMap.has(key)) {
              groupMap.set(key, []);
            }
            groupMap.get(key)!.push(bar);
          });

          groupMap.forEach((groupBars, key) => {
            groups.push({ key, bars: groupBars, representative: groupBars[0] });
          });

          if (groups.length === 0) {
            return (
              <div className="text-center text-sm text-muted-foreground py-4">
                Aucune barre dans cette catégorie.
              </div>
            );
          }

          return groups.map(({ key, bars: groupBars, representative }) => (
            <Collapsible key={key}>
              <CollapsibleTrigger className="w-full">
                <div className="p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer space-y-1">
                  <div className="flex items-center gap-3">
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
                    <span className="text-sm font-semibold text-foreground whitespace-nowrap w-24 shrink-0">
                      {groupBars.length}× barre{groupBars.length > 1 ? 's' : ''}
                    </span>
                    <div className="bar-visualization flex-1">
                      {representative.pieces.map((piece, i) => (
                        <div
                          key={i}
                          className="bar-piece"
                          style={{
                            width: `${(piece.length / barLength) * 100}%`,
                            backgroundColor: getColor(piece.pieceTypeId),
                          }}
                          title={`${piece.length} mm (type ${piece.pieceTypeId})`}
                        />
                      ))}
                      {representative.waste > 0 && (
                        <div
                          className="bar-piece opacity-30"
                          style={{
                            width: `${(representative.waste / barLength) * 100}%`,
                            background: 'repeating-linear-gradient(45deg, transparent, transparent 3px, hsl(var(--muted-foreground) / 0.2) 3px, hsl(var(--muted-foreground) / 0.2) 6px)',
                          }}
                        />
                      )}
                    </div>
                    <span className={`text-xs font-mono w-20 text-right shrink-0 ${
                      representative.wastePercent < 5 ? 'text-success' : representative.wastePercent < 15 ? 'text-warning' : 'text-destructive'
                    }`}>
                      -{representative.waste} mm
                    </span>
                  </div>
                  <div className="ml-7 text-xs font-mono text-muted-foreground">
                    {representative.pieces.map(p => `${p.length}`).join(' + ')} = {representative.usedLength} mm
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-8 pl-4 border-l border-muted py-2">
                  <div className="text-xs text-muted-foreground">
                    Barres n° {groupBars.map(b => b.barIndex).join(', ')}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ));
        })()}
      </div>

      {/* Summary by length */}
      {(() => {
        const grouped = new Map<number, number>();
        filteredBars.forEach(b => {
          grouped.set(b.usedLength, (grouped.get(b.usedLength) || 0) + 1);
        });
        const sorted = [...grouped.entries()].sort((a, b) => b[0] - a[0]);
        return (
          <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">Résumé par longueur utilisée</h4>
            {sorted.map(([length, count]) => (
              <div key={length} className="flex items-center gap-2 text-sm font-mono">
                <strong className="text-foreground">{count}</strong>
                <span className="text-muted-foreground">barre{count > 1 ? 's' : ''} ×</span>
                <span className="text-foreground">{length.toLocaleString('fr-FR')} mm</span>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
