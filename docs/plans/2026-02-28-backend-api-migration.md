# Backend API Migration Plan

**Status:** DONE (implemented 2026-02-28)
**Branch:** main (already merged)
**Files modified:** 4

---

## What Was Done

### Phase 1: Backend API (clawcorp/server/index.js)

1. **CORS** -- Changed from locked origin to `*` for dev
2. **PATCH /agents/:name** -- Added `project` field
   - When project changes: updates workDir, branch, activeProject in agent-config.json
   - Resolves `{agent}` placeholder in workDir and branch
3. **POST /agents/:name/sleep** -- New endpoint
   - Writes `sleep-{agent}.signal` to tower/config/
   - Supports optional `nextProject` for queue-after-sleep
4. **POST /agents/:name/reboot** -- Enhanced
   - Accepts `project`, `model`, `mode` in body
   - Includes project/workDir/branch in signal file
5. **GET /agents/:name/status** -- Enhanced
   - Returns model, mode, activeProject, tokenBudget from config
6. **GET /projects** -- New endpoint
   - Returns projects section from agent-config.json

### Phase 2: Frontend (hq/repos/clawcorp-game/index.html)

1. **API_BASE** = `http://localhost:8888`
2. **Helper functions:** apiFetch(), apiPatch(), apiPost()
3. **Auto health check** on page load + project loading from API
4. **csDeploy()** -- Wired to real API
   - DEPLOY = apiPatch(settings) + apiPost(reboot with project)
   - SAVE & SLEEP = apiPost(sleep)
5. **batchDeploy()** -- Sequential PATCH + reboot per agent
6. **toggleGhost()** -- Sends apiPatch ghost status
7. **Status polling** -- 5s interval when stat card open
   - Updates deploy button state, POKE indicator, running dot
8. **SIMULATION tag** replaced with conditional "API OFFLINE" message

### Phase 3: agent-loop.ps1 (clawcorp/tower/scripts/workers/)

1. **Sleep signal watcher** -- Background watcher detects sleep-{agent}.signal
   - Injects "SAVE AND SLEEP" via ConsoleInjector
   - Deletes signal after injection
2. **Project in reboot signal** -- Reads workDir from signal, updates boot dir

### Phase 4: Config (clawcorp/tower/config/agent-config.json)

Added `projects` section:
```json
"projects": {
  "clawcorp-game": { "name": "ClawCorp Site", "workDir": "C:/Users/user/hq/repos/clawcorp-game", "branch": "dev" },
  "zac-bot": { "name": "Zac-Bot", "workDir": "C:/Users/user/Documents/zac-bot", "branch": "main" },
  "ai-dashboard": { "name": "AI Dashboard", "workDir": "C:/Users/user/clawcorp/dashboard", "branch": "dev" },
  "hq-ops": { "name": "HQ Operations", "workDir": "C:/Users/user/clawcorp/workers/{agent}", "branch": "worker/{agent}" }
}
```

## Verification (tested)

- All 6 endpoints return correct responses
- Signal files created/cleaned properly
- CORS allows cross-origin requests

## NOT Done (backlog)

- WebSocket real-time (replace polling)
- Auth/security (localhost-only for now)
- Multi-clone instancing (same agent on multiple projects)
