import React from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  isOnline?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBvx4PgiQ3jZ_4n6eeB76G0hZCI4bG_n_5SQfqowo81L0S11YsWIupEZqyt3ExsiBfDLE-6pkvnMD8axEi32wHLsbuseWN5dNJVVazA8qAXOOr5m5e0Wo-mtDp0I8pKCm61rDJwAKMrwqnh5f2lVEmeE2jao52tJnaRCpzLUZuw1yYZBuUBS2h3D79bHIqgEQcdeigbbQSjZ2s1BUdCyWu5cd5q-Ow9N1p28z4SLqBdG4gWBLuDL8OKJg',
  alt = 'User avatar',
  size = 'md',
  isOnline = true,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-7 h-7',
    lg: 'w-9 h-9',
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <img
        src={src}
        alt={alt}
        className={`${sizeClasses[size]} rounded-sm object-cover ring-1 ring-secondary`}
      />
      {isOnline && (
        <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-secondary border border-background"></span>
      )}
    </div>
  );
};
