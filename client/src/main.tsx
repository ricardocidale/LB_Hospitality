import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// MARCELA ISOLATED: ElevenLabs widget registration disabled.
// To restore: uncomment the block below.
// See .claude/plans/MARCELA-ISOLATION.md for full restoration guide.
/*
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
*/

createRoot(document.getElementById("root")!).render(<App />);
