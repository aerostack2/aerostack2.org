import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { bounds, type P, planeMatrix, type V } from "../figures/line-art";
import {
  blade,
  crazyflie,
  gazebo,
  type Item,
  isGlow,
  isRotor,
  outline,
  px4,
  tello,
} from "./drones";

/**
 * The hero: a mission runs into Aerostack2 and out to four kinds of drone,
 * drawn in line art. Each drone has its colour: a pool of light under it, a
 * path tinted from the brand blue to it, and the pulse that lights it. In a
 * loop, a pulse leaves `mission.py`, reaches the tile, and fans out; as it
 * reaches each drone, the drone lights in its colour and its props spin.
 *
 * Drawn on the server, played by CSS (`.hero-art` in global.css), so it ships
 * no script. Phones get their own composition, without the chip.
 */

/** The loop, and when the pulse leaves the tile for each drone. */
const CYCLE = 7;
const TRAVEL = 0.7;
const leave = (order: number) => TRAVEL + order * 0.3;

const O: V = [0, 0, 0];
const DRONES = [
  {
    key: "gazebo",
    name: "Gazebo",
    color: "#f97316",
    order: 0,
    items: gazebo(O),
  },
  { key: "px4", name: "PX4", color: "#8b5cf6", order: 2, items: px4(O) },
  {
    key: "crazyflie",
    name: "Crazyflie",
    color: "#10b981",
    order: 1,
    items: crazyflie(O),
  },
  { key: "tello", name: "Tello", color: "#ec4899", order: 3, items: tello(O) },
].map((d) => ({ ...d, box: bounds(outline(d.items)) }));

type Spot = { x: number; y: number; width: number };
type Layout = {
  id: string;
  w: number;
  h: number;
  /** Where the chip sits; without one the beam comes in from the edge. */
  chip?: P;
  tile: P;
  /** One per drone, in the order of DRONES. */
  spots: Spot[];
  font: number;
  className: string;
};

const DESKTOP: Layout = {
  id: "hero-wide",
  w: 1240,
  h: 380,
  chip: [110, 190],
  tile: [440, 190],
  spots: [
    { x: 735, y: 78, width: 170 },
    { x: 1050, y: 162, width: 165 },
    { x: 765, y: 300, width: 100 },
    { x: 1080, y: 290, width: 120 },
  ],
  font: 11,
  className: "hidden sm:block",
};

const MOBILE: Layout = {
  id: "hero-narrow",
  w: 390,
  h: 300,
  tile: [62, 150],
  spots: [
    { x: 182, y: 64, width: 110 },
    { x: 320, y: 128, width: 100 },
    { x: 184, y: 240, width: 64 },
    { x: 322, y: 236, width: 80 },
  ],
  font: 9,
  className: "sm:hidden",
};

type Drone = { items: Item[] };

/** The drone's items, as SVG. */
export function Drawing({ drone, glowId }: { drone: Drone; glowId: string }) {
  return drone.items.map((item: Item, k) => {
    if (isGlow(item))
      return (
        // biome-ignore lint/suspicious/noArrayIndexKey: a fixed drawing
        <g key={k} transform={planeMatrix(item.glow)}>
          <circle r={item.r} fill={`url(#${glowId})`} className="hero-glow" />
        </g>
      );
    if (isRotor(item)) {
      const d = blade(item.r, item.turn);
      return (
        // biome-ignore lint/suspicious/noArrayIndexKey: a fixed drawing
        <g key={k} transform={planeMatrix(item.rotor)} className={item.cls}>
          <g
            className="hero-spin"
            style={{ "--turn": item.turn } as CSSProperties}
          >
            <circle r={item.r + 1} className="hero-sweep" />
            <path d={d} className="sil hi" />
            <path d={d} transform="rotate(180)" className="sil hi" />
            <circle r={Math.max(1.2, item.r * 0.12)} className="sil" />
          </g>
        </g>
      );
    }
    // biome-ignore lint/suspicious/noArrayIndexKey: a fixed drawing
    return <path key={k} d={item.d} className={item.cls} />;
  });
}

