import { ImageResponse } from "next/og";
import { appName } from "@/lib/shared";
import { assets, cDark, grid, c as light, Mark, swarm } from "../og-image";

/** The README banner: the social card's frame, grid and swarm, with the name and tagline centred. */
const W = 2000;
const H = 500;
const INSET = 40;

/** `?theme=dark` draws it in the site's dark theme. */
export async function GET(req: Request) {
  const dark = new URL(req.url).searchParams.get("theme") === "dark";
  const c = dark ? cDark : light;
  const art = swarm(360, c);
  const [serif, sans, mono, logo] = await assets;

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
      {/* biome-ignore lint/performance/noImgElement: Satori, not the DOM */}
      <img src={grid(W, H, c)} width={W} height={H} alt="" />

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
        [INSET, H - INSET].map((y) => (
          <Mark key={`${x}-${y}`} x={x} y={y} p={c} />
        )),
      )}

      {/* biome-ignore lint/performance/noImgElement: Satori, not the DOM */}
      <img
        src={art.src}
        width={art.width}
        height={art.height}
        alt=""
        style={{
          position: "absolute",
          right: INSET + 40,
          top: (H - art.height) / 2,
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
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {/* biome-ignore lint/performance/noImgElement: Satori, not the DOM */}
          <img
            src={`data:image/png;base64,${logo.toString("base64")}`}
            width={96}
            height={96}
            alt=""
            style={{ borderRadius: 16 }}
          />
          <span
            style={{
              fontFamily: "Plex Serif",
              fontSize: 112,
              letterSpacing: "-0.02em",
            }}
          >
            {appName}
          </span>
        </div>
        <span style={{ marginTop: 36, fontSize: 48, color: c.muted }}>
          Build and fly aerial robots on ROS 2.
        </span>
        <span
          style={{
            marginTop: 28,
            fontFamily: "Plex Mono",
            fontSize: 22,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: c.muted,
          }}
        >
          Open source · ROS 2 · Multi-robot
        </span>
      </div>
    </div>,
    {
      width: W,
      height: H,
      fonts: [
        { name: "Plex Serif", data: serif, weight: 400 },
        { name: "Plex Sans", data: sans, weight: 400 },
        { name: "Plex Mono", data: mono, weight: 400 },
      ],
    },
  );
}
