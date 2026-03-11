// @ts-ignore - canvas-confetti has no type declarations
import confetti from "canvas-confetti";

export function fireResearchConfetti() {
  const duration = 2500;
  const end = Date.now() + duration;

  const colors = ["#8A9A7B", "#38BDF8", "#F4795B", "#FFD700", "#A78BFA"];

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}
