import React from 'react';
import { Link } from 'react-router-dom';

export interface NavLinkProps {
  to: string;
  icon: string;
  label: string;
  badge?: string;
  active?: boolean;
}

export const NavLink: React.FC<NavLinkProps> = ({ to, icon, label, badge, active }) => {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2 rounded-sm text-xs font-medium transition-all duration-150 ${
        active
          ? 'bg-surface-container-highest text-primary border-l-2 border-primary font-semibold'
          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
      }`}
    >
      <span
        className="material-symbols-outlined text-base"
        style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
      >
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-sm bg-surface-container-high text-primary border border-outline-variant/60">
          {badge}
        </span>
      )}
    </Link>
  );
};
