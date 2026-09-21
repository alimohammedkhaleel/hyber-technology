import React, { useEffect, useRef, useState } from 'react';
import { createBrushPresentationTimeline } from '../../animations/gsap/brushAnimation';
import { BRANDING } from '../../config/branding';
import logoImg from '../../assets/images/logo/logo.png'; // HTS Official Logo
import './Presentation.css';

interface PresentationProps {
  onFinish: () => void;
}

export const Presentation: React.FC<PresentationProps> = ({ onFinish }) => {
  const pathRef = useRef<SVGPathElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // 1. Preload and decode the logo image before initiating presentation animation
  useEffect(() => {
    let isMounted = true;
    const img = new Image();
    img.src = logoImg;

    const onImageReady = () => {
      if (isMounted) {
        setIsImageLoaded(true);
      }
    };

    if (img.complete && img.naturalWidth > 0) {
      if ('decode' in img) {
        img.decode().then(onImageReady).catch(onImageReady);
      } else {
        onImageReady();
      }
    } else {
      img.onload = () => {
        if ('decode' in img) {
          img.decode().then(onImageReady).catch(onImageReady);
        } else {
          onImageReady();
        }
      };
      img.onerror = () => {
        // Fallback gracefully so the animation proceeds even if image fails
        onImageReady();
      };
    }

    // Safety timer (maximum 2000ms) to ensure smooth transition regardless of network
    const safetyTimer = setTimeout(onImageReady, 2000);

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, []);

  // 2. Start brush presentation timeline ONLY after image is confirmed loaded & decoded
  useEffect(() => {
    if (!isImageLoaded) return;

    const path = pathRef.current;
    if (!path) return;

    const masterTl = createBrushPresentationTimeline({
      pathElement: path,
      contentElement: logoRef.current,
      onFinish: () => {
        onFinish();
      },
    });

    timelineRef.current = masterTl;

    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, [isImageLoaded, onFinish]);

  const handleSkip = () => {
    if (timelineRef.current) {
      timelineRef.current.kill();
    }
    onFinish();
  };

  return (
    <div ref={containerRef} className="presentation-container" onClick={handleSkip}>
      {/* Subtle loader while logo image is decoding */}
      {!isImageLoaded && (
        <div className="presentation-preloader">
          <div className="presentation-spinner" />
        </div>
      )}

      {/* SVG Brush Mask Canvas */}
      <svg
        className={`presentation-svg-canvas ${isImageLoaded ? 'ready' : 'loading'}`}
        width="100%"
        height="100%"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <mask id="nlpBrushMask">
            <path
              ref={pathRef}
              d="M 100 -200 L -100 1280 L 400 -200 L 200 1280 L 700 -200 L 500 1280 L 1000 -200 L 800 1280 L 1300 -200 L 1100 1280 L 1600 -200 L 1400 1280 L 1900 -200 L 1700 1280 L 2200 -200 L 2000 1280"
              fill="none"
              stroke="white"
              strokeWidth="480"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </mask>
        </defs>

        {/* Dark Luxury Canvas Revealed & Wiped by Brush Mask */}
        <rect
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          fill="#0c0c0e"
          mask="url(#nlpBrushMask)"
        />
      </svg>

      {/* Centerpiece: Hyper Technology Logo and Typography */}
      <div
        ref={logoRef}
        className="presentation-content"
        style={{ visibility: isImageLoaded ? 'visible' : 'hidden' }}
      >
        <div className="presentation-logo-wrapper">
          <img
            src={logoImg}
            alt={BRANDING.logoAlt}
            className="presentation-logo-image"
            loading="eager"
          />
        </div>

        <div className="presentation-text-block">
          <h1 className="presentation-brand-title">{BRANDING.presentationTitle}</h1>
          <p className="presentation-system-subtitle">{BRANDING.presentationSubtitle}</p>
        </div>
      </div>

      <button
        type="button"
        className="presentation-skip-hint"
        onClick={handleSkip}
        aria-label="تخطي العرض التقديمي"
      >
        تخطي
      </button>
    </div>
  );
};
