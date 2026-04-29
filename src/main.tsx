import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// @ts-ignore: CSS module declaration missing
import './index.css';

// PWA 서비스 워커 등록
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // 서비스 워커 등록 실패 시 무시
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);