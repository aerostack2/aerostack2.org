// The drones in the hero, drawn with the line-art engine
// (../figures/line-art.ts) as plain data: each one is a list of items painted
// in order, far to near. Most items are line-art paths; two kinds are left for
// the hero to draw itself, because they move or glow: a rotor, laid flat on
// its plane so CSS can spin it, and a pool of coloured light on the floor.

import {
  add,
  block,
  circ,
  depth,
  type El,
  flat,
  frame,
  line,
  mul,
  rad,
  ringOn,
  rod,
  rrect,
  type Sample,
  solid,
  type V,
  Z,
} from "../figures/line-art";

/** `cls` lets a page single out a rotor, as the 404 does to knock two off. */
export type Rotor = { rotor: V; r: number; turn: 1 | -1; cls?: string };
export type Glow = { glow: V; r: number };
export type Item = El | Rotor | Glow;
export const isRotor = (i: Item): i is Rotor => "rotor" in i;
export const isGlow = (i: Item): i is Glow => "glow" in i;

/** One slender two-blade prop of radius `r`, flat about the origin, swept against its turn. */
export function blade(r: number, turn: 1 | -1): string {
  const n = 14;
  const k = r / 36;
  const at = (rr: number, a: number) => [
    rr * Math.cos(a),
    turn * rr * Math.sin(a),
  ];
  const lead: number[][] = [];
  const trail: number[][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const rr = 4 * k + (r - 4 * k) * t;
    const chord =
      k * (2.5 + 6 * Math.sin(Math.PI * (0.15 + 0.6 * t)) * (1 - 0.6 * t));
    const sweep = -0.12 * t * t;
    lead.push(at(rr, sweep + (0.4 * chord) / rr));
    trail.push(at(rr, sweep - (0.6 * chord) / rr));
  }
  const pts = [...lead, at(r + k, -0.13), ...trail.reverse()];
  return `M${pts.map((p) => p.map((c) => c.toFixed(2)).join(" ")).join("L")}Z`;
}

/**
 * A drone's own frame at `o`, turned `heading` degrees on the floor: x to its
 * right, y out of its nose, z up. `up` stands a block in that frame.
 */
function local(o: V, heading: number) {
  const h = rad(heading);
  const F: V = [Math.sin(h), Math.cos(h), 0];
  const R: V = [Math.cos(h), -Math.sin(h), 0];
  const P = (x: number, y: number, z: number): V =>
    add(o, mul(R, x), mul(F, y), [0, 0, z]);
  const up = (
    x: number,
    y: number,
    z0: number,
    z1: number,
    ring: Sample[],
    opts?: { taper?: number; bevel?: number; cls?: string },
  ) => solid(P(x, y, z0), P(x, y, z1), ring, R, opts);
  return { P, F, R, up };
}

type Part = { at: V; items: Item[] };
const paint = (parts: Part[]) =>
  [...parts].sort((a, b) => depth(a.at) - depth(b.at)).flatMap((p) => p.items);

/** Motor positions on the drone's axes, which the camera shows as an X. */
const cross4 = (d: number): [number, number][] => [
  [d, 0],
  [0, d],
  [-d, 0],
  [0, -d],
];
const spin = (k: number): 1 | -1 => (k % 2 ? 1 : -1);

/** A Crazyflie: a bare board on two crossed bars, motors hung at their ends. */
export function crazyflie(o: V): Item[] {
  const { P, up } = local(o, 0);
  const arm = 20;
  const bar = rrect(-0.7, -1.6, 0.7, 1.6, 0.6);
  const motors = cross4(arm);
  return [
    { glow: add(o, [0, 0, -16]), r: 30 },
    ...solid(P(-arm, 0, 5.5), P(arm, 0, 5.5), bar, Z),
    ...solid(P(0, -arm, 5.5), P(0, arm, 5.5), bar, Z),
    ...paint([
      ...motors.map(([x, y]) => ({
        at: P(x, y, 0),
        items: [
          ...up(x, y, 0, 7.5, circ(3.2, 24), { bevel: 0.8 }),
          ...up(x, y, 7.5, 8.8, circ(1.8, 16), { bevel: 0.5 }),
        ],
      })),
      {
        at: P(0, 0, 0),
        items: [
          ...up(0, 0, 4.8, 6.4, rrect(-8, -8, 8, 8, 2.5), { cls: "hi" }),
          ...up(0, 0, 6.4, 9, rrect(-5.5, -3.2, 5.5, 3.2, 1), { bevel: 0.8 }),
        ],
      },
    ]),
    ...paint(
      motors.map(([x, y], k) => ({
        at: P(x, y, 9),
        items: [{ rotor: P(x, y, 9.2), r: 10, turn: spin(k) }],
      })),
    ),
  ];
}

/**
 * A quadcopter on a stacked-plate frame: arms between two plates, a battery
 * on top, and optionally landing legs and a GPS mast, as on a PX4 build.
 */
