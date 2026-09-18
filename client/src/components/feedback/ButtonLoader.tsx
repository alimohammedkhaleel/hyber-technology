import React from 'react';
import { Spinner } from './Spinner';

interface ButtonLoaderProps {
  loadingText?: string;
  size?: 'sm' | 'md';
  color?: 'gold' | 'white' | 'cyan';
}

export const ButtonLoader: React.FC<ButtonLoaderProps> = ({
  loadingText = 'جاري التحميل...',
  size = 'sm',
  color = 'white',
}) => {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
      <Spinner size={size} color={color} />
      <span>{loadingText}</span>
    </div>
  );
};
