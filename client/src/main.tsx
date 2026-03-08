import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register the <elevenlabs-convai> custom element from the local package
// instead of loading an external CDN script (which fails on some hosts).
// Dynamic import keeps it out of the critical initial bundle.
if (!customElements.get("elevenlabs-convai")) {
  import("@elevenlabs/convai-widget-core").then(({ registerWidget }) => {
    if (!customElements.get("elevenlabs-convai")) {
      registerWidget("elevenlabs-convai");
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
