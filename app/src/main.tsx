// Punto de entrada de la aplicación React.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { ThemeProvider } from './providers/ThemeProvider';
import { ToastProvider } from './providers/ToastProvider';
import { ModalProvider } from './components/Modal';
import { AppProvider } from './providers/AppProvider';
import { App } from './App';
import './index.css';

// Manejador global de errores no controlados.
window.addEventListener('error', (evento) => {
  console.error('[SIGID:global]', evento.error);
});
window.addEventListener('unhandledrejection', (evento) => {
  console.error('[SIGID:promesa]', evento.reason);
});

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <ModalProvider>
          <AppProvider>
            <HashRouter>
              <App />
            </HashRouter>
          </AppProvider>
        </ModalProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
);
