import type { CuttingStats } from '@/lib/types';
import { BarChart3, Ruler, Scissors, TrendingDown, Layers, Percent } from 'lucide-react';
import type { ReactNode } from 'react';

interface StatsCardsProps {
  stats: CuttingStats;
  strategy: string;
}

function StatCard({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-bold text-foreground font-mono">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

export function StatsCards({ stats, strategy }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <StatCard
        icon={<Ruler className="w-4 h-4" />}
        label="Longueur demandée"
        value={`${stats.totalDemandedLength.toLocaleString('fr-FR')}`}
        sub="mm"
      />
      <StatCard
        icon={<BarChart3 className="w-4 h-4" />}
        label="Min. théorique"
        value={`${stats.theoreticalMinBars}`}
        sub="barres"
      />
      <StatCard
        icon={<Layers className="w-4 h-4" />}
        label="Barres utilisées"
        value={`${stats.barsUsed}`}
        sub={strategy}
      />
      <StatCard
        icon={<Scissors className="w-4 h-4" />}
        label="Perte totale"
        value={`${stats.totalWaste.toLocaleString('fr-FR')}`}
        sub="mm"
      />
      <StatCard
        icon={<TrendingDown className="w-4 h-4" />}
        label="Perte moyenne"
        value={`${Math.round(stats.averageWastePerBar).toLocaleString('fr-FR')}`}
        sub="mm / barre"
      />
      <StatCard
        icon={<Percent className="w-4 h-4" />}
        label="Taux de perte"
        value={`${stats.wastePercent.toFixed(2)}%`}
        sub={stats.wastePercent < 5 ? 'Excellent' : stats.wastePercent < 10 ? 'Bon' : 'À améliorer'}
      />
    </div>
  );
}
