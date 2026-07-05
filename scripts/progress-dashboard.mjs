#!/usr/bin/env node
// 项目进度面板生成器。事实源：docs/roadmap/roadmap.json（票状态人工维护）；
// commit 证据从 git log 按票号自动采集，并对状态/commit 不一致做漂移告警。
// 用法：node scripts/progress-dashboard.mjs [--open]

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync, spawn } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ROADMAP = join(root, "docs/roadmap/roadmap.json");
const OUT = join(root, "docs/roadmap/dashboard.html");

const STATUS = {
  todo: { label: "待开发", color: "#6B6252", bg: "#EFEBE1" },
  in_progress: { label: "进行中", color: "#B4490F", bg: "#FBE7D2" },
  code_done: { label: "代码完成", color: "#7A5F26", bg: "#F3EAD2" },
  accepted: { label: "已验收", color: "#4F7A43", bg: "#E8EFDB" },
};
const DONE_STATES = new Set(["code_done", "accepted"]);

const roadmap = JSON.parse(readFileSync(ROADMAP, "utf8"));

function git(...args) {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

const branch = git("rev-parse", "--abbrev-ref", "HEAD") || "?";
const logLines = git("log", "--oneline", "--all", "--no-color")
  .split("\n")
  .filter(Boolean);

// 按票号采集 commit 证据（subject 含 "M2-04" 这样的完整票号才算）
const commitsByTicket = new Map();
for (const t of roadmap.tickets) {
  const re = new RegExp(`\\b${t.id}\\b`);
  commitsByTicket.set(t.id, logLines.filter((l) => re.test(l)));
}

// 实现类 commit：排除 docs/chore/style 等——它们提到票号只是「谈论」不是「实现」。
// 仅用于「todo 却有 commit」判定，避免本文件这种「docs(roadmap): M2-04 …」把未起步票误报成有实现。
// 「done 却无 commit」判定用全部 commit：裁决/文档类票（如 M2-00）的实现本就是 docs commit，也算证据。
const isImplCommit = (line) => !/^\S+\s+(docs|chore|style|test|ci)[(:]/.test(line);

// 漂移检测：事实源状态与 git 证据互相矛盾时告警
const drift = [];
for (const t of roadmap.tickets) {
  const commits = commitsByTicket.get(t.id);
  const implCommits = commits.filter(isImplCommit);
  if (t.status === "todo" && implCommits.length > 0) {
    drift.push(`${t.id} 标记为「待开发」，但已有 ${implCommits.length} 个实现类 commit——状态可能没更新`);
  }
  if (DONE_STATES.has(t.status) && commits.length === 0) {
    drift.push(`${t.id} 标记为「${STATUS[t.status].label}」，但 git log 找不到相关 commit——请核对`);
  }
  if (t.status === "accepted" && !t.acceptance) {
    drift.push(`${t.id} 标记为「已验收」，但没有 acceptance 证据链接（docs/acceptance/*.md）`);
  }
}

const byId = new Map(roadmap.tickets.map((t) => [t.id, t]));

// 悬空依赖：deps 指向不存在的票号 → depsMet 会把它永久算作未满足并静默 block，故告警
for (const t of roadmap.tickets) {
  const unknown = t.deps.filter((d) => !byId.has(d));
  if (unknown.length) {
    drift.push(`${t.id} 的依赖指向未知票号 ${unknown.join("、")}——请核对 roadmap.json 的 deps 是否写错`);
  }
}

// 传递依赖的下游数量 = 这张票解锁多少后续工作（用于「下一步」排序）
function unlockCount(id, seen = new Set()) {
  let n = 0;
  for (const t of roadmap.tickets) {
    if (t.deps.includes(id) && !seen.has(t.id)) {
      seen.add(t.id);
      n += 1 + unlockCount(t.id, seen);
    }
  }
  return n;
}

function depsMet(t) {
  return t.deps.every((d) => DONE_STATES.has(byId.get(d)?.status));
}

const ready = roadmap.tickets
  .filter((t) => t.status === "todo" && depsMet(t))
  .sort((a, b) => unlockCount(b.id) - unlockCount(a.id));
const inProgress = roadmap.tickets.filter((t) => t.status === "in_progress");
const blocked = roadmap.tickets
  .filter((t) => t.status === "todo" && !depsMet(t))
  .map((t) => ({
    ...t,
    blockers: t.deps.filter((d) => !DONE_STATES.has(byId.get(d)?.status)),
  }));

const doneCount = roadmap.tickets.filter((t) => DONE_STATES.has(t.status)).length;
const total = roadmap.tickets.length;

const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function depChips(t) {
  if (!t.deps.length) return `<span class="chip chip-ok">无依赖</span>`;
  return t.deps
    .map((d) => {
      const ok = DONE_STATES.has(byId.get(d)?.status);
      return `<span class="chip ${ok ? "chip-ok" : "chip-block"}">${esc(d)}${ok ? " ✓" : " ✗"}</span>`;
    })
    .join("");
}

function commitList(t) {
  const commits = commitsByTicket.get(t.id);
  if (!commits.length) return "";
  const shown = commits.slice(0, 3).map((c) => `<li><code>${esc(c)}</code></li>`).join("");
  const more = commits.length > 3 ? `<li class="muted">…共 ${commits.length} 个 commit</li>` : "";
  return `<ul class="commits">${shown}${more}</ul>`;
}

function ticketCard(t, { highlight = false, blockers = [] } = {}) {
  const s = STATUS[t.status];
  return `<div class="card ${highlight ? "card-next" : ""}">
    <div class="card-head">
      <span class="tid">${esc(t.id)}</span>
      <span class="badge" style="color:${s.color};background:${s.bg}">${s.label}</span>
    </div>
    <div class="ttitle">${esc(t.title)}</div>
    <div class="tdone">${esc(t.done)}</div>
    ${t.note ? `<div class="tnote">⚠ ${esc(t.note)}</div>` : ""}
    ${blockers.length ? `<div class="tnote">被阻塞：等待 ${blockers.map(esc).join("、")}</div>` : ""}
    <div class="deps">${depChips(t)}</div>
    ${t.acceptance ? `<div class="accept">验收证据：<code>${esc(t.acceptance)}</code></div>` : ""}
    ${commitList(t)}
  </div>`;
}

function milestoneStep(m) {
  const cls = m.status === "done" ? "ms-done" : m.status === "in_progress" ? "ms-now" : "ms-todo";
  const mark = m.status === "done" ? "✓" : m.status === "in_progress" ? "●" : "○";
  const prog = m.id === roadmap.currentMilestone ? `<div class="ms-prog">${doneCount}/${total} 票完成</div>` : "";
  return `<div class="ms ${cls}">
    <div class="ms-mark">${mark}</div>
    <div class="ms-title">${esc(m.title)}</div>
    ${prog}
    <div class="ms-note">${esc(m.note || "")}</div>
  </div>`;
}

const columns = ["in_progress", "todo", "code_done", "accepted"].map((st) => {
  const list = roadmap.tickets.filter((t) => t.status === st);
  const cards = list
    .map((t) => {
      const b = blocked.find((x) => x.id === t.id);
      return ticketCard(t, { blockers: b ? b.blockers : [] });
    })
    .join("");
  return `<div class="col">
    <div class="col-head">${STATUS[st].label} <span class="count">${list.length}</span></div>
    ${cards || `<div class="empty">—</div>`}
  </div>`;
});

const now = new Date().toLocaleString("zh-CN", { hour12: false });
const pct = Math.round((doneCount / total) * 100);

const html = `<!doctype html>
<html lang="zh-CN">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ForgeNote · 项目进度</title>
<style>
  :root {
    --canvas:#F4F1E9; --card:#FCFAF5; --paper0:#EFEBE1;
    --paper1:#EAE4D8; --paper2:#E6DFD1; --inset:#E6DFD1;
    --ink:#26211A; --ink2:#6B6252; --ink3:#A79C89;
    --accent:#E8631F; --accent-strong:#B4490F; --accent-ghost:#FBE7D2;
    --border:#E6DFD1; --border-soft:#EFE9DD;
    --ok:#4F7A43; --ok-bg:#E8EFDB;
    --serif:Georgia,"Songti SC","Noto Serif SC",serif;
  }
  * { box-sizing:border-box; }
  body {
    margin:0; padding:32px 40px 64px; color:var(--ink); background:var(--canvas);
    font-family:"PingFang SC","Noto Sans CJK SC",sans-serif; line-height:1.6;
  }
  h1 { font-family:var(--serif); font-size:24px; font-weight:600; letter-spacing:-.01em; margin:0; }
  h2 { font-family:var(--serif); font-size:17px; font-weight:600; letter-spacing:-.01em; margin:36px 0 12px; color:var(--ink); }
  .meta { color:var(--ink2); font-size:12px; margin-top:4px; }
  .meta code { background:var(--paper1); padding:1px 6px; border-radius:4px; }

  .drift { background:var(--accent-ghost); border:1px solid var(--accent); border-radius:12px;
    padding:12px 16px; margin:20px 0 0; font-size:13px; }
  .drift b { color:var(--accent-strong); }
  .drift li { margin:2px 0; }

  .direction { background:var(--card); border:1px solid var(--border-soft); border-radius:16px;
    padding:18px 22px; margin-top:20px; box-shadow:0 2px 6px rgba(0,0,0,.05); }
  .direction .dt { font-family:var(--serif); font-weight:600; font-size:18px; }
  .direction .ds { color:var(--ink2); font-size:13px; margin-top:6px; }
  .direction .anchor { margin-top:10px; font-size:13px; border-left:3px solid var(--accent);
    padding:4px 12px; background:var(--paper0); border-radius:0 8px 8px 0; }

  .track { display:flex; gap:10px; overflow-x:auto; }
  .ms { flex:1; min-width:150px; background:var(--paper0); border:1px solid var(--border-soft);
    border-radius:12px; padding:12px 14px; font-size:12px; color:var(--ink2); }
  .ms-title { font-weight:600; color:var(--ink); font-size:13px; margin:6px 0 2px; }
  .ms-mark { width:22px; height:22px; border-radius:50%; display:flex; align-items:center;
    justify-content:center; font-size:12px; background:var(--inset); color:var(--ink3); }
  .ms-done .ms-mark { background:var(--ok-bg); color:var(--ok); }
  .ms-now { background:var(--card); border-color:var(--accent); box-shadow:0 2px 6px rgba(0,0,0,.05); }
  .ms-now .ms-mark { background:var(--accent); color:#fff; }
  .ms-prog { color:var(--accent-strong); font-weight:600; margin:2px 0; }
  .ms-note { font-size:11px; line-height:1.5; }

  .progressbar { height:8px; background:var(--inset); border-radius:4px; margin:14px 0 4px;
    box-shadow:inset 0 1px 0 rgba(0,0,0,.04); overflow:hidden; }
  .progressbar > div { height:100%; width:${pct}%; background:var(--accent); border-radius:4px; }
  .pct { font-size:12px; color:var(--ink2); }

  .next-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:12px; }
  .board { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; align-items:start; }
  @media (max-width:1100px){ .board { grid-template-columns:repeat(2,1fr); } }
  .col-head { font-size:13px; font-weight:600; color:var(--ink2); padding:4px 2px 8px; }
  .count { color:var(--ink3); font-weight:400; }
  .empty { color:var(--ink3); font-size:13px; padding:8px 2px; }

  .card { background:var(--card); border:1px solid var(--border-soft); border-radius:12px;
    padding:12px 14px; margin-bottom:10px; box-shadow:0 1px 0 rgba(0,0,0,.03); font-size:12px; }
  .card-next { border-color:var(--accent); box-shadow:0 2px 6px rgba(0,0,0,.05); }
  .card-head { display:flex; justify-content:space-between; align-items:center; }
  .tid { font-weight:700; font-size:12px; color:var(--ink3); letter-spacing:.02em; }
  .badge { font-size:11px; padding:1px 8px; border-radius:4px; font-weight:600; }
  .ttitle { font-family:var(--serif); font-weight:600; font-size:14px; margin:4px 0 2px; }
  .tdone { color:var(--ink2); font-size:11.5px; }
  .tnote { color:var(--accent-strong); font-size:11.5px; margin-top:4px; }
  .deps { margin-top:8px; display:flex; flex-wrap:wrap; gap:4px; }
  .chip { font-size:10.5px; padding:0 6px; border-radius:4px; border:1px solid var(--border-soft); color:var(--ink3); }
  .chip-ok { background:var(--ok-bg); color:var(--ok); border-color:transparent; }
  .chip-block { background:var(--accent-ghost); color:var(--accent-strong); border-color:transparent; }
  .accept { margin-top:6px; font-size:11px; color:var(--ok); }
  .accept code, .commits code { background:var(--paper1); padding:0 4px; border-radius:4px; font-size:10.5px; }
  .commits { margin:6px 0 0; padding-left:16px; color:var(--ink3); font-size:11px; }
  .commits li { margin:1px 0; }
  .muted { color:var(--ink3); }

  .final { background:var(--card); border:1px solid var(--border-soft); border-radius:16px;
    padding:20px 24px; box-shadow:0 2px 6px rgba(0,0,0,.05); }
  .final .one { font-family:var(--serif); font-size:18px; font-weight:600; color:var(--ink);
    border-left:3px solid var(--accent); padding:2px 0 2px 14px; }
  .final .stmt { color:var(--ink2); font-size:13px; margin-top:12px; line-height:1.75; }
  .loop { display:flex; flex-wrap:wrap; gap:8px; margin:16px 0 4px; align-items:stretch; }
  .loop-step { flex:1; min-width:150px; background:var(--paper0); border:1px solid var(--border-soft);
    border-radius:10px; padding:10px 12px; font-size:12px; color:var(--ink2); position:relative; }
  .loop-step .n { display:inline-flex; width:18px; height:18px; border-radius:50%; background:var(--accent-ghost);
    color:var(--accent-strong); font-size:11px; font-weight:600; align-items:center; justify-content:center; margin-right:6px; }
  .moat { margin-top:12px; font-size:12px; color:var(--ink2); background:var(--paper0);
    border-radius:10px; padding:10px 14px; }
  .moat b { color:var(--accent-strong); font-weight:600; }

  .horizons { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:12px; }
  .hz { border:1px solid var(--border-soft); border-radius:12px; padding:14px 16px; background:var(--card);
    box-shadow:0 1px 0 rgba(0,0,0,.03); }
  .hz.now { border-color:var(--accent); box-shadow:0 2px 6px rgba(0,0,0,.05); }
  .hz.never { background:var(--paper0); }
  .hz-when { font-size:11px; font-weight:600; letter-spacing:.02em; color:var(--ink3); text-transform:none; }
  .hz.now .hz-when { color:var(--accent-strong); }
  .hz-title { font-family:var(--serif); font-size:15px; font-weight:600; color:var(--ink); margin:4px 0 6px; }
  .hz-detail { font-size:12px; line-height:1.65; color:var(--ink2); }
  .hz.never .hz-title { color:var(--ink2); }

  footer { margin-top:40px; font-size:11.5px; color:var(--ink3); border-top:1px solid var(--border-soft); padding-top:12px; }
</style>

<h1>ForgeNote · 项目进度面板</h1>
<div class="meta">生成于 ${esc(now)} · 分支 <code>${esc(branch)}</code> · 事实源 <code>docs/roadmap/roadmap.json</code>（更新于 ${esc(roadmap.updated)}）</div>

${drift.length ? `<div class="drift"><b>⚠ 漂移告警（事实源与 git 证据不一致）</b><ul>${drift.map((d) => `<li>${esc(d)}</li>`).join("")}</ul></div>` : ""}

<h2>项目总览</h2>
<div class="direction">
  <div class="dt">${esc(roadmap.direction.title)}</div>
  <div class="ds">${esc(roadmap.direction.summary)}</div>
  <div class="anchor">${esc(roadmap.direction.anchor)}</div>
</div>

<h2>里程碑轨道</h2>
<div class="track">${roadmap.milestones.map(milestoneStep).join("")}</div>
<div class="progressbar"><div></div></div>
<div class="pct">${esc(roadmap.currentMilestone)}：${doneCount}/${total} 票完成（${pct}%）· 进行中 ${inProgress.length} · 可立即开工 ${ready.length} · 被阻塞 ${blocked.length}</div>

<h2>下一步（依赖已满足，按解锁量排序）</h2>
<div class="next-grid">
  ${ready.length ? ready.map((t) => ticketCard(t, { highlight: true })).join("") : `<div class="empty">没有可开工的票——先收掉进行中的。</div>`}
</div>

<h2>${esc(roadmap.currentMilestone)} 票板</h2>
<div class="board">${columns.join("")}</div>

<h2>最终形态（产品做完是什么）</h2>
<div class="final">
  <div class="one">${esc(roadmap.finalForm.oneLiner)}</div>
  <div class="stmt">${esc(roadmap.finalForm.statement)}</div>
  <div class="loop">
    ${roadmap.finalForm.loop.map((s, i) => `<div class="loop-step"><span class="n">${i + 1}</span>${esc(s)}</div>`).join("")}
  </div>
  <div class="moat"><b>护城河</b> · ${esc(roadmap.finalForm.moat)}</div>
</div>

<h2>未来迭代方向（Gate 倒排）</h2>
<div class="horizons">
  ${roadmap.futureDirections
    .map((h) => `<div class="hz ${h.status === "in_progress" ? "now" : h.status === "never" ? "never" : ""}">
    <div class="hz-when">${esc(h.horizon)}</div>
    <div class="hz-title">${esc(h.title)}</div>
    <div class="hz-detail">${esc(h.detail)}</div>
  </div>`)
    .join("")}
</div>

<footer>
  状态词表：todo → in_progress → code_done（Codex review 通过）→ accepted（Owner 真实路径验收，挂 docs/acceptance/*.md）。
  完成任何一票，在同一个 PR 内更新 roadmap.json。重新生成：<code>npm run progress</code>
</footer>
</html>
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, html);
console.log(`✓ 已生成 ${OUT}`);
console.log(`  ${roadmap.currentMilestone}: ${doneCount}/${total} 票完成 · 可开工 ${ready.map((t) => t.id).join(", ") || "无"}`);
if (drift.length) {
  console.log(`⚠ ${drift.length} 条漂移告警：`);
  for (const d of drift) console.log(`  - ${d}`);
}
if (process.argv.includes("--open")) {
  spawn(process.platform === "darwin" ? "open" : "xdg-open", [OUT], { detached: true, stdio: "ignore" }).unref();
}
