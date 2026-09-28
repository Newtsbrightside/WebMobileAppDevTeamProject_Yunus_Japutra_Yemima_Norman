// CONTOH SAJA. Pakai HashRouter agar aman di GitHub Pages
// (BrowserRouter memberi error 404 saat halaman di-refresh).
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
);
