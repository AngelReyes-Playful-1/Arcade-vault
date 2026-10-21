"use client";

import { useEffect, useRef } from "react";
import type { PointerEvent } from "react";
import type { TouchButton } from "./types";

interface TouchControlsProps {
  buttons: TouchButton[];
  disabled: boolean;
  zone: "left" | "right";
}

function dispatchKey(type: "keydown" | "keyup", code: string, key: string) {
  window.dispatchEvent(
    new KeyboardEvent(type, { code, key, bubbles: true, cancelable: true }),
  );
}

// Botonera virtual: cada botón emite keydown/keyup sintéticos en window
export default function TouchControls({
  buttons,
  disabled,
  zone,
}: TouchControlsProps) {
  const held = useRef(new Map<number, string>());
  const rootRef = useRef<HTMLDivElement>(null);
  const wasDisabled = useRef(disabled);
  const zoneButtons = buttons.filter((b) => b.zone === zone);

  const keyFor = (code: string) =>
    buttons.find((b) => b.code === code)?.key ?? code;

  // Al reanudar, suelta todo: Arkanoid ignora keyup en pausa
  useEffect(() => {
    const resumed = wasDisabled.current && !disabled;
    wasDisabled.current = disabled;
    if (!resumed) return;
    const raf = requestAnimationFrame(() => {
      for (const b of buttons) dispatchKey("keyup", b.code, b.key);
      held.current.clear();
      rootRef.current
        ?.querySelectorAll("[data-pressed]")
        .forEach((el) => el.removeAttribute("data-pressed"));
    });
    return () => cancelAnimationFrame(raf);
  }, [disabled, buttons]);

  const press = (e: PointerEvent<HTMLButtonElement>, b: TouchButton) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
    held.current.set(e.pointerId, b.code);
    e.currentTarget.setAttribute("data-pressed", "");
    dispatchKey("keydown", b.code, b.key);
  };

  const release = (e: PointerEvent<HTMLButtonElement>) => {
    const code = held.current.get(e.pointerId);
    if (code === undefined) return;
    held.current.delete(e.pointerId);
    if (![...held.current.values()].includes(code)) {
      e.currentTarget.removeAttribute("data-pressed");
    }
    dispatchKey("keyup", code, keyFor(code));
  };

  if (zoneButtons.length === 0) return null;

  return (
    <div ref={rootRef} className={`touch-zone touch-zone-${zone}`}>
      {zoneButtons.map((b) => (
        <button
          key={b.code}
          type="button"
          className={`touch-btn${b.label.length > 2 ? " wide" : ""}`}
          // aria-disabled en vez de disabled: un botón disabled deja de
          // recibir pointerup y la tecla quedaría atascada
          aria-disabled={disabled || undefined}
          onPointerDown={(e) => press(e, b)}
          onPointerUp={release}
          onPointerCancel={release}
          onLostPointerCapture={release}
          onContextMenu={(e) => e.preventDefault()}
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}
