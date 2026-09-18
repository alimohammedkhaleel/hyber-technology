import React from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { CartProvider } from './context/CartContext';
import { AnimationProvider } from './context/AnimationContext';
import { App } from './app/App';
import './styles/globals.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container element (#root) not found in document.');
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <AuthProvider>
      <LocationProvider>
        <CartProvider>
          <AnimationProvider>
            <App />
          </AnimationProvider>
        </CartProvider>
      </LocationProvider>
    </AuthProvider>
  </React.StrictMode>
);
