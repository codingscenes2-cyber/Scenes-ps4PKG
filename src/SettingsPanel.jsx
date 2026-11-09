import React, { useEffect, useState } from "react";
import { DEFAULT_BINDINGS, bindKey } from "./preferences";
export default function SettingsPanel({ preferences: p, onChange }) {
  const [capture, setCapture] = useState(null);
  useEffect(() => {
    if (!capture) return;
    const listener = (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.key !== "Escape")
        onChange(bindKey(p, capture, e.key.toLowerCase()));
      setCapture(null);
    };
    window.addEventListener("keydown", listener, true);
    return () => window.removeEventListener("keydown", listener, true);
  }, [capture, p, onChange]);
  const set = (key, value) => onChange({ ...p, [key]: value });
  return (
    <div className="preferences">
      <h3>Sound mixer</h3>
      <p className="muted">
        Enable realm ambience above to hear changes. Music adapts to the region
        and combat.
      </p>
      {["master", "music", "effects", "brightness"].map((key) => (
        <label className="slider-setting" key={key}>
          <span>
            {key} <b>{Math.round(p[key] * 100)}%</b>
          </span>
          <input
            aria-label={`${key} level`}
            type="range"
            min={key === "brightness" ? 0.8 : 0}
            max={key === "brightness" ? 1.5 : 1}
            step=".05"
            value={p[key]}
            onChange={(e) => set(key, Number(e.target.value))}
          />
        </label>
      ))}
      <h3>Accessibility & display</h3>
      {[
        ["shake", "Camera impact shake"],
        ["reducedMotion", "Reduce decorative motion"],
        ["highContrast", "High contrast interface"],
        ["subtitles", "Combat captions"],
      ].map(([key, label]) => (
        <label className="toggle-setting" key={key}>
          {label}
          <input
            type="checkbox"
            checked={p[key]}
            onChange={(e) => set(key, e.target.checked)}
          />
        </label>
      ))}
      <label className="select-setting">
        Color vision
        <select
          value={p.colorblind}
          onChange={(e) => set("colorblind", e.target.value)}
        >
          <option value="none">Standard palette</option>
          <option value="deuteranopia">Deuteranopia · amber warnings</option>
          <option value="protanopia">Protanopia · amber warnings</option>
          <option value="tritanopia">Tritanopia · magenta warnings</option>
        </select>
      </label>
      <p className="muted">
        Warnings retain shapes, names and numeric HUD values in every palette.
      </p>
      <label className="select-setting">
        Rendering
        <select
          value={p.quality}
          onChange={(e) => set("quality", e.target.value)}
        >
          <option value="auto">Balanced</option>
          <option value="low">Low · lower resolution and distant detail</option>
          <option value="high">High · greater distant detail</option>
        </select>
      </label>
      <h3>Keyboard bindings</h3>
      <p className="muted">
        Select a control, then press a key. Escape cancels. Assigning a used key
        swaps the two controls. Arrow keys also move.
      </p>
      <div className="binding-grid">
        {Object.keys(DEFAULT_BINDINGS).map((action) => (
          <button
            key={action}
            onClick={() => setCapture(action)}
            aria-label={`Rebind ${action}`}
          >
            <span>{action}</span>
            <kbd>
              {capture === action
                ? "Press a key…"
                : p.bindings[action] === " "
                  ? "Space"
                  : p.bindings[action]}
            </kbd>
          </button>
        ))}
      </div>
      <button
        className="text-button"
        onClick={() => onChange({ ...p, bindings: { ...DEFAULT_BINDINGS } })}
      >
        Restore default bindings
      </button>
      <h3>Standard controller</h3>
      <p className="muted">
        Left stick: move · L3: sprint · A: dodge · B: backstep · X/Y:
        light/heavy · LB: guard · RB: skill · LT: parry · RT: spell · R3: lock ·
        D-pad up/down: heal/interact · View: jump · Menu: pause. Use the
        keyboard, touch or mouse in menus. Press a controller button once to
        connect.
      </p>
      <a
        className="text-button"
        href="guide.html"
        target="_blank"
        rel="noreferrer"
      >
        Field guide, changelog & roadmap ↗
      </a>
    </div>
  );
}
