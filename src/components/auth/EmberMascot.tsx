"use client";

// ForgeNote /login — Ember 吉祥物（DSN-02 角色 + 眼睛动效）。
// 在项目栈内重写自 docs/design/dsn-02-login-auth/prototype.html 的 buildMascot：
// 暖色 spark 家族，瞳孔随光标、聚焦密码捂眼、显示密码移开视线、成功笑、失败皱眉。
// 规格来源：handoff.md §3；实现约束：仅 transform/opacity，rAF 节流，reduced-motion 全降级，
// 内联 SVG（无远程图片/字体），首屏不依赖动效（装饰层，aria-hidden 由父层给整体 aria-label）。

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";

export type MascotPose =
  | "idle"
  | "glance"
  | "cover"
  | "avert"
  | "happy"
  | "worried"
  | "loading";

export interface MascotHandle {
  /** px/py ∈ [-1,1]，光标相对角色区中心的方向；仅 idle/glance 生效。 */
  setGaze: (px: number, py: number) => void;
  setPose: (pose: MascotPose) => void;
}

const SVGNS = "http://www.w3.org/2000/svg";

type Attrs = Record<string, string | number>;
function el(tag: string, attrs?: Attrs): SVGElement {
  const node = document.createElementNS(SVGNS, tag);
  if (attrs) for (const k in attrs) node.setAttribute(k, String(attrs[k]));
  return node;
}

interface EyeParts {
  scaleG: SVGElement;
  pupilG: SVGElement;
  arc: SVGElement;
  lid: SVGElement;
  leaves: SVGElement[];
  amtX: number;
  amtY: number;
}
interface PawParts {
  node: SVGElement;
}
interface CharParts {
  g: SVGElement;
  tilt: number;
  depth: number;
  baseCx: number;
  baseCy: number;
  eyes: EyeParts[];
  paws: PawParts[];
  mouth: SVGElement | null;
  mouthAnchor: { cx: number; cy: number } | null;
  brows: SVGElement[];
}

interface EyeCfg {
  cx: number;
  cy: number;
  r: number;
  kind: "sclera" | "dot";
}
interface BodyCfg {
  tag: "rect" | "path" | "ellipse";
  attrs: Attrs;
}
interface CharCfg {
  cx: number;
  cy: number;
  tilt?: number;
  depth?: number;
  pawColor: string;
  body: BodyCfg;
  belly?: Attrs;
  cheeks?: Attrs[];
  eyes: EyeCfg[];
  browAnchor?: { x1: number; y1: number; x2: number; y2: number }[];
  flame?: { d: string; d2?: string };
  mouth?: { cx: number; cy: number };
}

function mouthPath(a: { cx: number; cy: number }, pose: MascotPose): string {
  const mx = a.cx;
  const my = a.cy;
  if (pose === "happy") return `M ${mx - 11} ${my} Q ${mx} ${my + 11} ${mx + 11} ${my}`;
  if (pose === "worried") return `M ${mx - 9} ${my + 3} Q ${mx} ${my - 3} ${mx + 9} ${my + 3}`;
  if (pose === "loading") return `M ${mx - 6} ${my + 1} Q ${mx} ${my + 3.5} ${mx + 6} ${my + 1}`;
  return `M ${mx - 9} ${my} Q ${mx} ${my + 6} ${mx + 9} ${my}`;
}

