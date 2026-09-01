import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppRoot from './app/AppRoot';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>,
);
