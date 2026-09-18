import gsap from 'gsap';

export interface BrushAnimationOptions {
  pathElement: SVGPathElement;
  contentElement?: HTMLElement | null;
  onRevealed?: () => void;
  onFinish?: () => void;
}

/**
 * Creates the signature Brush Mask Wipe Animation using GSAP
 * Matches the visual spectacle and timing of the presentation in Sheikh Foundation project.
 */
export const createBrushPresentationTimeline = (
  options: BrushAnimationOptions
): gsap.core.Timeline => {
  const { pathElement, contentElement, onRevealed, onFinish } = options;

  const length = pathElement.getTotalLength();

  // Initialize path with full offset (hidden)
  gsap.set(pathElement, {
    strokeDasharray: length,
    strokeDashoffset: length,
  });

  const tl = gsap.timeline({
    onComplete: () => {
      if (onFinish) onFinish();
    },
  });

  // 1. Paint the brush stroke in
  tl.to(pathElement, {
    strokeDashoffset: 0,
    duration: 1.6,
    ease: 'power2.inOut',
    onComplete: () => {
      if (onRevealed) onRevealed();
    },
  });

  // 2. Animate the logo and text content smoothly with gold elegance
  if (contentElement) {
    tl.fromTo(
      contentElement,
      { opacity: 0, scale: 0.88, filter: 'blur(6px)' },
      { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.8, ease: 'power2.out' },
      '-=0.5'
    );

    // Hold moment for presentation showcase
    tl.to({}, { duration: 1.3 });

    // 3. Dissolve content before unpainting brush
    tl.to(contentElement, {
      opacity: 0,
      scale: 1.04,
      filter: 'blur(4px)',
      duration: 0.5,
      ease: 'power2.in',
    });
  }

  // 4. Brush sweeps away revealing the app
  tl.to(pathElement, {
    strokeDashoffset: -length,
    duration: 1.3,
    ease: 'power2.inOut',
  });

  return tl;
};
