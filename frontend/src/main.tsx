import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { QueryProvider } from "./providers/QueryProvider.tsx";
import { ThemeProvider } from "./contexts/ThemeContext.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <QueryProvider>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </QueryProvider>
);
