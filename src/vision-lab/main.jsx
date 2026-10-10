import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import VisionLab from './VisionLab.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <VisionLab />
  </StrictMode>,
);
