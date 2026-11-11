import type { CSSProperties } from "react";
import { bounds, planeMatrix } from "./figures/line-art";
import { blade, isRotor, outline, px4 } from "./hero/drones";
import { Drawing } from "./hero/hero-art";

/**
 * The 404 art: the hero's PX4 drone flies a lazy loop, loses a rotor, and
 * crashes upside down. Drawn on the server and played by CSS (`.crash-art`
 * in global.css), like the hero. Its flight path lives in those keyframes,
 * in this viewBox's units.
 */
const W = 1000;
const H = 320;
const GROUND = 280;
const WIDTH = 150;

// Two of the rotors break off in the crash: the drone hides them at impact,
// and loose copies (LOST) fly off from there.
let rotors = 0;
const items = px4([0, 0, 0]).map((i) =>
  isRotor(i) && rotors++ % 2 === 0 ? { ...i, cls: "crash-lost" } : i,
);
const PROP = items.find(isRotor)?.r ?? 0;
const LOST = ["a", "b"];
const [x0, y0, x1, y1] = bounds(outline(items));
const s = WIDTH / (x1 - x0);
const [cx, cy] = [(x0 + x1) / 2, (y0 + y1) / 2];

/** Where it hits the ground; the keyframes end the flight here too. */
const IMPACT = 720;

export function CrashArt() {
  return (
    <div
      className="relative overflow-hidden"
      style={{ "--cycle": "9s" } as CSSProperties}
    >
      <div className="home-grid absolute inset-0" aria-hidden="true" />
      <svg
        viewBox={`0 0 ${W} ${H}`}
        aria-hidden="true"
        data-line-art=""
        className="line-figure hero-art crash-art relative h-auto w-full text-fd-foreground"
      >
        <defs>
          <radialGradient id="crash-glow">
            <stop
              offset="0"
              stopOpacity="0.5"
              style={{ stopColor: "var(--color-fd-primary)" }}
            />
            <stop
              offset="1"
              stopOpacity="0"
              style={{ stopColor: "var(--color-fd-primary)" }}
            />
          </radialGradient>
        </defs>

        <path d={`M0 ${GROUND}H${W}`} className="lo" />

        <g className="crash-shadow">
          <ellipse rx={70} ry={9} />
        </g>

        {/* The impact: a burst of short strokes, then smoke drifting up. */}
        <g transform={`translate(${IMPACT} ${GROUND})`}>
          <g className="crash-burst">
            {[-160, -130, -100, -80, -50, -20].map((a) => {
              const r = (a * Math.PI) / 180;
              const [c, n] = [Math.cos(r), Math.sin(r)];
              return (
                <path
                  key={a}
                  d={`M${c * 50} ${n * 30}L${c * 80} ${n * 52}`}
                  className="hi"
                />
              );
            })}
          </g>
          {[-30, 10, 40].map((dx, k) => (
            <circle
              key={dx}
              cx={dx}
              cy={-20}
              r={8 + k * 3}
              className="crash-smoke"
              style={{ "--k": `${k * 0.35}s` } as CSSProperties}
            />
          ))}
        </g>

        {LOST.map((key) => (
          <g key={key} className={`crash-prop crash-prop-${key}`}>
            <g transform={`scale(${s}) ${planeMatrix([0, 0, 0])}`}>
              <g className="crash-prop-spin">
                <path d={blade(PROP, 1)} className="sil hi" />
                <path
                  d={blade(PROP, 1)}
                  transform="rotate(180)"
                  className="sil hi"
                />
                <circle r={3} className="sil" />
              </g>
            </g>
          </g>
        ))}

        <g className="crash-drone">
          <g transform={`scale(${s}) translate(${-cx} ${-cy})`}>
            <Drawing drone={{ items }} glowId="crash-glow" />
          </g>
        </g>
      </svg>
    </div>
  );
}
