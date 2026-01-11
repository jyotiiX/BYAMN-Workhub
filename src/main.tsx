import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ThemeProvider } from "next-themes"; //

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <title>BYAMN-Workhub</title>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);