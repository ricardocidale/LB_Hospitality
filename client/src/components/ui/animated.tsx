/**
 * animated.tsx — Shared Framer Motion animation primitives.
 *
 * Provides reusable animated wrappers used across the UI:
 *   • FadeIn / StaggerItem  — entrance animations for lists and grids
 *   • HoverScale            — subtle scale-up on hover for interactive cards
 *   • AnimatedCounter       — smooth number interpolation for KPI values
 *   • PageTransition        — route-level fade/slide transitions
 *
 * These components ensure consistent motion design throughout the app.
 */
import { motion, type Variants, useMotionValue, useTransform, animate, AnimatePresence } from "framer-motion";
import { type ReactNode, useEffect, useRef, useState } from "react";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0 },
};

const slideInRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0 },
};

export function FadeInUp({ children, delay = 0, duration = 0.5, className }: { children: ReactNode; delay?: number; duration?: number; className?: string }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeIn({ children, delay = 0, duration = 0.4, className }: { children: ReactNode; delay?: number; duration?: number; className?: string }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ScaleIn({ children, delay = 0, duration = 0.4, className }: { children: ReactNode; delay?: number; duration?: number; className?: string }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={scaleIn}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SlideIn({ children, delay = 0, duration = 0.5, direction = "left", className }: { children: ReactNode; delay?: number; duration?: number; direction?: "left" | "right"; className?: string }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={direction === "left" ? slideInLeft : slideInRight}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export function StaggerContainer({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        ...staggerContainer,
        visible: {
          ...staggerContainer.visible,
          transition: {
            ...(staggerContainer.visible as any).transition,
            delayChildren: delay + 0.1,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
}

export function AnimatedCounter({ value, duration = 1.2, format, className }: { value: number; duration?: number; format?: (n: number) => string; className?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const controls = animate(prevValue.current, value, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => setDisplayValue(latest),
    });
    prevValue.current = value;
    return () => controls.stop();
  }, [value, duration]);

  return (
    <span className={className}>
      {format ? format(displayValue) : Math.round(displayValue).toLocaleString()}
    </span>
  );
}

export function AnimatedNumber({ value, duration = 1.5, format }: { value: number; duration?: number; format?: (n: number) => string }) {
  return (
    <AnimatedCounter value={value} duration={duration} format={format} />
  );
}

export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function HoverScale({ children, scale = 1.02, className }: { children: ReactNode; scale?: number; className?: string }) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function PulseOnMount({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedProgressBar({ value, max = 100, className, color = "bg-primary" }: { value: number; max?: number; className?: string; color?: string }) {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2.5 overflow-hidden ${className || ""}`}>
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </div>
  );
}