function multirotor(
  o: V,
  {
    arm,
    prop,
    legs,
    gps,
  }: { arm: number; prop: number; legs: boolean; gps: boolean },
): Item[] {
  const { P, up } = local(o, 0);
  const p = arm * 0.3;
  const motors = cross4(arm);
  const corners: [number, number][] = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ];
  const legItems: Item[] = legs
    ? corners.flatMap(([sx, sy]) => {
        const foot = P(sx * p * 1.25, sy * p * 1.25, 0);
        return [
          rod(P(sx * p * 0.7, sy * p * 0.7, 8), foot, 1.4, 1.2),
          rod(foot, foot, 2, 2),
        ];
      })
    : [];
  const armRing = rrect(-2.2, -3.5, 2.2, 3.5, 1.5);
  return [
    ...legItems,
    ...up(0, 0, 8, 9.5, rrect(-p, -p, p, p, 3)),
    ...motors.flatMap(([x, y]) =>
      solid(P(x * 0.2, y * 0.2, 11.5), P(x, y, 11.5), armRing, Z, {
        taper: 0.8,
        bevel: 0.8,
      }),
    ),
    ...paint(
      motors.map(([x, y]) => ({
        at: P(x, y, 0),
        items: [
          ...up(x, y, 9.5, 18, circ(4.5, 24), { bevel: 1 }),
          ...up(x, y, 18, 21.5, circ(4, 24), { taper: 0.9, bevel: 0.8 }),
        ],
      })),
    ),
    ...up(0, 0, 13.5, 15, rrect(-p, -p, p, p, 3), { cls: "hi" }),
    ...paint([
      {
        at: P(0, p * 0.2, 18),
        items: up(
          0,
          p * 0.2,
          15,
          21,
          rrect(-p * 0.45, -p * 0.6, p * 0.45, p * 0.6, 2),
          {
            bevel: 1,
          },
        ),
      },
      ...(gps
        ? [
            {
              at: P(0, -p * 0.75, 33),
              items: [
                rod(P(0, -p * 0.75, 15), P(0, -p * 0.75, 32), 1.1, 1),
                ...up(0, -p * 0.75, 32, 35, circ(6, 24), { cls: "hi" }),
              ],
            },
          ]
        : []),
    ]),
    ...paint(
      motors.map(([x, y], k) => ({
        at: P(x, y, 22),
        items: [{ rotor: P(x, y, 22), r: prop, turn: spin(k) }],
      })),
    ),
  ];
}

/** A PX4 build on an F450-style frame, with landing legs and a GPS mast. */
export const px4 = (o: V): Item[] => [
  { glow: add(o, [0, 0, -14]), r: 70 },
  ...multirotor(o, { arm: 45, prop: 24, legs: true, gps: true }),
];

/** A Tello: a rounded body with a camera in its nose, props in guards. */
export function tello(o: V): Item[] {
  // Turned so its nose, and the camera in it, face the viewer.
  const { P, F, R, up } = local(o, 45);
  const d = 22;
  const motors: [number, number][] = [
    [d, d],
    [-d, d],
    [-d, -d],
    [d, -d],
  ];
  const guard = (x: number, y: number, z: number): El =>
    ringOn(frame(P(x, y, z), Z, R), circ(14.5, 40), "guard");
  return [
    { glow: add(o, [0, 0, -16]), r: 46 },
    ...motors.flatMap(([x, y]) =>
      solid(
        P(x * 0.4, y * 0.55, 10),
        P(x, y, 10),
        rrect(-2, -2.6, 2, 2.6, 1.2),
        Z,
        {
          taper: 0.85,
          bevel: 0.6,
        },
      ),
    ),
    ...paint([
      ...motors.map(([x, y]) => ({
        at: P(x, y, 0),
        items: [
          guard(x, y, 9),
          ...up(x, y, 7, 13, circ(3.4, 20), { bevel: 0.7 }),
        ],
      })),
      {
        at: P(0, 0, 0),
        items: [
          ...up(0, 0, 4, 15, rrect(-12, -17, 12, 17, 6), {
            taper: 0.92,
            cls: "hi",
          }),
          ringOn(frame(P(0, 16.4, 9.5), F, R), circ(2.6, 20)),
          ringOn(frame(P(0, 16.4, 9.5), F, R), circ(1, 12), "lo"),
        ],
      },
    ]),
    ...paint(
      motors.map(([x, y], k) => ({
        at: P(x, y, 14),
        items: [
          { rotor: P(x, y, 13.6), r: 12, turn: spin(k) },
          guard(x, y, 15),
        ],
      })),
    ),
  ];
}

/** A simulated quadcopter hovering over a gridded plinth, as in Gazebo. */
export function gazebo(o: V): Item[] {
  const size = 42;
  const grid: El[] = [];
  for (let k = 1; k < 8; k++) {
    const v = -size + (2 * size * k) / 8;
    grid.push(
      line([add(o, [v, -size + 2, 0]), add(o, [v, size - 2, 0])], "lo"),
      line([add(o, [-size + 2, v, 0]), add(o, [size - 2, v, 0])], "lo"),
    );
  }
  return [
    ...block(o[0], o[1], o[2] - 5, o[2], rrect(-size, -size, size, size, 4), {
      bevel: 1,
    }),
    ...grid,
    { glow: o, r: 42 },
    flat(o[0], o[1], o[2], circ(16, 40), "lo dash"),
    ...multirotor(add(o, [0, 0, 26]), {
      arm: 34,
      prop: 17,
      legs: false,
      gps: false,
    }),
  ];
}

/** The paths of a drawing and its rotors' sweeps, for fitting it in a box. */
export const outline = (items: Item[]): El[] =>
  items.flatMap((i): El[] =>
    isGlow(i)
      ? []
      : isRotor(i)
        ? [flat(i.rotor[0], i.rotor[1], i.rotor[2], circ(i.r + 1, 24), "")]
        : [i],
  );
