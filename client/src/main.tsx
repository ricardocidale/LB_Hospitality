import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register the <elevenlabs-convai> custom element from the local package.
// Dynamic import keeps it out of the critical initial bundle.
if (!customElements.get("elevenlabs-convai")) {
  import("@elevenlabs/convai-widget-core")
    .then(({ registerWidget }) => {
      if (!customElements.get("elevenlabs-convai")) {
        registerWidget("elevenlabs-convai");
        console.info("[ElevenLabs] Widget element registered");
      }
    })
    .catch((err) => {
      console.warn("[ElevenLabs] Failed to register widget element:", err);
    });
}

createRoot(document.getElementById("root")!).render(<App />);
