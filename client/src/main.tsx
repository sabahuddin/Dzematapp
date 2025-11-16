import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "react-quill/dist/quill.snow.css";
import "./i18n";

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('ServiceWorker registration successful:', registration.scope);
        
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New content available, please refresh.');
                if (confirm('Nova verzija aplikacije je dostupna. Želite li da osvježite stranicu?')) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch((error) => {
        console.log('ServiceWorker registration failed:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
