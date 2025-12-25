import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom';
import { Buffer } from 'buffer';
import 'process';

window.global = window;
window.process = { env: {} };
window.Buffer = Buffer;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    
    <BrowserRouter>
    <App />
    </BrowserRouter>
    
  </StrictMode>,
)
