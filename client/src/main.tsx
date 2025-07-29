import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Suppress ResizeObserver loop warnings - these are harmless browser quirks
window.addEventListener('error', (e) => {
  if (e.message?.includes('ResizeObserver loop completed with undelivered notifications')) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }
});

// Override console.error to filter ResizeObserver warnings
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args[0]?.toString?.() || '';
  if (message.includes('ResizeObserver loop') || message.includes('ResizeObserver loop completed')) {
    return; // Suppress this error
  }
  originalConsoleError.apply(console, args);
};

createRoot(document.getElementById("root")!).render(<App />);
