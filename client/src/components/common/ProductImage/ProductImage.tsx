import React, { useState } from 'react';
import { Tv, Camera, HardDrive, Wifi, Zap, Cpu, Box, Layers } from 'lucide-react';
import './ProductImage.css';

interface ProductImageProps {
  src?: string | null;
  alt: string;
  categorySlug?: string;
  categoryName?: string;
  className?: string;
  aspectRatio?: 'square' | 'wide' | 'tall';
  loading?: 'lazy' | 'eager';
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  categorySlug = '',
  categoryName = '',
  className = '',
  aspectRatio = 'square',
  loading = 'lazy',
}) => {
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Normalize image URL: if relative path like /uploads/..., use it directly
  const imageSrc = src && typeof src === 'string' && src.trim() !== '' ? src.trim() : null;

  const getCategoryIcon = () => {
    const slug = (categorySlug || '').toLowerCase();
    const name = (categoryName || '').toLowerCase();

    if (slug.includes('screen') || slug.includes('tv') || name.includes('شاش')) {
      return <Tv size={36} className="product-fallback-icon" />;
    }
    if (slug.includes('camera') || slug.includes('security') || name.includes('كامير')) {
      return <Camera size={36} className="product-fallback-icon" />;
    }
    if (slug.includes('dvr') || slug.includes('nvr') || slug.includes('drive') || name.includes('تسجيل')) {
      return <HardDrive size={36} className="product-fallback-icon" />;
    }
    if (slug.includes('network') || slug.includes('router') || slug.includes('wifi') || name.includes('راوتر') || name.includes('شبك')) {
      return <Wifi size={36} className="product-fallback-icon" />;
    }
    if (slug.includes('cable') || slug.includes('power') || name.includes('كابل') || name.includes('طاقة')) {
      return <Zap size={36} className="product-fallback-icon" />;
    }
    if (slug.includes('cpu') || slug.includes('accessori') || name.includes('كمبيوتر')) {
      return <Cpu size={36} className="product-fallback-icon" />;
    }
    return <Box size={36} className="product-fallback-icon" />;
  };

  if (!imageSrc || hasError) {
    return (
      <div className={`product-image-fallback-container aspect-${aspectRatio} ${className}`} aria-label={alt}>
        <div className="fallback-inner">
          <div className="fallback-icon-wrap">
            {getCategoryIcon()}
          </div>
          <span className="fallback-badge-text">
            {categoryName || 'هايبر تكنولوجي'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`product-image-wrapper aspect-${aspectRatio} ${className} ${isLoaded ? 'loaded' : 'loading'}`}>
      {!isLoaded && <div className="product-img-skeleton" />}
      <img
        src={imageSrc}
        alt={alt || 'منتج هايبر تكنولوجي'}
        loading={loading}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`product-real-img ${isLoaded ? 'visible' : 'hidden'}`}
      />
    </div>
  );
};