function buildMascot(host: HTMLElement, mode: "group" | "single"): {
  setGaze: (px: number, py: number) => void;
  setPose: (pose: MascotPose) => void;
  destroy: () => void;
} {
  const reducedMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reduced = () => reducedMQ.matches;

  const svg = el("svg", {
    viewBox: mode === "group" ? "0 0 360 300" : "0 0 140 140",
    width: "100%",
    height: "100%",
    role: "img",
    "aria-label": "ForgeNote 吉祥物 Ember 一家",
    focusable: "false",
  });
  const defs = el("defs");
  function grad(id: string, c0: string, c1: string) {
    const g = el("linearGradient", { id, x1: 0, y1: 0, x2: 0, y2: 1 });
    g.appendChild(el("stop", { offset: 0, "stop-color": c0 }));
    g.appendChild(el("stop", { offset: 1, "stop-color": c1 }));
    defs.appendChild(g);
  }
  grad("emClay", "#D18A50", "#BE7038");
  grad("emCocoa", "#8A5A38", "#6E4327");
  grad("emAmber", "#EEB466", "#E0A15A");
  grad("emOrange", "#E39A63", "#D2814E");
  grad("emSolo", "#ECA86F", "#D98A5A");
  grad("emFlame", "#EE9B3B", "#B5562B");
  svg.appendChild(defs);

  const chars: CharParts[] = [];

  function makeEye(parent: SVGElement, cx: number, cy: number, r: number, kind: "sclera" | "dot"): EyeParts {
    const leaves: SVGElement[] = [];
    const scaleG = el("g");
    if (kind === "sclera") {
      const sc = el("ellipse", {
        cx, cy, rx: r, ry: r + 1.6, fill: "#FFFDF9", stroke: "#B06A3C", "stroke-width": 1.2,
        style: "opacity:1; transition:opacity 100ms ease",
      });
      scaleG.appendChild(sc);
      leaves.push(sc);
    }
    const pupilG = el("g");
    const pup = el("circle", {
      cx, cy, r: kind === "dot" ? r : r * 0.52, fill: "#33291F",
      style: "opacity:1; transition:opacity 100ms ease",
    });
    pupilG.appendChild(pup);
    leaves.push(pup);
    if (kind === "sclera") {
      const hl = el("circle", {
        cx: cx + r * 0.22, cy: cy - r * 0.24, r: r * 0.17, fill: "#FFFDF9",
        style: "opacity:1; transition:opacity 100ms ease",
      });
      pupilG.appendChild(hl);
      leaves.push(hl);
    }
    scaleG.appendChild(pupilG);
    parent.appendChild(scaleG);
    const arc = el("path", {
      d: `M ${cx - r} ${cy + 1} Q ${cx} ${cy - r - 1} ${cx + r} ${cy + 1}`,
      fill: "none", stroke: "#33291F", "stroke-width": 3, "stroke-linecap": "round",
      style: "opacity:0; transition:opacity 120ms ease",
    });
    parent.appendChild(arc);
    const lid = el("path", {
      d: `M ${cx - r} ${cy - 1} Q ${cx} ${cy + r * 0.62} ${cx + r} ${cy - 1}`,
      fill: "none", stroke: "#33291F", "stroke-width": kind === "dot" ? 2.4 : 2.8, "stroke-linecap": "round",
      style: "opacity:0; transition:opacity 90ms ease",
    });
    parent.appendChild(lid);
    return { scaleG, pupilG, arc, lid, leaves, amtX: kind === "dot" ? r * 0.42 : r * 0.36, amtY: kind === "dot" ? r * 0.48 : r * 0.42 };
  }

  function makePaw(parent: SVGElement, cx: number, cy: number, r: number, fill: string): PawParts {
    const p = el("ellipse", {
      cx, cy, rx: r + 2.5, ry: r + 1.5, fill, stroke: "#B06A3C", "stroke-width": 1.2,
      style: "opacity:0; transition:opacity 200ms ease, transform 240ms cubic-bezier(.34,1.45,.5,1)",
    });
    parent.appendChild(p);
    return { node: p };
  }

  function addChar(cfg: CharCfg) {
    const g = el("g");
    if (cfg.flame) {
      g.appendChild(el("path", { d: cfg.flame.d, fill: "url(#emFlame)" }));
      if (cfg.flame.d2) g.appendChild(el("path", { d: cfg.flame.d2, fill: "#FBE4C2", opacity: 0.85 }));
    }
    g.appendChild(el(cfg.body.tag, cfg.body.attrs));
    if (cfg.belly) g.appendChild(el("ellipse", cfg.belly));
    if (cfg.cheeks) cfg.cheeks.forEach((c) => g.appendChild(el("ellipse", c)));
    const eyes = cfg.eyes.map((e) => makeEye(g, e.cx, e.cy, e.r, e.kind));
    const brows: SVGElement[] = [];
    if (cfg.browAnchor) {
      cfg.browAnchor.forEach((b) => {
        const l = el("line", { x1: b.x1, y1: b.y1, x2: b.x2, y2: b.y2, stroke: "#7a4a2c", "stroke-width": 2.2, "stroke-linecap": "round", style: "opacity:0" });
        g.appendChild(l);
        brows.push(l);
      });
    }
    const paws = cfg.eyes.map((e) => makePaw(g, e.cx, e.cy - 1, e.r, cfg.pawColor));
    let mouth: SVGElement | null = null;
    if (cfg.mouth) {
      mouth = el("path", { d: mouthPath(cfg.mouth, "idle"), fill: "none", stroke: "#7a4a2c", "stroke-width": 2.4, "stroke-linecap": "round" });
      g.appendChild(mouth);
    }
    svg.appendChild(g);
    chars.push({ g, tilt: cfg.tilt || 0, depth: cfg.depth || 6, baseCx: cfg.cx, baseCy: cfg.cy, eyes, paws, mouth, mouthAnchor: cfg.mouth ?? null, brows });
  }

  if (mode === "group") {
    svg.appendChild(el("ellipse", { cx: 186, cy: 290, rx: 158, ry: 11, fill: "rgba(90,60,30,.12)" }));
    addChar({
      cx: 124, cy: 186, tilt: -6, depth: 5, pawColor: "#E0A56C",
      body: { tag: "rect", attrs: { x: 82, y: 78, width: 84, height: 210, rx: 26, fill: "url(#emClay)", stroke: "#A9622F", "stroke-width": 1.3 } },
      eyes: [{ cx: 108, cy: 130, r: 9, kind: "sclera" }, { cx: 140, cy: 130, r: 9, kind: "sclera" }],
      browAnchor: [{ x1: 99, y1: 114, x2: 117, y2: 118 }, { x1: 149, y1: 114, x2: 131, y2: 118 }],
    });
    addChar({
      cx: 207, cy: 200, tilt: 2, depth: 6, pawColor: "#B07A4E",
      body: { tag: "rect", attrs: { x: 174, y: 120, width: 66, height: 168, rx: 22, fill: "url(#emCocoa)", stroke: "#5c3a24", "stroke-width": 1.3 } },
      eyes: [{ cx: 192, cy: 164, r: 7.4, kind: "sclera" }, { cx: 222, cy: 164, r: 7.4, kind: "sclera" }],
    });
    addChar({
      cx: 92, cy: 270, tilt: 0, depth: 11, pawColor: "#F0C583",
      body: { tag: "path", attrs: { d: "M34 300 V250 a58 58 0 0 1 116 0 V300 Z", fill: "url(#emAmber)", stroke: "#C98A3E", "stroke-width": 1.3 } },
      cheeks: [{ cx: 60, cy: 266, rx: 5, ry: 2.8, fill: "#E5907A", opacity: 0.4 }, { cx: 126, cy: 266, rx: 5, ry: 2.8, fill: "#E5907A", opacity: 0.4 }],
      eyes: [{ cx: 76, cy: 250, r: 6, kind: "dot" }, { cx: 110, cy: 250, r: 6, kind: "dot" }],
    });
    addChar({
      cx: 286, cy: 270, tilt: 0, depth: 12, pawColor: "#EAAE7C",
      flame: { d: "M286 176 C 293 184 292.5 192 286 196 C 279.5 192 279 184 286 176 Z" },
      body: { tag: "path", attrs: { d: "M232 300 V236 a52 52 0 0 1 104 0 V300 Z", fill: "url(#emOrange)", stroke: "#B96D3E", "stroke-width": 1.3 } },
      cheeks: [{ cx: 258, cy: 262, rx: 5, ry: 2.8, fill: "#E5907A", opacity: 0.45 }, { cx: 314, cy: 262, rx: 5, ry: 2.8, fill: "#E5907A", opacity: 0.45 }],
      eyes: [{ cx: 266, cy: 242, r: 5.6, kind: "dot" }, { cx: 310, cy: 242, r: 5.6, kind: "dot" }],
      mouth: { cx: 288, cy: 266 },
    });
  } else {
    svg.appendChild(el("ellipse", { cx: 70, cy: 128, rx: 30, ry: 5, fill: "rgba(90,60,30,.14)" }));
    addChar({
      cx: 70, cy: 80, tilt: 0, depth: 0, pawColor: "#E6A270",
      flame: { d: "M70 12 C 79 22 78 33 70 38 C 62 33 61 22 70 12 Z", d2: "M70 21 C 74.5 27 74 34 70 37 C 66 34 65.5 27 70 21 Z" },
      body: { tag: "ellipse", attrs: { cx: 70, cy: 82, rx: 42, ry: 43, fill: "url(#emSolo)", stroke: "#B06A3C", "stroke-width": 1.5 } },
      belly: { cx: 70, cy: 90, rx: 28, ry: 25, fill: "#F4E3CD", opacity: 0.62 },
      cheeks: [{ cx: 45, cy: 88, rx: 6.4, ry: 3.6, fill: "#E5907A", opacity: 0.5 }, { cx: 95, cy: 88, rx: 6.4, ry: 3.6, fill: "#E5907A", opacity: 0.5 }],
      eyes: [{ cx: 53, cy: 74, r: 10, kind: "sclera" }, { cx: 87, cy: 74, r: 10, kind: "sclera" }],
      browAnchor: [{ x1: 42, y1: 57, x2: 60, y2: 61 }, { x1: 98, y1: 57, x2: 80, y2: 61 }],
      mouth: { cx: 70, cy: 94 },
    });
  }
  host.appendChild(svg);

  let gx = 0;
  let gy = 0;
  let pose: MascotPose = "idle";
  let blink = 0;

  function applyTransitions() {
    const on = !reduced();
    chars.forEach((c) => {
      c.g.style.transition = on ? "transform 220ms ease-out" : "none";
      c.eyes.forEach((e) => {
        e.scaleG.style.transition = on ? "opacity 110ms ease" : "none";
        e.lid.style.transition = on ? "opacity 90ms ease" : "none";
        e.arc.style.transition = on ? "opacity 120ms ease" : "none";
        e.pupilG.style.transition = on ? "transform 140ms ease-out" : "none";
      });
      c.paws.forEach((p) => {
        p.node.style.transition = on
          ? "opacity 200ms ease, transform 240ms cubic-bezier(.34,1.45,.5,1)"
          : "none";
      });
    });
  }

  function render() {
    const bodyLift = pose === "avert" ? 5 : 0;
    const rotExtra = pose === "avert" ? -7 : 0;
    let ex = gx;
    let ey = gy;
    if (pose === "glance") { ex = 0.35; ey = 0.95; }
    else if (pose === "avert") { ex = -0.9; ey = -0.55; }
    else if (pose === "cover") { ex = 0; ey = 0.3; }
    const covered = pose === "cover";
    const happy = pose === "happy";
    const worried = pose === "worried";
    const sleepy = pose === "loading";
    chars.forEach((c) => {
      const tx = (ex * c.depth).toFixed(2);
      const ty = (ey * c.depth * 0.65 + bodyLift).toFixed(2);
      c.g.setAttribute("transform", `translate(${tx} ${ty}) rotate(${(c.tilt + rotExtra).toFixed(2)} ${c.baseCx} ${c.baseCy})`);
      const closed = covered || sleepy || (blink && (pose === "idle" || pose === "glance"));
      c.eyes.forEach((e) => {
        if (happy) {
          e.arc.style.opacity = "1";
          e.leaves.forEach((l) => (l.style.opacity = "0"));
          e.lid.style.opacity = "0";
          return;
        }
        e.arc.style.opacity = "0";
        if (closed) {
          e.leaves.forEach((l) => (l.style.opacity = "0"));
          e.lid.style.opacity = "1";
        } else {
          e.leaves.forEach((l) => (l.style.opacity = "1"));
          e.lid.style.opacity = "0";
          e.pupilG.setAttribute("transform", `translate(${(ex * e.amtX).toFixed(2)} ${(ey * e.amtY).toFixed(2)})`);
        }
      });
      c.paws.forEach((p) => {
        p.node.style.opacity = covered ? "1" : "0";
        p.node.style.transform = covered ? "translateX(0px)" : "translateY(5px)";
      });
      c.brows.forEach((b) => (b.style.opacity = worried ? "1" : "0"));
      if (c.mouth && c.mouthAnchor) {
        c.mouth.setAttribute("d", mouthPath(c.mouthAnchor, happy ? "happy" : worried ? "worried" : sleepy ? "loading" : "idle"));
      }
    });
  }

  let nextBlinkAt = performance.now() + 1800 + Math.random() * 2600;
  let blinkUntil = 0;
  let rafId = 0;
  function loop(now: number) {
    const active = !reduced() && (pose === "idle" || pose === "glance");
    let b = 0;
    if (active) {
      if (now >= nextBlinkAt) {
        blinkUntil = now + 125;
        nextBlinkAt = now + 2600 + Math.random() * 3800;
      }
      b = now < blinkUntil ? 1 : 0;
    }
    if (b !== blink) {
      blink = b;
      render();
    }
    rafId = requestAnimationFrame(loop);
  }

  const onReducedChange = () => {
    applyTransitions();
    render();
  };

  applyTransitions();
  render();
  rafId = requestAnimationFrame(loop);
  reducedMQ.addEventListener("change", onReducedChange);

  return {
    setGaze(px, py) {
      gx = Math.max(-1, Math.min(1, px));
      gy = Math.max(-1, Math.min(1, py));
      if (pose === "idle" || pose === "glance") render();
    },
    setPose(p) {
      if (p === pose) return;
      pose = p;
      render();
    },
    destroy() {
      cancelAnimationFrame(rafId);
      reducedMQ.removeEventListener("change", onReducedChange);
      host.replaceChildren();
    },
  };
}

interface EmberMascotProps {
  mode: "group" | "single";
  className?: string;
  ref?: Ref<MascotHandle>;
}

export function EmberMascot({ mode, className, ref }: EmberMascotProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<ReturnType<typeof buildMascot> | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const controller = buildMascot(host, mode);
    controllerRef.current = controller;
    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, [mode]);

  useImperativeHandle(
    ref,
    () => ({
      setGaze: (px, py) => controllerRef.current?.setGaze(px, py),
      setPose: (pose) => controllerRef.current?.setPose(pose),
    }),
    [],
  );

  return <div ref={hostRef} className={className} aria-hidden />;
}
