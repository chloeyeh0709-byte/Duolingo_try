import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./globals.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div className="flex min-h-screen flex-col bg-white text-[color:var(--foreground)]">
      <App />
    </div>
  </StrictMode>
);
