import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100
  color?: 'primary' | 'secondary' | 'tertiary' | 'error' | 'auto';
  height?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color = 'auto',
  height = 'sm',
  className = '',
}) => {
  const heightClasses = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2',
  };

  let fillColor = 'bg-primary';
  if (color === 'auto') {
    if (value > 70) fillColor = 'bg-secondary';
    else if (value > 50) fillColor = 'bg-tertiary';
    else fillColor = 'bg-error';
  } else {
    const map = {
      primary: 'bg-primary',
      secondary: 'bg-secondary',
      tertiary: 'bg-tertiary',
      error: 'bg-error',
    };
    fillColor = map[color];
  }

  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className={`w-full bg-surface-container-highest rounded-full overflow-hidden ${heightClasses[height]} ${className}`}>
      <div
        className={`${fillColor} h-full transition-all duration-300 ease-out`}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
};
