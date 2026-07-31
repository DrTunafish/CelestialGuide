import type { ReactNode } from 'react';

type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'gold';

type StatusBadgeProps = {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
};

const toneClass: Record<BadgeTone, string> = {
  success: 'badge badge--success',
  warning: 'badge badge--warning',
  danger: 'badge badge--danger',
  info: 'badge badge--info',
  gold: 'badge badge--gold',
};

export default function StatusBadge({ tone = 'info', children, className = '' }: StatusBadgeProps) {
  return <span className={`${toneClass[tone]} ${className}`.trim()}>{children}</span>;
}
