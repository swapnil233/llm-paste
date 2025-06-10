import { createRoot } from "react-dom/client";
import App from "./components/App";
import "../index.css";

// Ensure the DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Failed to find the root element");
  }

  const root = createRoot(rootElement);
  root.render(<App />);
});

// Handle any unhandled errors
window.addEventListener("error", (event) => {
  console.error("Unhandled error:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});
