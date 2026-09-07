import React, { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    label: string;
    isPositive?: boolean;
  };
  highlight?: boolean;
  colorScheme?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'slate';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  highlight = false,
  colorScheme = 'indigo',
  onClick
}) => {
  const colorMap = {
    indigo: {
      bgIcon: 'bg-blue-50 text-blue-600',
      valueColor: 'text-slate-900',
      border: highlight ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-200'
    },
    emerald: {
      bgIcon: 'bg-green-50 text-green-600',
      valueColor: 'text-slate-900',
      border: highlight ? 'border-green-300 ring-2 ring-green-100' : 'border-slate-200'
    },
    amber: {
      bgIcon: 'bg-orange-50 text-orange-500',
      valueColor: 'text-orange-500',
      border: highlight ? 'border-orange-300 ring-2 ring-orange-100' : 'border-slate-200'
    },
    rose: {
      bgIcon: 'bg-red-50 text-red-600',
      valueColor: 'text-red-600',
      border: highlight ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'
    },
    sky: {
      bgIcon: 'bg-blue-50 text-blue-600',
      valueColor: 'text-blue-600',
      border: highlight ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-200'
    },
    slate: {
      bgIcon: 'bg-slate-100 text-slate-600',
      valueColor: 'text-slate-900',
      border: highlight ? 'border-slate-300 ring-2 ring-slate-100' : 'border-slate-200'
    }
  };

  const scheme = colorMap[colorScheme] || colorMap.indigo;

  return (
    <div
      onClick={onClick}
      className={`bg-white p-5 rounded-xl border shadow-sm transition-all hover:shadow-md ${
        scheme.border
      } ${onClick ? 'cursor-pointer hover:border-slate-300' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-2">
          <div className="text-slate-500 text-sm font-medium mb-1 truncate">
            {title}
          </div>
          <div className={`text-2xl sm:text-3xl font-bold tracking-tight break-words ${scheme.valueColor}`}>
            {value}
          </div>
          {subtitle && (
            <div className="mt-2 text-xs text-slate-400 font-medium truncate">
              {subtitle}
            </div>
          )}
        </div>
        <div className={`p-2.5 rounded-lg flex-shrink-0 ${scheme.bgIcon}`}>
          {icon}
        </div>
      </div>

      {trend && (
        <div className="mt-2 text-xs text-green-600 font-medium">
          {trend.label}
        </div>
      )}
    </div>
  );
};
