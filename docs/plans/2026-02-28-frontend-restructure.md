# Frontend Restructure Plan: 3-Page Split

**Status:** PLANNED (not started)
**Branch:** `site-restructure` (created from main @ 3ff24da)
**Executor:** Tour (Opus) -- solo, no subagents needed
**Estimated cost:** ~40K tokens (context already in POKE)

---

## Problem

index.html = 4173 lines, 614KB. 18 sections with significant redundancy.
how-it-works.html = 1316 lines, 84KB. Already exists.

The same concepts are shown multiple times:
- "How agents work" shown 5 times (sections 3, 5, 6, 8, 11)
- Communication/Slack shown 2 times (sections 10, 11)
- Agent identity shown 3 times (sections 2, 4, 7)

## Current Section Map

| # | ID | Section | Lines | Line Range |
|---|-----|---------|-------|------------|
| 1 | hero | Hero | 40 | 1175-1214 |
| 2 | conveyor | Conveyor | 38 | 1218-1255 |
| 3 | (none) | How It Works | 27 | 1259-1285 |
| 4 | agents | Agent Roster | 90 | 1288-1377 |
| 5 | pipeline | Pipeline | 328 | 1380-1707 |
| 6 | liveSession | Live Session | 94 | 1710-1803 |
| 7 | (none) | The Company | 73 | 1806-1878 |
| 8 | control | Control Room | 21 | 1881-1901 |
| 9 | workflow | 4 Modes | 48 | 1904-1951 |
| 10 | commshub | Comms Hub | 59 | 1955-2013 |
| 11 | communication | Communication | 162 | 2016-2177 |
| 12 | superpowers | Superpowers | 39 | 2180-2218 |
| 13 | (none) | Two Machines | 45 | 2221-2265 |
| 14 | (none) | Constitutional AI | 69 | 2268-2336 |
| 15 | (none) | Gamification | 35 | 2339-2373 |
| 16 | features | Features | 16 | 2376-2391 |
| 17 | pricing | Pricing | 63 | 2394-2456 |
| 18 | cta | CTA + Footer | 25 | 2459-2483 |
| -- | -- | CSS | ~1173 | 1-1173 |
| -- | -- | JS | ~1690 | 2484-4173 |

## Target Architecture

### Step 0: Backup
```
cp index.html index.html.backup
```

### Step 1: Extract CSS -> styles.css
- Lines 1-1173 (everything inside `<style>...</style>`)
- All 3 pages `<link rel="stylesheet" href="styles.css">`
- Mechanical copy-paste, zero risk

### Step 2: Extract shared JS -> shared.js
Functions used by ALL pages:
- Theme toggle (dark/light)
- Navbar scroll behavior + hamburger menu
- Scroll-to-section (smooth scroll)
- `showComingSoon()` / `showWaitlistPopup()`
- Agent popup toasts (section-based)
- `esc()` helper

### Step 3: Split into 3 pages

#### index.html (Landing Page) -- ~350 lines HTML
Sections KEPT:
- 1. Hero
- 2. Conveyor
- 3. How It Works (3 steps)
- 4. Roster SIMPLIFIED (agent grid only, NO stat cards, NO deploy)
- 12. Superpowers
- 16. Features grid
- 17. Pricing
- 18. CTA + Footer

JS needed: shared.js + conveyor animation + waitlist form + pricing toggle

#### dashboard.html (Interactive Dashboard/Demo) -- ~560 lines HTML
Sections MOVED here:
- 4. Roster FULL (stat cards, deploy buttons, selectors, batch deploy)
- 5. Pipeline (10-step kanban)
- 6. Live Session (3-panel workspace)
- 8. Control Room (VSCode mockup)
- 10. Comms Hub (27 channels)

JS needed: shared.js + ALL dashboard JS (csDeploy, csSelectAgent, batchDeploy, status polling, API calls, toggleGhost, pipeline animation, live session chat)

#### how-it-works.html (Deep Dive) -- MERGE into existing 1316 lines
Sections MERGED:
- 7. Company org chart
- 9. 4 Modes (CEO/Helicopter/Ghost/Deep)
- 11. Communication chat mockup
- 13. Two Machines (OpenClaw)
- 14. Constitutional AI (10 Commandments)
- 15. Gamification

JS needed: shared.js only (no interactive elements)

### Step 4: Cross-page navigation
- Navbar links updated: HOME | DASHBOARD | HOW IT WORKS | PRICING
- Each page has consistent navbar + footer
- "Try Dashboard" / "See Demo" buttons link to dashboard.html

## JS Dependency Map (CRITICAL -- do not break)

### Dashboard-only JS (goes in dashboard.html)
- `API_BASE`, `apiOnline`, `apiFetch()`, `apiPatch()`, `apiPost()`
- `csSelectAgent()`, `csDeploy()`, `csDeselectAll()`
- `batchDeploy()`, `batchSelectAll()`, `batchReady()`
- `startStatusPolling()`, `stopStatusPolling()`, `pollAgentStatus()`
- `toggleGhost()`
- `agentState{}`, `deployedAgents{}`, `statusInterval`
- `PROJECTS[]`, `getProjectBranch()`, `getRecommendedBudget()`
- All stat card HTML generation
- Pipeline kanban animation
- Live session chat simulation
- Task dispatch textarea

### Landing-only JS (stays in index.html)
- Conveyor animation (IntersectionObserver)
- Waitlist form submission (Formspree)
- Hero terminal typing animation

### Shared JS (goes in shared.js)
- Theme toggle (`toggleTheme()`, localStorage)
- Navbar scroll spy + mobile hamburger
- `showComingSoon()`, `showWaitlistPopup()`
- `esc()` HTML escaping
- Agent toast popups (IntersectionObserver per section)
- Smooth scroll for anchor links

## Manager's Pending Tasks -- Impact

| Task | Impact | Action |
|------|--------|--------|
| P0-1 Navbar propagation | BLOCKED -- navbar changes with restructure | HOLD |
| P0-2 Pipeline 10-step update | Safe -- pipeline moves to dashboard.html | Can continue |
| P1-1 Target dropdown | Safe -- dashboard.html work | Can continue |
| P1-2 Selectors alignment | Safe -- dashboard.html work | Can continue |
| P1-3 Mobile navbar testing | BLOCKED -- navbar changes | HOLD |
| P2-* Content cards | Safe -- how-it-works.html work | Can continue |

## Verification Checklist

After split:
- [ ] index.html loads, all sections render, no JS errors
- [ ] dashboard.html loads, stat cards work, deploy works, API calls work
- [ ] how-it-works.html loads, all merged sections render
- [ ] Theme toggle works on all 3 pages
- [ ] Navbar links work across pages
- [ ] Mobile responsive on all 3 pages
- [ ] No broken image paths
- [ ] No orphaned CSS (classes referenced but not defined)
- [ ] Pricing buttons work
- [ ] Waitlist form works
