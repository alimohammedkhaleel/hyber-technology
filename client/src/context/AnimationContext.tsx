import React, { createContext, useContext, useState, useEffect } from 'react';

interface AnimationContextType {
  hasSeenPresentation: boolean;
  markPresentationSeen: () => void;
  replayPresentation: () => void;
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

const STORAGE_KEY = 'nlp_has_seen_presentation_session';

export const AnimationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasSeenPresentation, setHasSeenPresentation] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    // Auto-bypass for search engine crawlers, bots, and automated inspectors
    const isBot = /bot|googlebot|bingbot|crawler|spider|robot|crawling|lighthouse|headless|facebookexternalhit|whatsapp|telegram/i.test(
      navigator.userAgent || ''
    );
    if (isBot) return true;
    return sessionStorage.getItem(STORAGE_KEY) === 'true';
  });

  const markPresentationSeen = () => {
    sessionStorage.setItem(STORAGE_KEY, 'true');
    setHasSeenPresentation(true);
  };

  const replayPresentation = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setHasSeenPresentation(false);
  };

  return (
    <AnimationContext.Provider
      value={{
        hasSeenPresentation,
        markPresentationSeen,
        replayPresentation,
      }}
    >
      {children}
    </AnimationContext.Provider>
  );
};

export const useAnimation = (): AnimationContextType => {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
};
