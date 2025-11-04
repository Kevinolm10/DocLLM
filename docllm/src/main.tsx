import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.tsx'
import './styles/chatBoxContainer.css';
import './styles/chatInterface.css';
import './styles/sendButton.css';
import './styles/chatInput.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
