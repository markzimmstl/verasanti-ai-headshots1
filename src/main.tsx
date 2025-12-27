import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('Main.tsx initializing...');

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('Root element not found');
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log('React root rendered');
  } catch (error) {
    console.error('Failed to render React app:', error);
    rootElement.innerHTML = `
      <div style="color: #ef4444; padding: 40px; font-family: sans-serif; text-align: center;">
        <h1 style="font-size: 24px; margin-bottom: 16px;">Application Initialization Error</h1>
        <p style="color: #cbd5e1;">The application failed to start.</p>
        <div style="margin-top: 20px; text-align: left; background: #1e293b; color: #e2e8f0; padding: 15px; border-radius: 8px; overflow: auto; max-width: 600px; margin-left: auto; margin-right: auto;">
          ${error instanceof Error ? error.message : String(error)}
        </div>
      </div>
    `;
  }
}