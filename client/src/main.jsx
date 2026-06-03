import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import './index.css';
import App from './App.jsx';

// En production, pointer vers l'URL Railway/Render
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

// Poser le token AVANT tout rendu React (sinon les effets enfants comme
// ChatWidget partent sans Authorization → 401 silencieux sur l'historique)
const savedToken = localStorage.getItem('mm_token');
if (savedToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
