import React, { ReactElement } from 'react';
import logoImg from '../../../assets/images/logo/logo.png';
import { BRANDING } from '../../../config/branding';
import './Logo.css';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo = ({ size = 'md', showText = true }: LogoProps): ReactElement => {
  return (
    <div className={`app-logo-wrapper logo-${size}`}>
      <img src={logoImg} alt={BRANDING.logoAlt} className="app-logo-img" />
      {showText && (
        <div className="app-logo-text-col">
          <span className="app-logo-title">{BRANDING.shortName}</span>
          <span className="app-logo-subtitle">متعدد الخدمات</span>
        </div>
      )}
    </div>
  );
};

