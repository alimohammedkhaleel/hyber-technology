import React from 'react';
import './Spinner.css';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'gold' | 'white' | 'cyan';
  text?: string;
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'gold',
  text,
  className = '',
}) => {
  return (
    <div className={`hts-spinner-wrapper ${className}`}>
      <span className={`hts-spinner ${size} ${color}`} aria-hidden="true" />
      {text && <span className="hts-spinner-text">{text}</span>}
    </div>
  );
};
