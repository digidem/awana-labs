import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./lib/i18n";

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker for image caching in production only.
// The SW uses a cache-first strategy for external project images,
// giving near-instant loads on repeat visits without affecting
// other requests or the dev server.
if (
  typeof navigator !== "undefined" &&
  "serviceWorker" in navigator &&
  import.meta.env.PROD
) {
  window.addEventListener("load", () => {
    const swPath = import.meta.env.BASE_URL + "sw.js";
    navigator.serviceWorker.register(swPath).catch((error) => {
      console.warn("SW registration failed:", error);
    });
  });
}
