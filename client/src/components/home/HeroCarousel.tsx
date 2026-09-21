import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, ArrowLeft } from 'lucide-react';
import { CarouselSlide } from '../../types';
import './HeroCarousel.css';

interface HeroCarouselProps {
  slides: CarouselSlide[];
  onNavigate: (path: string) => void;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ slides, onNavigate }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5500);

    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  if (!slides || slides.length === 0) {
    return (
      <section className="hero-carousel-wrapper">
        <div
          className="hero-carousel-container"
          style={{
            minHeight: '440px',
            background: 'radial-gradient(ellipse at center, #1a1a24 0%, #08080c 100%)',
          }}
        />
      </section>
    );
  }

  const currentSlide = slides[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handleSlideAction = (slide: CarouselSlide) => {
    if (slide.link_url) {
      onNavigate(slide.link_url);
    } else if (slide.product_id) {
      onNavigate(`/products/${slide.product_id}`);
    } else if (slide.category_id) {
      onNavigate(`/products?categoryId=${slide.category_id}`);
    } else {
      onNavigate('/products');
    }
  };

  return (
    <section 
      className="hero-carousel-wrapper"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="hero-carousel-container">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            className="hero-carousel-slide"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Background Image with Dark Gradient Overlay */}
            <div className="carousel-image-layer">
              <img
                src={currentSlide.image_url}
                alt={currentSlide.title_ar}
                className="carousel-bg-img"
              />
              <div className="carousel-overlay" />
            </div>

            {/* Slide Content */}
            <div className="carousel-content-box">
              <motion.h2
                className="carousel-title"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                {currentSlide.title_ar}
              </motion.h2>

              {currentSlide.subtitle_ar && (
                <motion.p
                  className="carousel-subtitle"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  {currentSlide.subtitle_ar}
                </motion.p>
              )}

              <motion.div
                className="carousel-actions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <button
                  type="button"
                  className="btn-carousel-cta"
                  onClick={() => handleSlideAction(currentSlide)}
                >
                  <span>{currentSlide.button_text_ar || 'تصفح الآن'}</span>
                  <ArrowLeft size={16} />
                </button>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel Navigation Arrows */}
        {slides.length > 1 && (
          <>
            <button
              type="button"
              className="carousel-nav-btn btn-prev"
              onClick={handlePrev}
              aria-label="Previous Slide"
            >
              <ChevronRight size={22} />
            </button>
            <button
              type="button"
              className="carousel-nav-btn btn-next"
              onClick={handleNext}
              aria-label="Next Slide"
            >
              <ChevronLeft size={22} />
            </button>
          </>
        )}

        {/* Carousel Indicators */}
        {slides.length > 1 && (
          <div className="carousel-indicators">
            {slides.map((slide, idx) => (
              <button
                key={slide.id || idx}
                type="button"
                className={`carousel-dot ${idx === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
