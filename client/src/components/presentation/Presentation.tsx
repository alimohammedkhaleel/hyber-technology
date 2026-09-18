import React, { useEffect, useRef } from 'react';
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

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    const masterTl = createBrushPresentationTimeline({
      pathElement: path,
      contentElement: logoRef.current,
      onFinish: () => {
        onFinish();
      },
    });

    return () => {
      masterTl.kill();
    };
  }, [onFinish]);

  return (
    <div ref={containerRef} className="presentation-container">
      {/* SVG Brush Mask Canvas */}
      <svg
        className="presentation-svg-canvas"
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

      {/* Centerpiece: NLP Logo and Typography */}
      <div ref={logoRef} className="presentation-content">
        <div className="presentation-logo-wrapper">
          <img
            src={logoImg}
            alt={BRANDING.logoAlt}
            className="presentation-logo-image"
          />
        </div>

        <div className="presentation-text-block">
          <h1 className="presentation-brand-title">{BRANDING.presentationTitle}</h1>
          <p className="presentation-system-subtitle">{BRANDING.presentationSubtitle}</p>
        </div>
      </div>
    </div>
  );
};
