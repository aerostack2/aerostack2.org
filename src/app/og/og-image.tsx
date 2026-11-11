import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import {
  add,
  bounds,
  circ,
  depth,
  flat,
  line,
  planeMatrix,
  type V,
} from "@/components/home/figures/line-art";
import {
  blade,
  isGlow,
  isRotor,
  outline,
  px4,
} from "@/components/home/hero/drones";
import { DRONES } from "@/components/home/hero/hero-art";
import { appName, siteUrl } from "@/lib/shared";

/**
 * Social cards in the landing page's style: the framed column with marks
 * where the rules cross, the faded grid, a mono eyebrow over a Plex Serif
 * heading, and a swarm of the hero's drones. Satori can't read the site's
 * CSS or `next/font`, so the colours are read from the site's theme file and
 * the fonts ship as TTFs. A PNG can't follow the viewer's theme, so it uses
 * the light one.
 */
export const size = { width: 1200, height: 630 };

const cwd = process.cwd();
const theme = readFileSync(join(cwd, "src/app/theme-linear.css"), "utf8");
/** A light-theme token: its first definition, before the `.dark` block. */
function token(name: string) {
  const m = theme.match(
    new RegExp(`--color-fd-${name}:\\s*(#[0-9a-f]{6})`, "i"),
  );
  if (!m) throw new Error(`og-image: no --color-fd-${name} in the theme`);
  return m[1];
}
/** `a` at `k` over `b`, as the line art's color-mix does. */
const mix = (a: string, b: string, k: number) =>
  `#${[1, 3, 5]
    .map((i) =>
      Math.round(
        k * parseInt(a.slice(i, i + 2), 16) +
          (1 - k) * parseInt(b.slice(i, i + 2), 16),
      )
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;

const c = {
  bg: token("background"),
  fg: token("foreground"),
  muted: token("muted-foreground"),
  border: token("border"),
  primary: token("primary"),
};
/** The line art's edge, as `.line-figure` sets it. */
const edge = mix(c.fg, c.bg, 0.7);

const font = (file: string) => readFile(join(cwd, "src/app/og/fonts", file));

const assets = Promise.all([
  font("IBMPlexSerif-Regular.ttf"),
  font("IBMPlexSans-Regular.ttf"),
  font("IBMPlexMono-Regular.ttf"),
  readFile(join(cwd, "public/logo.png")),
]);

// Places on the floor in screen terms, as the swarm figure lays them out.
const at = (across: number, toward: number, z: number): V => [
  across + toward,
  toward - across,
  z,
];

/**
 * The formation, in the air: a leader, a little higher and lit in the hero's
 * Gazebo orange, and four wingmen lit in the brand blue, each linked to it.
 */
const LEADER: V = at(0, 0, 110);
const leaderColor = DRONES.find((d) => d.key === "gazebo")?.color ?? c.primary;
const SWARM = [
  { o: LEADER, color: leaderColor },
  ...[at(-95, -85, 80), at(95, -85, 95), at(-95, 85, 95), at(95, 85, 80)].map(
    (o) => ({ o, color: c.primary }),
  ),
].sort((a, b) => depth(a.o) - depth(b.o));

/** The swarm as a standalone SVG, `width` px wide, styled as the hero draws its drones lit. */
function swarm(width: number) {
  const drones = SWARM.map((d) => ({ ...d, items: px4(d.o) }));
  const links = SWARM.filter((d) => d.o !== LEADER).map((d) =>
    line([add(LEADER, [0, 0, 20]), add(d.o, [0, 0, 20])]),
  );
  // Each drone's shadow on the floor, under it.
  const shadows = SWARM.map(({ o: [x, y] }) =>
    flat(x, y, 0, circ(40, 32), "lo"),
  );
  const [x0, y0, x1, y1] = bounds([
    ...drones.flatMap((d) => outline(d.items)),
    ...links,
    ...shadows,
  ]);
  const pad = 40; // room for the glows
  const vb = [x0 - pad, y0 - pad, x1 - x0 + 2 * pad, y1 - y0 + 2 * pad];
  const sw = (1.1 * vb[2]) / width; // a hairline at any scale
  const lit = (color: string) => `style="stroke:${color}"`;

  // The floor first, its glows dropped from under each drone to the ground,
  // then the links, then the drones far to near.
  const glows = drones.flatMap((d, k) =>
    d.items
      .filter(isGlow)
      .map(
        (i) =>
          `<g transform="${planeMatrix([i.glow[0], i.glow[1], 0])}"><circle r="${i.r}" style="fill:url(#g${k});stroke:none"/></g>`,
      ),
  );
  const body = drones.flatMap((d) =>
    d.items.map((i) => {
      if (isGlow(i)) return "";
      if (isRotor(i)) {
        const b = blade(i.r, i.turn);
        // Spinning: a faint tinted disc, and the blades smeared into it.
        const smear = [0, 60, 120]
          .map(
            (a) =>
              `<path d="${b}" transform="rotate(${a})" style="fill:${d.color};stroke:none"/><path d="${b}" transform="rotate(${a + 180})" style="fill:${d.color};stroke:none"/>`,
          )
          .join("");
        return `<g transform="${planeMatrix(i.rotor)}"><circle r="${i.r + 1}" style="fill:${d.color};fill-opacity:0.08;stroke:${d.color};stroke-opacity:0.25"/><g filter="url(#blur)" opacity="0.3">${smear}</g><circle r="${Math.max(1.2, i.r * 0.12)}" class="sil"/></g>`;
      }
      return `<path d="${i.d}" class="${i.cls}"${i.cls.includes("hi") ? ` ${lit(d.color)}` : ""}/>`;
    }),
  );
  const gradients = drones.map(
    (d, k) =>
      `<radialGradient id="g${k}"><stop offset="0" stop-color="${d.color}" stop-opacity="0.35"/><stop offset="1" stop-color="${d.color}" stop-opacity="0"/></radialGradient>`,
  );
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(" ")}"><defs>${gradients.join("")}<filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.5"/></filter></defs><style>path,circle{fill:none;stroke:${c.muted};stroke-width:${sw};stroke-linejoin:round;stroke-linecap:round}.sil{fill:${c.bg};stroke:${edge}}.lo{stroke:${c.border}}.pin,.guard{stroke:${edge}}.link{stroke:${c.primary};stroke-dasharray:${2 * sw} ${4 * sw};opacity:0.6}.dash{stroke-dasharray:${sw} ${3 * sw}}</style>${glows.join("")}${shadows.map((e) => `<path d="${e.d}" class="lo"/>`).join("")}${links.map((l) => `<path d="${l.d}" class="link"/>`).join("")}${body.join("")}</svg>`;
  return {
    src: svgUri(svg),
    width,
    height: Math.round((width * vb[3]) / vb[2]),
  };
}

