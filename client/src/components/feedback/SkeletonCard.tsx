import React from 'react';
import './SkeletonCard.css';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="hts-skeleton-card">
      <div className="hts-skeleton-badge hts-skeleton-shimmer" />
      <div className="hts-skeleton-image hts-skeleton-shimmer" />
      <div className="hts-skeleton-subtitle hts-skeleton-shimmer" />
      <div className="hts-skeleton-title hts-skeleton-shimmer" />
      <div className="hts-skeleton-price-row">
        <div className="hts-skeleton-price hts-skeleton-shimmer" />
        <div className="hts-skeleton-btn hts-skeleton-shimmer" />
      </div>
    </div>
  );
};