function Scene({ layout }: { layout: Layout }) {
  const { id, w, h, chip, tile, spots, font } = layout;
  const start: P = [tile[0] + 44, tile[1]];
  const beamFrom = chip ? chip[0] + 50 : 0;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      data-line-art=""
      className={cn(
        "line-figure hero-art relative h-auto w-full text-fd-foreground",
        layout.className,
      )}
    >
      <defs>
        <filter
          id={`${id}-blur`}
          x="-100%"
          y="-100%"
          width="300%"
          height="300%"
        >
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <clipPath id={`${id}-clip`}>
          <rect x={-32} y={-32} width={64} height={64} rx={14} />
        </clipPath>
        <linearGradient
          id={`${id}-beam`}
          gradientUnits="userSpaceOnUse"
          x1={beamFrom}
          y1={0}
          x2={tile[0] - 40}
          y2={0}
        >
          <stop offset="0" stopColor="currentColor" stopOpacity="0" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.55" />
        </linearGradient>
        {DRONES.map((d, i) => (
          <linearGradient
            key={d.key}
            id={`${id}-path-${d.key}`}
            gradientUnits="userSpaceOnUse"
            x1={start[0]}
            y1={start[1]}
            x2={spots[i].x - spots[i].width / 2}
            y2={spots[i].y}
          >
            <stop offset="0" style={{ stopColor: "var(--color-fd-primary)" }} />
            <stop offset="1" stopColor={d.color} />
          </linearGradient>
        ))}
        {DRONES.map((d) => (
          <radialGradient key={d.key} id={`${id}-glow-${d.key}`}>
            <stop offset="0" stopColor={d.color} stopOpacity="0.5" />
            <stop offset="1" stopColor={d.color} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>

      {/* The mission's beam into the tile. */}
      <path
        d={`M${beamFrom} ${tile[1]}H${tile[0] - 40}`}
        stroke={`url(#${id}-beam)`}
        className="hero-path"
      />
      <path
        d={`M${beamFrom} ${tile[1]}H${tile[0] - 40}`}
        pathLength={100}
        className="hero-pulse"
        style={{ "--c": "currentColor", "--d": "0s" } as CSSProperties}
      />

      {/* A path from the tile to each drone, and its pulse. */}
      {DRONES.map((d, i) => {
        const end: P = [spots[i].x - spots[i].width / 2 - 10, spots[i].y];
        const dx = end[0] - start[0];
        // Level for most of the way, so the paths to the far drones run
        // through the gap between the near ones before they turn.
        const path = `M${start[0]} ${start[1]}C${start[0] + dx * 0.6} ${start[1]} ${end[0] - dx * 0.3} ${end[1]} ${end[0]} ${end[1]}`;
        return (
          <g key={d.key}>
            <path
              d={path}
              stroke={`url(#${id}-path-${d.key})`}
              className="hero-path"
            />
            <path
              d={path}
              pathLength={100}
              className="hero-pulse"
              style={
                { "--c": d.color, "--d": `${leave(d.order)}s` } as CSSProperties
              }
            />
          </g>
        );
      })}

      {/* The Aerostack2 tile, glowing as the pulse arrives. */}
      <g transform={`translate(${tile[0]} ${tile[1]})`}>
        <rect
          x={-40}
          y={-40}
          width={80}
          height={80}
          rx={22}
          filter={`url(#${id}-blur)`}
          className="hero-tile-glow"
        />
        <rect
          x={-40}
          y={-40}
          width={80}
          height={80}
          rx={22}
          className="hero-tile"
        />
        <image
          href="/logo.png"
          x={-32}
          y={-32}
          width={64}
          height={64}
          clipPath={`url(#${id}-clip)`}
        />
      </g>

      {chip && (
        <g transform={`translate(${chip[0]} ${chip[1]})`}>
          <rect
            x={-50}
            y={-14}
            width={100}
            height={28}
            rx={14}
            className="hero-tile"
          />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={12}
            className="hero-chip"
          >
            mission.py
          </text>
        </g>
      )}

      {/* The drones, each scaled into its spot, and their names. */}
      {DRONES.map((d, i) => {
        const { x, y, width } = spots[i];
        const [x0, y0, x1, y1] = d.box;
        const s = width / (x1 - x0);
        const [cx, cy] = [(x0 + x1) / 2, (y0 + y1) / 2];
        const ly = y + s * (y1 - cy) + font + 6;
        const half = (d.name.length * font * 0.7) / 2;
        return (
          <g
            key={d.key}
            className="hero-drone"
            style={
              {
                "--c": d.color,
                "--a": `${leave(d.order) + TRAVEL}s`,
              } as CSSProperties
            }
          >
            <g
              transform={`translate(${x} ${y}) scale(${s}) translate(${-cx} ${-cy})`}
            >
              <Drawing drone={d} glowId={`${id}-glow-${d.key}`} />
            </g>
            <circle
              cx={x - half - 7}
              cy={ly - font * 0.35}
              r={font * 0.3}
              fill={d.color}
            />
            <text
              x={x + font * 0.05}
              y={ly}
              textAnchor="middle"
              fontSize={font}
              className="hero-label"
            >
              {d.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function HeroArt() {
  return (
    <div
      className="relative overflow-hidden"
      style={{ "--cycle": `${CYCLE}s` } as CSSProperties}
    >
      <div className="home-grid absolute inset-0" aria-hidden="true" />
      <Scene layout={DESKTOP} />
      <Scene layout={MOBILE} />
    </div>
  );
}