const svgUri = (svg: string) =>
  `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

/** Every card shows the same swarm, so it's drawn once. */
const art = swarm(420);

/** The hero's 56px grid, faded out round the swarm. Satori can't tile or mask a CSS gradient, so it's an SVG. */
function grid(w: number, h: number) {
  return svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><pattern id="p" width="56" height="56" patternUnits="userSpaceOnUse"><path d="M0.5 0V56M0 0.5H56" stroke="${c.border}" fill="none"/></pattern><radialGradient id="f" cx="0.76" cy="0.55" r="0.34" gradientTransform="translate(0.76 0.55) scale(1 1.6) translate(-0.76 -0.55)"><stop offset="0.2" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient><mask id="m"><rect width="100%" height="100%" fill="url(#f)"/></mask></defs><rect width="100%" height="100%" fill="url(#p)" mask="url(#m)"/></svg>`,
  );
}

/** The diamond the navbar draws where two rules cross. */
function Mark({ x, y }: { x: number; y: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: x - 5,
        top: y - 5,
        width: 10,
        height: 10,
        transform: "rotate(45deg)",
        border: `1px solid ${c.border}`,
        background: c.bg,
      }}
    />
  );
}

const INSET = 56;

export async function ogImage({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  const [serif, sans, mono, logo] = await assets;
  const { width: W, height: H } = size;

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: c.bg,
        color: c.fg,
        fontFamily: "Plex Sans",
      }}
    >
      {/* The hero's grid, faded out round the swarm. */}
      {/* biome-ignore lint/performance/noImgElement: Satori, not the DOM */}
      <img src={grid(W, H)} width={W} height={H} alt="" />

      {/* The frame: the column's sides and two rules, marked where they cross. */}
      {[INSET, W - INSET].map((x) => (
        <div
          key={`x${x}`}
          style={{
            position: "absolute",
            left: x,
            top: 0,
            width: 1,
            height: H,
            background: c.border,
          }}
        />
      ))}
      {[INSET, H - INSET].map((y) => (
        <div
          key={`y${y}`}
          style={{
            position: "absolute",
            top: y,
            left: 0,
            height: 1,
            width: W,
            background: c.border,
          }}
        />
      ))}
      {/* The footer's solid brand blue, under the bottom rule. */}
      <div
        style={{
          position: "absolute",
          top: H - INSET,
          left: 0,
          width: W,
          height: INSET,
          background: c.primary,
        }}
      />
      {[INSET, W - INSET].flatMap((x) =>
        [INSET, H - INSET].map((y) => <Mark key={`${x}-${y}`} x={x} y={y} />),
      )}

      {/* biome-ignore lint/performance/noImgElement: Satori, not the DOM */}
      <img
        src={art.src}
        width={art.width}
        height={art.height}
        alt=""
        style={{
          position: "absolute",
          right: INSET + 24,
          top: (H - art.height) / 2 + 20,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: INSET,
          left: INSET,
          right: INSET,
          bottom: INSET,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "44px 56px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* biome-ignore lint/performance/noImgElement: Satori, not the DOM */}
          <img
            src={`data:image/png;base64,${logo.toString("base64")}`}
            width={44}
            height={44}
            alt=""
            style={{ borderRadius: 8 }}
          />
          <span style={{ fontFamily: "Plex Serif", fontSize: 34 }}>
            {appName}
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontFamily: "Plex Mono",
              fontSize: 18,
              color: c.muted,
            }}
          >
            {new URL(siteUrl).host}
          </span>
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", maxWidth: 560 }}
        >
          <span
            style={{
              fontFamily: "Plex Mono",
              fontSize: 18,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: c.muted,
            }}
          >
            {eyebrow}
          </span>
          <span
            style={{
              marginTop: 20,
              fontFamily: "Plex Serif",
              fontSize: title.length > 40 ? 52 : 64,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </span>
          {description && (
            <span
              style={{
                marginTop: 20,
                fontSize: 24,
                lineHeight: 1.4,
                color: c.muted,
                lineClamp: 2,
              }}
            >
              {description}
            </span>
          )}
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Plex Serif", data: serif, weight: 400 },
        { name: "Plex Sans", data: sans, weight: 400 },
        { name: "Plex Mono", data: mono, weight: 400 },
      ],
    },
  );
}
