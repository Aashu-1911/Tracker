import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AppProvider } from "./context/AppContext.jsx";
import { AIProvider } from "./context/AIContext.jsx";
import "./index.css";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider>
        <AIProvider>
          <App />
        </AIProvider>
      </AppProvider>
    </BrowserRouter>
  </StrictMode>
);
