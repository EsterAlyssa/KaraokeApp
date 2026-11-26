import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import '@fontsource/lora/500.css';
import '@fontsource/lora/500-italic.css';
import '@fontsource/lora/600.css';
import './styles/theme.css';
import './styles/app.css';
import App from './App';
import { loadTheme } from './lib/storage';

// Tema impostato prima del primo disegno, così non c'è il "lampo" giorno → notte.
document.documentElement.dataset.theme = loadTheme();

registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
