import React from 'react';
import { Coins } from 'lucide-react';

interface CreditBadgeProps {
  amount: number | string;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export const CreditBadge: React.FC<CreditBadgeProps> = ({
  amount,
  className = '',
  iconClassName = '',
  textClassName = '',
  size = 'sm',
}) => {
  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textSizes = {
    xs: 'text-[11px]',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base font-bold',
  };

  return (
    <span className={`inline-flex items-center gap-1 font-mono font-semibold tabular-nums text-amber-300 ${className}`}>
      <span className="relative flex items-center justify-center shrink-0">
        <Coins className={`${iconSizes[size]} text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)] ${iconClassName}`} />
      </span>
      <span className={`${textSizes[size]} ${textClassName}`}>
        {typeof amount === 'number' ? amount.toLocaleString() : amount}
      </span>
    </span>
  );
};
