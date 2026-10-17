"use client";

import { useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { motion, useMotionValue } from "motion/react";

let topLayer = 10;

/**
 * A board item visitors can drag (or nudge with arrow keys). The item last touched comes to the
 * front, like picking a photo off a real board.
 */
export function Draggable({
  children,
  className,
  label,
  board,
  rotate = 0,
  style,
}: {
  children: ReactNode;
  className: string;
  label: string;
  board: RefObject<HTMLDivElement | null>;
  rotate?: number;
  style?: CSSProperties;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const self = useRef<HTMLDivElement>(null);
  const raise = () => {
    if (self.current) self.current.style.zIndex = String(++topLayer);
  };
  const nudge = (dx: number, dy: number) => {
    const boardBox = board.current?.getBoundingClientRect();
    const box = self.current?.getBoundingClientRect();
    if (!boardBox || !box) return;
    const nextX = Math.max(boardBox.left - box.left, Math.min(boardBox.right - box.right, dx));
    const nextY = Math.max(boardBox.top - box.top, Math.min(boardBox.bottom - box.bottom, dy));
    x.set(x.get() + nextX);
    y.set(y.get() + nextY);
  };

  return (
    <motion.div
      ref={self}
      className={`p-drag ${className}`}
      drag
      dragConstraints={board}
      dragElastic={0.12}
      dragMomentum={false}
      whileDrag={{ scale: 1.05, rotate: rotate + 2, cursor: "grabbing" }}
      whileHover={{ y: -4 }}
      onPointerDown={raise}
      style={{ x, y, rotate, ...style }}
      tabIndex={0}
      role="group"
      aria-roledescription="draggable item"
      aria-label={`${label}. Drag to move, or use the arrow keys.`}
      onKeyDown={(event) => {
        const step = event.shiftKey ? 40 : 14;
        const moves: Record<string, [number, number]> = {
          ArrowLeft: [-step, 0],
          ArrowRight: [step, 0],
          ArrowUp: [0, -step],
          ArrowDown: [0, step],
        };
        const move = moves[event.key];
        if (!move) return;
        event.preventDefault();
        raise();
        nudge(...move);
      }}
    >
      {children}
    </motion.div>
  );
}
