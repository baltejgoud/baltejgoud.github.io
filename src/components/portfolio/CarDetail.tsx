"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { CarView, createCarStudio } from "./trackside/CarStudio";

export default function CarDetail({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const studio = useRef<Awaited<ReturnType<typeof createCarStudio>>>(null);
  const [status, setStatus] = useState("Preparing the car…");
  const [selected, setSelected] = useState<CarView>("quarter");
  useEffect(() => {
    if (!opener.current && document.activeElement instanceof HTMLElement)
      opener.current = document.activeElement;
    const element = dialog.current;
    element?.showModal();
    let disposed = false;
    void import("./trackside/CarStudio")
      .then(async ({ createCarStudio }) => {
        if (disposed || !host.current) return;
        const created = await createCarStudio(host.current, () => disposed);
        if (disposed) {
          created?.dispose();
          return;
        }
        studio.current = created;
        setStatus(created ? "" : "The 3D view is unavailable on this device.");
      })
      .catch(() => {
        if (!disposed) setStatus("The 3D view is unavailable on this device.");
      });
    return () => {
      disposed = true;
      studio.current?.dispose();
      studio.current = null;
      requestAnimationFrame(() => {
        if (!element?.isConnected)
          opener.current?.focus({ preventScroll: true });
      });
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="ts-car-dialog"
      data-lenis-prevent
      aria-labelledby="ts-car-title"
      onCancel={onClose}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <header>
        <div>
          <p>THE CAR / A CLOSER LOOK</p>
          <h2 id="ts-car-title">Blue. Carbon. Bull.</h2>
        </div>
        <button onClick={onClose} aria-label="Close car view" autoFocus>
          <X size={22} />
        </button>
      </header>
      <div
        ref={host}
        className="ts-car-stage"
        tabIndex={0}
        role="group"
        aria-label="Interactive Red Bull reference car. Drag to rotate, pinch or scroll to zoom. Left and right arrow keys rotate the car."
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            studio.current?.rotate(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}
      />
      {status && (
        <p className="ts-car-status" role="status">
          {status}
        </p>
      )}
      <footer>
        <div role="group" aria-label="Car camera views">
          {(
            [
              ["quarter", "Three-quarter"],
              ["front", "Front"],
              ["top", "Top"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              aria-pressed={selected === value}
              onClick={() => {
                studio.current?.view(value);
                setSelected(value);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <p>Drag to explore · Scroll to zoom</p>
      </footer>
    </dialog>
  );
}
