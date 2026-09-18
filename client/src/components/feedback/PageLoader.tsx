import React from 'react';
import { Spinner } from './Spinner';
import { BRANDING } from '../../config/branding';

interface PageLoaderProps {
  message?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  message = 'جاري تحميل المتجر...',
}) => {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        padding: '40px 20px',
      }}
    >
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size="lg" color="gold" />
      </div>

      <div style={{ textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f3f4f6', margin: '0 0 6px' }}>
          {BRANDING.nameAr}
        </h3>
        <p style={{ fontSize: '0.9rem', color: '#9ca3af', margin: 0 }}>
          {message}
        </p>
      </div>
    </div>
  );
};
