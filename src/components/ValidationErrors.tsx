import type { ValidationError } from '@/lib/types';
import { AlertTriangle } from 'lucide-react';

interface ValidationErrorsProps {
  errors: ValidationError[];
}

export function ValidationErrors({ errors }: ValidationErrorsProps) {
  if (errors.length === 0) return null;

  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-2">
      <div className="flex items-center gap-2 font-semibold text-destructive">
        <AlertTriangle className="w-4 h-4" />
        <span>Erreurs de validation ({errors.length})</span>
      </div>
      <ul className="space-y-1 text-sm">
        {errors.map((err, i) => (
          <li key={i} className="text-destructive/90">
            {err.rowIndex > 0 ? `Ligne ${err.rowIndex} — ` : ''}
            {err.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
