import React, { ReactNode, ReactElement } from 'react';

export interface BadgeProps {
  variant?: 'gold' | 'success' | 'warning' | 'danger' | 'neutral';
  children: ReactNode;
  icon?: ReactNode;
}

export const Badge = ({
  variant = 'neutral',
  children,
  icon,
}: BadgeProps): ReactElement => {
  return (
    <span className={`badge badge-${variant}`}>
      {icon && <span className="badge-icon">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
