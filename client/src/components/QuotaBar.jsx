import { useAuth } from '../context/AuthContext';

export default function QuotaBar({ className = '' }) {
  const { quota } = useAuth();
  const remaining = quota?.remaining ?? 0;
  const total     = quota?.quota    ?? 30;
  const pct       = Math.round((remaining / total) * 100);
  const barColor  = pct > 50 ? 'bg-green-500' : pct > 20 ? 'bg-amber-400' : 'bg-red-500';
  const textColor = pct > 20 ? 'text-ink-light' : 'text-red-600';

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-ink-light">Messages aujourd'hui</span>
        <span className={`text-xs font-semibold tabular-nums ${textColor}`}>
          {remaining}/{total}
        </span>
      </div>
      <div className="h-2 bg-parchment-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {remaining === 0 && (
        <p className="text-xs text-red-500 mt-1">Quota épuisé — reviens demain !</p>
      )}
    </div>
  );
}
