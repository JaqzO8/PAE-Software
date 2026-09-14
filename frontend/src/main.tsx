// src/main.tsx (Vite Entry Point)
import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppRouter } from './app/AppRouter';
import './index.css'; 

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}pae-sw.js`).catch((error) => {
      console.warn('No se pudo registrar el soporte offline de PAE.', error);
    });
  });
}
