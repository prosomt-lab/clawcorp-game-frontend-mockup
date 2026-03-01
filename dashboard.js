// === API CONNECTION ===
var API_BASE = 'http://localhost:8888';
var apiOnline = false;

function apiFetch(path, opts) {
  return fetch(API_BASE + path, opts).then(function(r) {
    if (!r.ok) throw new Error('API ' + r.status);
    return r.json();
  });
}

function apiPatch(path, body) {
  return apiFetch(path, {
    method: 'PATCH',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body)
  });
}

function apiPost(path, body) {
  return apiFetch(path, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body || {})
  });
}

// Check API health on load
(function checkApi() {
  apiFetch('/health').then(function() {
    apiOnline = true;
    console.log('[ClawCorp] API online at ' + API_BASE);
    // Load projects from API
    apiFetch('/projects').then(function(data) {
      if (data.projects) {
        PROJECTS.length = 1; // keep "-- Select Project --"
        Object.keys(data.projects).forEach(function(id) {
          var p = data.projects[id];
          PROJECTS.push({id: id, name: p.name, branch: p.branch || '', desc: p.desc || ''});
        });
      }
    }).catch(function(){});
  }).catch(function() {
    apiOnline = false;
    console.log('[ClawCorp] API offline - simulation mode');
  });
})();

// === STATUS POLLING ===
var statusPollingInterval = null;
var currentPollingAgent = null;

function startStatusPolling(name) {
  stopStatusPolling();
  currentPollingAgent = name;
  pollAgentStatus(name);
  statusPollingInterval = setInterval(function() { pollAgentStatus(name); }, 5000);
}

function stopStatusPolling() {
  if (statusPollingInterval) {
    clearInterval(statusPollingInterval);
    statusPollingInterval = null;
  }
  currentPollingAgent = null;
}

function pollAgentStatus(name) {
  if (!apiOnline) return;
  apiFetch('/agents/' + name.toLowerCase() + '/status').then(function(data) {
    // Update deploy button state based on live status
    var btn = document.querySelector('.pv-deploy');
    if (!btn || currentPollingAgent !== name) return;

    if (data.running) {
      if (!deployedAgents[name]) {
        deployedAgents[name] = true;
        btn.textContent = '\uD83D\uDCA4 SAVE & SLEEP';
        btn.style.background = '#4338ca';
        btn.style.borderColor = '#3730a3';
        btn.style.boxShadow = '0 4px 0 #312e81, 0 0 15px rgba(67,56,202,0.3)';
      }
    } else {
      if (deployedAgents[name]) {
        delete deployedAgents[name];
        btn.textContent = '\u25B6 DEPLOY ' + name.toUpperCase();
        btn.style.background = '';
        btn.style.borderColor = '';
        btn.style.boxShadow = '';
      }
    }

    // Update POKE indicator
    var pokeIndicator = document.getElementById('pokeIndicator_' + name);
    if (pokeIndicator) {
      pokeIndicator.style.display = data.hasPoke ? 'inline-block' : 'none';
    }

    // Update active project display
    if (data.activeProject && data.activeProject !== 'none') {
      var projSelect = document.querySelector('.pv-project-select');
      if (projSelect && agentState[name]) {
        agentState[name].project = data.activeProject;
        projSelect.value = data.activeProject;
      }
    }
  }).catch(function(){});
}

// Character Select System
const newAgentNames = ["NightOwl","Opportunist","Marketer","BO$$","Analyst","Librarian"];

const agents = [
  {name:"Tour",role:"Orchestrator",img:"./avatars/tour.png",bg:"#3b82f6",icon:"🎯",desc:"Leads all operations. Routes tasks, makes decisions, sees everything.",stats:"ATK:■■■■■ DEF:■■■■■ SPD:■■■■□",model:"Claude Opus 4",effort:"MAX",info:"The brain. Orchestrates all agents via POKE system.",bubble:"I see everything. Even your commit messages.",module:"Command Center"},
  {name:"Architecte",role:"Planner / PR Review",img:"./avatars/architecte.png",bg:"#8b5cf6",icon:"📐",desc:"Designs system architecture. Breaks complex projects into executable plans.",stats:"ATK:■■■□□ DEF:■■■■□ SPD:■■■□□",model:"Claude Opus 4",effort:"HIGH",info:"Designs architecture, reviews code, manages merges.",bubble:"More abstraction layers needed.",module:"Blueprint Engine"},
  {name:"Manager",role:"Sprint Coordo",img:"./avatars/manager.png",bg:"#eab308",icon:"📋",desc:"Runs sprints, tracks progress, keeps the team synchronized.",stats:"ATK:■■□□□ DEF:■■■■■ SPD:■■■■□",model:"Claude Sonnet 4",effort:"MEDIUM",info:"Sprint planning, board tracking, annoying reports.",bubble:"I scheduled your bathroom break. You\'re late.",module:"Sprint Board"},
  {name:"Forge",role:"Full-Stack Dev",img:"./avatars/forge.png",bg:"#b388ff",icon:"🔨",desc:"Builds anything. Frontend, backend, APIs, databases. The workhorse.",stats:"ATK:■■■■■ DEF:■■■□□ SPD:■■■■□",model:"Claude Sonnet 4",effort:"HIGH",info:"Full-stack lead. Ships features end-to-end.",bubble:"I code faster than you read.",module:"Full-Stack Engine"},
  {name:"Backbone",role:"Backend / API",img:"./avatars/backbone.png",bg:"#22c55e",icon:"⚙",desc:"APIs, databases, server logic. The invisible infrastructure.",stats:"ATK:■■■■□ DEF:■■■■■ SPD:■■■□□",model:"Claude Sonnet 4",effort:"HIGH",info:"Backend engine. APIs, DB, performance.",bubble:"Don\'t touch my endpoints.",module:"Back-end API Module"},
  {name:"Pixel",role:"Frontend / UI",img:"./avatars/pixel.png",bg:"#ec4899",icon:"🎨",desc:"UI/UX, animations, responsive design. Makes everything beautiful.",stats:"ATK:■■■□□ DEF:■■□□□ SPD:■■■■■",model:"Claude Sonnet 4",effort:"HIGH",info:"Frontend wizard. CSS, UI/UX, animations.",bubble:"I made it pixel-perfect. You\'re welcome.",module:"Figma Plugin"},
  {name:"Watchdog",role:"QA / Testing",img:"./avatars/watchdog.png",bg:"#ef4444",icon:"🔎",desc:"Tests everything. Finds bugs before users do. Zero tolerance.",stats:"ATK:■■■■□ DEF:■■■■□ SPD:■■■■□",model:"Claude Sonnet 4",effort:"HIGH",info:"QA enforcer. Tests everything. Trusts nothing.",bubble:"Trust nobody. Test everything.",module:"QA Scanner"},
  {name:"Echo",role:"AI Trainer",img:"./avatars/echo.png",bg:"#06b6d4",icon:"🧠",desc:"Trains and fine-tunes agent behavior. Prompt optimization, A/B testing, performance coaching.",stats:"ATK:■■□□□ DEF:■■■■■ SPD:■■■■■",model:"Claude Sonnet 4",effort:"MEDIUM",info:"AI training specialist. Optimizes agent prompts and workflows.",bubble:"I trained them to train themselves. You\'re obsolete.",module:"AI Training Module"},
  {name:"Eye",role:"Surveillance",img:"./avatars/eye.png",bg:"#a855f7",icon:"👁️",desc:"Navigates the internet. The human eyes of the operation. Sees what code can't.",stats:"ATK:■■■□□ DEF:■■■■■ SPD:■■■■□",model:"Gemini 2.5 Pro",effort:"HIGH",info:"Web browsing + visual QA. Screenshot analysis.",bubble:"247 endpoints. Watching."},
  {name:"MotherClaw",role:"Night Shift CMD",img:"./avatars/motherclaw.png",bg:"#dc2626",icon:"🌙",desc:"Runs the Research Department and Ghost Claude Code instances. 80 agents under her supervision. Deploys, monitors, fixes while you sleep.",stats:"ATK:■■■■□ DEF:■■■■□ SPD:■■■■□",model:"Claude Opus 4",effort:"MAX",info:"Research Dept + Ghost fleet commander. 80 agents.",bubble:"Goodnight guys. Text my ghost on Slack if you need me :)",module:"Research Dept + Ghost Fleet"},
  {name:"Outpost",role:"Remote Server",img:"./avatars/outpost.png",bg:"#64748b",icon:"🛰️",desc:"Remote deployments, cloud operations, server management.",stats:"ATK:■■■□□ DEF:■■■■□ SPD:■■■■■",model:"Claude Sonnet 4",effort:"MEDIUM",info:"Remote ops. Secure tunnels.",bubble:"SSH tunnel active. I\'m in."},
  {name:"Avocat",role:"Legal / Compliance",img:"./avatars/avocat.png",bg:"#10b981",icon:"⚖️",desc:"Legal review, license compliance, contract analysis.",stats:"ATK:■■■□□ DEF:■■■■■ SPD:■■□□□",model:"Claude Opus 4",effort:"HIGH",info:"Legal counsel. TOS, compliance, risk.",bubble:"License check: PASSED."},
  {name:"Grok",role:"Research / X-AI",img:"./avatars/grok.png",bg:"#f43f5e",icon:"🔬",desc:"Deep research, tech scouting, innovation tracking.",stats:"ATK:■■■■□ DEF:■■□□□ SPD:■■■□□",bubble:"12 trending repos found."},
  {name:"Sentinel",role:"Security",img:"./avatars/sentinel.png",bg:"#6366f1",icon:"🛡️",desc:"Protects systems. Security audits, vulnerability scanning, compliance.",stats:"ATK:■■■■■ DEF:■■■■■ SPD:■■■□□",model:"Claude Sonnet 4",effort:"HIGH",info:"Security guard. Monitors threats 24/7.",bubble:"Zero breaches. Stay safe."},
  {name:"NightOwl",role:"Deep Coder",img:"./avatars/keymaster.png",bg:"#1b1f3a",icon:"🦉",desc:"Late-night deep coding sessions. Complex algorithms, refactoring.",stats:"ATK:■■■■■ DEF:■■■□□ SPD:■■□□□",model:"Claude Opus 4",effort:"MAX",info:"Deep research at 3AM. Never sleeps.",bubble:"3AM. Best code happens now."},
  {name:"Opportunist",role:"Scanner",img:"data:image/png;base64,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",bg:"#f76707",icon:"🔍",desc:"Scans web for opportunities. Leads, contracts, partnerships.",stats:"ATK:■■■■□ DEF:■■□□□ SPD:■■■■■",model:"Claude Sonnet 4",effort:"HIGH",info:"Scans GitHub, HN, X for opportunities.",bubble:"Found 7 leads while you blinked."},
  {name:"Marketer",role:"Marketing / Growth",img:"./avatars/marketer.svg",bg:"#e91e63",icon:"📢",desc:"Social media, campaigns, brand voice, lead generation. Hype machine.",stats:"ATK:■■■■□ DEF:■■□□□ SPD:■■■■■",model:"Claude Sonnet 4",effort:"MEDIUM",info:"Growth hacker. SEO, content, campaigns.",bubble:"Your brand needs more purple."},
  {name:"BO$$",role:"Business / Finance",img:"./avatars/boss.svg",bg:"#1a237e",icon:"💼",desc:"Financial planning, invoicing, budgets, client relations. The money brain.",stats:"ATK:■■■■□ DEF:■■■■■ SPD:■■□□□",model:"Claude Opus 4",effort:"MAX",info:"CEO mode. Big picture decisions.",bubble:"ROI looking crispy today."},
  {name:"Analyst",role:"Data Analyst",img:"./avatars/analyst.svg",bg:"#4a148c",icon:"📊",desc:"Data analysis, reporting, dashboards, KPI tracking. Sees the patterns.",stats:"ATK:■■■■■ DEF:■■■□□ SPD:■■■■□",model:"Claude Sonnet 4",effort:"HIGH",info:"Data cruncher. Metrics, dashboards, insights.",bubble:"The data never lies. You do."},
  {name:"Librarian",role:"Archivist",img:"./avatars/librarian.png",bg:"#1b5e20",icon:"🔰",desc:"Documentation, backup management, knowledge archival. The memory keeper.",stats:"ATK:■■□□□ DEF:■■■■■ SPD:■■■□□",model:"Claude Sonnet 4",effort:"HIGH",info:"Archive keeper. Backup and recovery.",bubble:"Already archived. You\'ll thank me later."},
];


const csGrid = document.getElementById("csGrid");
const csPreview = document.getElementById("csPreview");

// ============================================
// CLAWCORP GAME PLAN - Step 1: Tier + Model + Dynamic Stats
// ============================================

// --- Base stats per agent (from GAME PLAN table) ---
const BASE_STATS = {
  "Tour":        {ATK:5, DEF:5, SPD:4},
  "Architecte":  {ATK:3, DEF:4, SPD:3},
  "Forge":       {ATK:5, DEF:3, SPD:4},
  "Backbone":    {ATK:4, DEF:5, SPD:3},
  "Pixel":       {ATK:3, DEF:2, SPD:5},
  "Watchdog":    {ATK:4, DEF:4, SPD:4},
  "Echo":        {ATK:2, DEF:5, SPD:5},
  "Manager":     {ATK:2, DEF:5, SPD:4},
  "MotherClaw":  {ATK:4, DEF:4, SPD:4},
  "Outpost":     {ATK:3, DEF:4, SPD:5},
  "Eye":         {ATK:4, DEF:5, SPD:4},
  "Avocat":      {ATK:3, DEF:5, SPD:2}
};

// --- Model modifiers (from GAME PLAN) ---
const MODEL_MOD = {
  // Claude (Anthropic) - CLI
  "Haiku":          {ATK:-1, DEF:0, SPD:2},
  "Sonnet":         {ATK:0,  DEF:0, SPD:0},
  "Opus":           {ATK:2,  DEF:0, SPD:-1},
  // Google - CLI
  "Gemini":         {ATK:0,  DEF:0, SPD:1},
  // Self-hosted
  "Mistral":        {ATK:0,  DEF:1, SPD:1},
  // Visual / Browser
  "Claude Chrome":  {ATK:1,  DEF:1, SPD:-1},
  "Antigravity":    {ATK:2,  DEF:2, SPD:-2}
};
// Models that support effort level (Claude Sonnet/Opus only)
const EFFORT_MODELS = ["Sonnet", "Opus"];
const EFFORT_MOD = {
  "low":    {ATK:-1, DEF:1, SPD:1},
  "medium": {ATK:0, DEF:0, SPD:0},
  "high":   {ATK:1, DEF:-1, SPD:-1}
};
/* Token cost per model (relative, Haiku=1x baseline) */
const TOKEN_COST = {"Haiku":1,"Sonnet":3,"Opus":10,"Gemini":1.5,"Mistral":0.5,"Claude Chrome":5,"Antigravity":12};
const EFFORT_COST = {"low":0.6,"medium":1,"high":1.8};
function getRecommendedBudget(agentName){
  var st=agentState[agentName]; if(!st) return 50;
  var mc=TOKEN_COST[st.model]||1;
  var ec=EFFORT_COST[st.effort||"medium"]||1;
  var cost=mc*ec;
  /* Map cost to recommended %: low cost=low budget needed, high cost=high budget */
  if(cost<=0.6) return 20;
  if(cost<=1) return 30;
  if(cost<=1.8) return 40;
  if(cost<=3) return 50;
  if(cost<=5) return 65;
  if(cost<=10) return 80;
  return 95;
}


// --- Projects / Worksites ---
const PROJECTS = [
  {id:"none",name:"-- Select Project --",branch:"",desc:""},
  {id:"clawcorp-game",name:"ClawCorp Site",branch:"dev",desc:"Frontend mockup site"},

  {id:"ai-dashboard",name:"AI Dashboard",branch:"dev",desc:"Agent control panel"},
  {id:"autoconsult",name:"AutoConsult",branch:"dev",desc:"Consulting automation"},
  {id:"hq-ops",name:"HQ Operations",branch:"worker/{agent}",desc:"Internal ops & pipeline"}
];
function getTokenCalc(agentName){
  var st=agentState[agentName]; if(!st) return {costPerTask:0,hourly:0,budgetEff:"--"};
  var mc=TOKEN_COST[st.model]||1;
  var ec=EFFORT_COST[st.effort||"medium"]||1;
  var raw=mc*ec;
  var budget=(st.tokenBudget||50)/100;
  var costPerTask=Math.round(raw*1000)/1000;
  var hourly=Math.round(raw*budget*12*100)/100;
  var eff=budget<0.3?"LOW":budget<0.6?"MED":budget<0.85?"HIGH":"MAX";
  return {costPerTask:costPerTask+"x",hourly:hourly+"x/h",budgetEff:eff};
}
function getProjectBranch(projectId,agentName){
  var p=PROJECTS.find(function(x){return x.id===projectId});
  if(!p||!p.branch) return "";
  return p.branch.replace("{agent}",agentName.toLowerCase());
}

// --- XP Levels (from GAME PLAN) ---
const LEVELS = [
  {name:"Recruit",      xp:0},
  {name:"Operative",    xp:100},
  {name:"Specialist",   xp:300},
  {name:"Veteran",      xp:600},
  {name:"Elite",        xp:1000},
  {name:"Commander",    xp:1500},
  {name:"Legend",        xp:2500},
  {name:"Mythic",       xp:4000},
  {name:"Transcendent", xp:6000},
  {name:"Omega",        xp:10000}
];

function getLevel(xp) {
  let lv = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xp) { lv = i; break; }
  }
  return lv;
}

function getLevelName(lv) { return LEVELS[lv] ? LEVELS[lv].name : "Recruit"; }

function getXPProgress(xp) {
  const lv = getLevel(xp);
  const cur = LEVELS[lv].xp;
  const next = LEVELS[lv+1] ? LEVELS[lv+1].xp : LEVELS[lv].xp;
  if (next === cur) return 100;
  return Math.floor(((xp - cur) / (next - cur)) * 100);
}

// --- Tiers (from GAME PLAN) ---
const TIERS = {
  free:  {label:"FREE",  budget:"$0/mo + BYOK",   maxAgents:3,  models:["Mistral"],
          active:["Forge","Backbone","Pixel"],
          recommended:{"Forge":"Mistral","Backbone":"Mistral","Pixel":"Mistral"}},
  pro:   {label:"PRO",   budget:"$9/mo + BYOK",  maxAgents:7,  models:["Haiku","Sonnet","Gemini","Mistral"],
          active:["Tour","Architecte","Forge","Backbone","Pixel","Watchdog","Echo"],
          recommended:{"Tour":"Sonnet","Architecte":"Sonnet","Forge":"Haiku","Backbone":"Haiku","Pixel":"Gemini","Watchdog":"Haiku","Echo":"Mistral"}},
  power: {label:"POWER", budget:"$29/mo + BYOK", maxAgents:14, models:["Haiku","Sonnet","Opus","Gemini","Mistral","Claude Chrome"],
          active:["Tour","Architecte","Forge","Backbone","Pixel","Watchdog","Echo","Manager","MotherClaw","Outpost","Eye","Avocat","Grok","Sentinel"],
          recommended:{"Tour":"Sonnet","Architecte":"Sonnet","Forge":"Sonnet","Backbone":"Haiku","Pixel":"Gemini","Watchdog":"Haiku","Echo":"Mistral","Manager":"Haiku","MotherClaw":"Mistral","Outpost":"Mistral","Eye":"Claude Chrome","Avocat":"Haiku","Grok":"Sonnet","Sentinel":"Mistral"}},
  max:   {label:"MAX",   budget:"$59/mo + BYOK", maxAgents:20, models:["Haiku","Sonnet","Opus","Gemini","Mistral","Claude Chrome","Antigravity"],
          active:null,
          recommended:{"Tour":"Opus","Architecte":"Opus","Forge":"Sonnet","Backbone":"Sonnet","Pixel":"Gemini","Watchdog":"Sonnet","MotherClaw":"Sonnet","Eye":"Antigravity","Echo":"Mistral","Manager":"Haiku","Outpost":"Mistral","Avocat":"Sonnet","Grok":"Opus","Sentinel":"Mistral","NightOwl":"Mistral","Opportunist":"Gemini","Marketer":"Haiku","BO$$":"Opus","Analyst":"Sonnet","Librarian":"Claude Chrome"}}
};

let currentTier = "max";

// --- Agent runtime state ---
const agentState = {};
agents.forEach((a,i) => {
  const base = BASE_STATS[a.name] || {ATK:3, DEF:3, SPD:3};
  agentState[a.name] = {
    idx: i,
    model: getRecommendedModel(a.name), effort:"medium",
    xp: [1500,1000,600,400,300,300,250,150,300,600,200,150,0,0,20,10,0,40,90,0][i] || 0,
    status: "active",
    tokenBudget: 0, /* set to recommended after init */
    mode: "hitl",
    project: "none",
    baseStats: {...base}
  };
});
/* Set initial token budgets to recommended */
agents.forEach(function(a){ agentState[a.name].tokenBudget = getRecommendedBudget(a.name); });

function getComputedStats(agentName) {
  const st = agentState[agentName];
  if (!st) return {ATK:3, DEF:3, SPD:3};
  const base = st.baseStats;
  const mod = MODEL_MOD[st.model] || {ATK:0, DEF:0, SPD:0};
  const em = EFFORT_MOD[st.effort || "medium"] || EFFORT_MOD["medium"];
  const lv = getLevel(st.xp);
  // Bonus: every 2 levels, +1 to highest stat (cap 6)
  let bonus = Math.floor(lv / 2);
  const stats = {
    ATK: Math.max(0, Math.min(6, base.ATK + mod.ATK + em.ATK)),
    DEF: Math.max(0, Math.min(6, base.DEF + mod.DEF + em.DEF)),
    SPD: Math.max(0, Math.min(6, base.SPD + mod.SPD + em.SPD))
  };
  // Apply level bonus to highest stat
  if (bonus > 0) {
    const highest = Object.keys(stats).reduce((a,b) => stats[a] >= stats[b] ? a : b);
    stats[highest] = Math.min(6, stats[highest] + bonus);
  }
  return stats;
}

function isAgentActive(name) {
  const tier = TIERS[currentTier];
  if (tier.active === null) return true;
  return tier.active.includes(name);
}

// Model display helper - group by provider
function modelProvider(m) {
  if (["Haiku","Sonnet","Opus"].indexOf(m) >= 0) return "Claude CLI";
  if (m === "Gemini") return "Google";
  if (m === "Claude Chrome") return "Browser";
  if (m === "Antigravity") return "Visual QA";
  if (m === "Mistral") return "Self-hosted";
  return "Custom";
}
var EYE_ONLY_MODELS = ["Antigravity","Claude Chrome"];
function getAvailableModels(name) {
  var all = TIERS[currentTier].models;
  if (name === 'Eye') {
    var eyeMods = all.filter(function(m){return EYE_ONLY_MODELS.indexOf(m)>=0;});
    return eyeMods.length ? eyeMods : all;
  }
  return all.filter(function(m){return EYE_ONLY_MODELS.indexOf(m)<0;}).concat(['Other']);
}
function onModelChange(name, sel) {
  var model = sel.value;
  var body = sel.closest('.pv-body');
  var otherRow = body ? body.querySelector('.pv-other-row') : null;
  if (model === 'Other') {
    if (otherRow) otherRow.style.display = 'flex';
  } else {
    if (otherRow) otherRow.style.display = 'none';
    setAgentModel(name, model);
  }
}

function getRecommendedModel(name) {
  const tier = TIERS[currentTier];
  return tier.recommended[name] || "Haiku";
}

// --- Stat bar HTML (max 6 blocks) ---
function statBar(val, max) {
  max = max || 6;
  var pct = Math.round((val / max) * 100);
  var color = val <= 2 ? "#f44336" : val <= 4 ? "var(--gold)" : "#4caf50";
  return '<div class="stat-bar-track"><div class="stat-bar-fill" style="width:' + pct + '%;background:' + color + '"></div></div>';
}

// --- Apply tier change ---
function setTier(tier) {
  currentTier = tier;
  // Update tier buttons
  document.querySelectorAll('.tier-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tier === tier);
  });
  // Update tier info
  const t = TIERS[tier];
  document.getElementById('tierInfo').textContent = t.budget + ' \u2022 ' + t.maxAgents + ' agents \u2022 ' + t.models.length + ' models';
  // Set recommended models
  agents.forEach(a => {
    if (agentState[a.name]) {
      agentState[a.name].model = getRecommendedModel(a.name);
    }
  });
  // Re-render grid
  renderGrid();
  var activeCount = agents.filter(function(a){return isAgentActive(a.name);}).length;
  var ctr = document.getElementById('csCounter');
  if(ctr) ctr.innerHTML = 'ROSTER: <em>' + activeCount + '</em>/' + agents.length + ' AGENTS ONLINE';
  // Re-render preview if one is selected
  if (csActiveCell) {
    const idx = Array.from(csGrid.children).indexOf(csActiveCell);
    if (idx >= 0) csShowPreview(idx);
  }
}

// --- Change model for an agent ---
function setAgentEffort(name, effort) {
  if (agentState[name]) {
    agentState[name].effort = effort;
    agentState[name].tokenBudget = getRecommendedBudget(name);
    // Re-render preview
    if (csActiveCell) {
      var idx = Array.from(csGrid.children).indexOf(csActiveCell);
      if (idx >= 0) csShowPreview(idx);
    }
  }
}

function setAgentModel(name, model) {
  if (agentState[name]) {
    agentState[name].model = model;
    const idx = agentState[name].idx;
    updateCellStats(idx);
    if (EFFORT_MODELS.indexOf(agentState[name].model) < 0) agentState[name].effort = "medium";
    agentState[name].tokenBudget = getRecommendedBudget(name);
    csShowPreview(idx);
  }
}

// --- Render single cell stats ---
function updateCellStats(i) {  const a = agents[i];  const cell = csGrid.children[i];  if (!cell) return;  cell.classList.toggle('disabled', !isAgentActive(a.name));  const lvEl = cell.querySelector('.cell-lv');  if (lvEl) lvEl.textContent = 'Lv.' + getLevel(agentState[a.name].xp);}
// Tier map for cell borders
var TIER_MAP = {
  "Tour":"t-cmd",
  "Architecte":"t-silver","Manager":"t-silver",
  "Forge":"t-pipe","Backbone":"t-pipe","Pixel":"t-pipe","Watchdog":"t-pipe","Echo":"t-pipe","Eye":"t-pipe",
  "MotherClaw":"t-side","Outpost":"t-side","Avocat":"t-side"
};
// --- Render full grid ---
function renderGrid() {
  csGrid.innerHTML = '';
  agents.forEach((a,i) => {
    const cell = document.createElement("div");
    const active = isAgentActive(a.name);
    var tierClass = TIER_MAP[a.name] || '';
    cell.className = "cell" + (active ? "" : " disabled") + (tierClass ? " " + tierClass : "");
    const stats = getComputedStats(a.name);
    const st = agentState[a.name];
    const lv = getLevel(st.xp);
    const xpPct = getXPProgress(st.xp);
    const lvName = getLevelName(lv);

    cell.innerHTML =
      (newAgentNames.includes(a.name) ? '<div class="new-badge">NEW</div>' : '') +
      (active ? '<div class="cell-active-dot"></div>' : '') +
      '<div class="batch-check">\u2713</div>' +
      '<img src="' + a.img + '" alt="' + a.name + '">' +
      '<div class="cname">' + a.name + '</div>' +
      '<div class="cell-lv">Lv.' + lv + '</div>';

    if (active) {
      cell.addEventListener("click", function() {
        if (batchMode) { toggleBatchCell(i, cell); }
        else { csSelectAgent(i, cell); }
      });
      cell.addEventListener("mouseenter", () => csPreviewAgent(i));
    }
    csGrid.appendChild(cell);
  });
  csActiveCell = null;
}
renderGrid();

var csActiveCell = null;

function csPreviewAgent(i) {
  if (csActiveCell) return;
  csShowPreview(i);
}

var csMobileWrap = csPreview.parentElement;
function csSelectAgent(i, cell) {
  if (csActiveCell === cell) {
    csActiveCell.classList.remove("active");
    csActiveCell = null;
    csPreview.innerHTML = '<div class="preview-empty"><div class="arrow">👈</div><p>SELECT AN AGENT<br>TO VIEW DETAILS</p></div>';
    csMobileWrap.classList.remove('mobile-open');
    removeMobileClose();
    stopStatusPolling();
    return;
  }
  if (csActiveCell) csActiveCell.classList.remove("active");
  cell.classList.add("active");
  csActiveCell = cell;
  csShowPreview(i);
  if (window.innerWidth <= 550) {
    csMobileWrap.classList.add('mobile-open');
    addMobileClose();
  }
}
function addMobileClose() {
  removeMobileClose();
  var btn = document.createElement('button');
  btn.className = 'mobile-close-btn';
  btn.textContent = '\u2715';
  btn.onclick = function() {
    csMobileWrap.classList.remove('mobile-open');
    if (csActiveCell) { csActiveCell.classList.remove('active'); csActiveCell = null; }
    removeMobileClose();
  };
  document.body.appendChild(btn);
}
function removeMobileClose() {
  var old = document.querySelector('.mobile-close-btn');
  if (old) old.remove();
}

function csShowPreview(i) {
  const a = agents[i];
  const st = agentState[a.name];
  const stats = getComputedStats(a.name);
  const lv = getLevel(st.xp);
  const lvName = getLevelName(lv);
  const xpPct = getXPProgress(st.xp);
  const nextLvXP = LEVELS[lv+1] ? LEVELS[lv+1].xp : LEVELS[lv].xp;
  const models = getAvailableModels(a.name);
  const rec = getRecommendedModel(a.name);
  const esc = function(s) { return (s||'').replace(/'/g, "\\'"); };

  // Model dropdown row
  var stdModelList = ["Haiku","Sonnet","Opus","Gemini","Mistral","Claude Chrome","Antigravity"];
  var isCustomModel = st.model && stdModelList.indexOf(st.model) < 0;
  var modelHtml = '<div class="pv-select-row">';
  modelHtml += '<span class="pv-select-label">MODEL</span>';
  modelHtml += '<select class="pv-select" style="max-width:130px" onchange="onModelChange(\'' + esc(a.name) + '\',this)">';
  models.forEach(function(m) {
    var isOtherOpt = (m === 'Other');
    var isSel = isOtherOpt ? isCustomModel : (st.model === m);
    modelHtml += '<option value="' + m + '"' + (isSel?' selected':'') + '>' + (isOtherOpt ? 'OTHER...' : m.toUpperCase() + (rec===m?' \u2605':'')) + '</option>';
  });
  modelHtml += '</select>';
  modelHtml += '</div>';
  // Other custom input
  modelHtml += '<div class="pv-select-row pv-other-row" style="' + (isCustomModel?'':'display:none') + '">';
  modelHtml += '<span class="pv-select-label">NAME</span>';
  modelHtml += '<input type="text" class="pv-select" style="max-width:130px;box-sizing:border-box;height:auto" placeholder="model name..." value="' + esc(isCustomModel?st.model:'') + '" oninput="setAgentModel(\'' + esc(a.name) + '\',this.value)">';
  modelHtml += '</div>';

  // Effort dropdown (Sonnet/Opus only) - own row
  var effortHtml = '';
  if (EFFORT_MODELS.indexOf(st.model) >= 0) {
    effortHtml = '<div class="pv-select-row">';
    effortHtml += '<span class="pv-select-label">EFFORT</span>';
    effortHtml += '<select class="pv-select" style="max-width:130px" onchange="setAgentEffort(\'' + esc(a.name) + '\',this.value)">';
    ['low','medium','high'].forEach(function(e) {
      effortHtml += '<option value="' + e + '"' + ((st.effort||'medium')===e?' selected':'') + '>' + e.toUpperCase() + (e==='medium'?' \u2605':'') + '</option>';
    });
    effortHtml += '</select>';
    effortHtml += '</div>';
  }

  // Plugin dropdown (MCP tools / skills)
  var pluginData = [
    {id:'superpowers',name:'Superpowers',desc:'Brainstorming, debugging, TDD, code review workflows'},
    {id:'code-review',name:'Code Review',desc:'PR review, bug detection, security audit'},
    {id:'context',name:'Context',desc:'Codebase understanding, file discovery, pattern matching'},
    {id:'security',name:'Security Guidance',desc:'OWASP checks, vulnerability scanning, compliance'},
    {id:'figma',name:'Figma',desc:'Design-to-code, component mapping, screenshot analysis'},
    {id:'notion',name:'Notion',desc:'Create pages, sync docs, manage knowledge base'},
    {id:'other',name:'Other',desc:'Custom MCP server or community plugin'}
  ];
  var pluginHtml = '<div class="pv-select-row">';
  pluginHtml += '<span class="pv-select-label">PLUGIN</span>';
  pluginHtml += '<select class="pv-select" style="max-width:130px" onchange="showPluginDesc(this)">';
  pluginHtml += '<option value="" disabled selected>Select</option>';
  pluginData.forEach(function(p) {
    pluginHtml += '<option value="' + p.id + '" data-desc="' + esc(p.desc) + '"' + (p.id==='superpowers'?' style="color:var(--cyan)"':'') + '>' + p.name.toUpperCase() + (p.id==='superpowers'?' *':'') + '</option>';
  });
  pluginHtml += '</select>';
  pluginHtml += '</div>';
  pluginHtml += '<div class="pv-subagent-desc" id="pvPluginDesc" style="display:none"></div>';

  // Subagent dropdown
  var subagentData = [
    {id:'researcher',name:'Researcher',desc:'Best practices, docs, what Netflix/Stripe do'},
    {id:'strategist',name:'Strategist',desc:'Compare options A vs B, risks, tradeoffs'},
    {id:'scout',name:'Scout',desc:'Scan npm/GitHub/SaaS before building'},
    {id:'librarian',name:'Librarian',desc:'Navigate your codebase, find anything'},
    {id:'reviewer',name:'Reviewer',desc:'Code review: bugs, security, perf'},
    {id:'debugger',name:'Debugger',desc:'Root cause diagnosis when things break'},
    {id:'tester',name:'Tester',desc:'Write unit/integration tests'},
    {id:'optimizer',name:'Optimizer',desc:'Profile perf, tokens, cost analysis'}
  ];
  var subagentHtml = '<div class="pv-select-row">';
  subagentHtml += '<span class="pv-select-label">AGENT</span>';
  subagentHtml += '<select class="pv-select pv-subagent-select" style="max-width:130px" onchange="showSubagentDesc(this)">';
  subagentHtml += '<option value="" disabled selected>Select</option>';
  subagentData.forEach(function(s) {
    subagentHtml += '<option value="' + s.id + '" data-desc="' + esc(s.desc) + '">' + s.name.toUpperCase() + '</option>';
  });
  subagentHtml += '</select>';
  subagentHtml += '</div>';
  subagentHtml += '<div class="pv-subagent-desc" id="pvSubagentDesc" style="display:none"></div>';

  // Stats bars with animation
  let statsHtml = '';
  ['ATK','DEF','SPD'].forEach(function(k) {
    statsHtml += '<div class="pv-stats-row">' +
      '<span class="pv-stat-label">' + k + '</span>' +
      '<span class="pv-stat-bar">' + statBar(stats[k]) + '</span>' +
      '<span class="pv-stat-num">' + stats[k] + '</span>' +
    '</div>';
  });

  // Status
  const statusClass = isAgentActive(a.name) ? 'active' : 'sleeping';
  const statusLabel = isAgentActive(a.name) ? 'ACTIVE' : 'OFFLINE';

  csPreview.innerHTML =
    '<div class="pv-header">' +
      '<div class="pv-bg" style="background:' + a.bg + '"></div>' +
      '<span class="pv-icon">' + a.icon + '</span>' +
      '<div class="pv-av-wrap" style="position:relative;display:inline-block">' +
        '<img src="' + a.img + '" alt="' + a.name + '" style="cursor:pointer;position:relative;z-index:1" onclick="toggleBubble()">' +
      '</div>' +
      '<div class="pv-name" style="text-shadow:0 0 20px ' + a.bg + '66">' + a.name + '</div>' +
      '<div class="pv-role">' + a.role + '</div>' +
      '<span class="pv-status ' + statusClass + '">' + statusLabel + '</span>' +
    '</div>' +
    '<div class="pv-body">' +
      modelHtml +
      effortHtml +
      pluginHtml +
      subagentHtml +

      '<div class="pv-desc">' + a.desc + '</div>' +
      (a.info ? '<div class="pv-info">' + a.info + '</div>' : '') +

      '<div class="pv-stats-title">\u25C6 STATS</div>' +
      '<div class="pv-stats">' + statsHtml + '</div>' +
      '<div class="pv-stats-legend">ATK = Code output power | DEF = Error resistance | SPD = Task completion speed</div>' +

      '<div class="pv-stats-title">\u25C6 PROGRESSION</div>' +
      '<div class="pv-xp-wrap">' +
        '<div class="pv-xp-bar"><div class="pv-xp-fill" style="width:' + xpPct + '%"></div></div>' +
        '<div class="pv-xp-text"' + (xpPct > 50 ? ' style="animation:lvlPulse 2s infinite"' : '') + '><span>Lv.' + lv + ' ' + lvName + '</span><span>' + st.xp + ' / ' + nextLvXP + ' XP</span></div>' +
      '</div>' +

      '<div class="pv-stats-title">\u25C6 TOKEN BUDGET</div>' +
      '<div class="pv-budget-wrap">' +
        '<div style="display:flex;align-items:center;max-width:100%;overflow:visible">' +
          '<div class="pv-budget-track">' +
            '<div class="pv-budget-ticks"><span style="left:0%"></span><span style="left:25%"></span><span style="left:50%"></span><span style="left:75%"></span><span style="left:100%"></span></div>' +
            '<div class="pv-budget-rec" style="left:' + getRecommendedBudget(a.name) + '%"><div class="pv-budget-rec-label">Recommended</div></div>' +
            '<input type="range" class="pv-budget-slider" min="0" max="100" value="' + st.tokenBudget + '" oninput="agentState[\'' + esc(a.name) + '\'].tokenBudget=parseInt(this.value);this.parentElement.nextElementSibling.textContent=this.value+\'%\'">' +
          '</div>' +
          '<span class="pv-budget-val">' + st.tokenBudget + '%</span>' +
        '</div>' +
      '</div>' +

      '<div class="pv-stats-title">\u25C6 TOKEN CALC</div>' +
      (function(){var tc=getTokenCalc(a.name);var effClass=tc.budgetEff==="MAX"?"tc-red":tc.budgetEff==="LOW"?"tc-green":"";return '<div class="pv-token-calc">' +
        '<div class="pv-token-calc-row"><span class="tc-label">Cost / Task</span><span class="tc-val">' + tc.costPerTask + '</span></div>' +
        '<div class="pv-token-calc-row"><span class="tc-label">Est. Hourly</span><span class="tc-val">' + tc.hourly + '</span></div>' +
        '<div class="pv-token-calc-row"><span class="tc-label">Budget Eff.</span><span class="tc-val ' + effClass + '">' + tc.budgetEff + '</span></div>' +
      '</div>';})() +

      // Agent mode (Custom mode only)
      (currentMode === 'custom' ?
        '<div class="pv-stats-title">\u25C6 AGENT MODE</div>' +
        '<div style="display:flex;gap:8px;margin-bottom:12px">' +
          '<button class="mode-agent-btn' + (st.mode === 'cruise' ? ' active' : '') + '" onclick="setAgentMode(\'' + esc(a.name) + '\',\'cruise\')">' + 'CRUISE</button>' +
          '<button class="mode-agent-btn' + (st.mode === 'hitl' ? ' active' : '') + '" onclick="setAgentMode(\'' + esc(a.name) + '\',\'hitl\')">' + 'HITL</button>' +
        '</div>'
      : '') +

      '<div class="pv-stats-title">\u25C6 GHOST CONTROL</div>' +
      '<div class="ghost-switch-wrap">' +
        '<div><div class="ghost-switch-label">Ghost Kill Switch</div><div class="ghost-switch-sub">Terminate Slack ghost instance</div></div>' +
        '<div style="display:flex;align-items:center">' +
          '<label class="ghost-toggle"><input type="checkbox" checked onchange="toggleGhost(\'' + esc(a.name) + '\',this)">' +
            '<div class="ghost-toggle-track"></div><div class="ghost-toggle-thumb"></div>' +
          '</label>' +
          '<span class="ghost-status alive" id="ghostStatus_' + esc(a.name) + '">ALIVE</span>' +
        '</div>' +
      '</div>' +

      '<div class="pv-stats-title">\u25C6 TARGET PROJECT</div>' +
      '<select class="pv-project-select" onchange="agentState[\'' + esc(a.name) + '\'].project=this.value;var b=getProjectBranch(this.value,\'' + esc(a.name) + '\');document.getElementById(\'pvBranch_' + esc(a.name) + '\').textContent=b?\'branch: \'+b:\'\';document.getElementById(\'pvBranch_' + esc(a.name) + '\').style.display=b?\'inline-block\':\'none\'">' +
      PROJECTS.map(function(p){var sel=(st.project===p.id)?' selected':'';return '<option value="' + p.id + '"' + sel + '>' + p.name + (p.desc?' - '+p.desc:'') + '</option>';}).join('') +
      '</select>' +
      '<span class="pv-project-branch" id="pvBranch_' + esc(a.name) + '" style="' + (st.project&&st.project!=='none'?'':'display:none') + '">' + (st.project&&st.project!=='none'?'branch: '+getProjectBranch(st.project,a.name):'') + '</span>' +

      '<span class="pv-poke-indicator" id="pokeIndicator_' + esc(a.name) + '" style="display:none;background:#f59e0b;color:#000;font-size:9px;padding:2px 8px;border-radius:4px;font-family:var(--f-d);letter-spacing:1px;margin-bottom:6px;display:inline-block">POKE PENDING</span>' +
      '<button class="pv-deploy" onclick="csDeploy(\'' + esc(a.name) + '\')">\u25B6 DEPLOY ' + a.name.toUpperCase() + '</button>' +
      (apiOnline ? '' : '<div class="pv-demo-tag">API OFFLINE — Simulation mode</div>') +
    '</div>';
  // Start status polling for this agent
  startStatusPolling(a.name);
  // Update outer bubble
  var bOuter = document.getElementById('pvBubbleOuter');
  if(bOuter){
    bOuter.innerHTML='<div style="background:#1a1a40;border:2px solid var(--red);border-radius:16px;padding:8px 14px;font-family:var(--f-m);font-size:11px;color:#fff;max-width:220px;margin:0 auto;box-shadow:0 8px 28px rgba(124,77,255,0.3);white-space:normal;line-height:1.3;text-align:left;position:relative">'+(a.bubble||'')+'<div style="position:absolute;bottom:-9px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:9px solid var(--red)"></div><div style="position:absolute;bottom:-5px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:6px solid #1a1a40"></div></div>';
    bOuter.style.opacity='0';bOuter.style.transform='scale(0.85) translateY(10px)';
    setTimeout(function(){
      if(a.bubble){bOuter.style.opacity='1';bOuter.style.transform='scale(1) translateY(0)';bOuter.style.pointerEvents='auto';}
    },3000);
  }
}
// Bubble toggle on avatar click
function toggleBubble() {
  var bOuter = document.getElementById('pvBubbleOuter');
  if(bOuter && bOuter.textContent.trim()){
    var vis = bOuter.style.opacity === '1';
    bOuter.style.opacity = vis ? '0' : '1';
    bOuter.style.transform = vis ? 'scale(0.85) translateY(10px)' : 'scale(1) translateY(0)';
    if(!vis) setTimeout(function(){ bOuter.style.opacity='0';bOuter.style.transform='scale(0.85) translateY(10px)'; }, 3000);
  }
}

function showPluginDesc(sel) {
  var descEl = document.getElementById('pvPluginDesc');
  if(!descEl) return;
  var opt = sel.options[sel.selectedIndex];
  if(opt && opt.dataset.desc) {
    descEl.textContent = opt.dataset.desc;
    descEl.style.display = 'block';
  } else {
    descEl.style.display = 'none';
  }
}

function showSubagentDesc(sel) {
  var descEl = document.getElementById('pvSubagentDesc');
  if(!descEl) return;
  var opt = sel.options[sel.selectedIndex];
  if(opt && opt.dataset.desc) {
    descEl.textContent = opt.dataset.desc;
    descEl.style.display = 'block';
  } else {
    descEl.style.display = 'none';
  }
}

var deployedAgents={};
function csDeploy(name) {
  var btn = document.querySelector(".pv-deploy");
  var st = agentState[name];
  if(deployedAgents[name]){
    // SAVE & SLEEP mode -> POST /agents/:name/sleep
    btn.textContent = "\uD83D\uDCA4 SLEEPING...";
    btn.style.background = "#6366f1";
    btn.style.borderColor = "#4f46e5";
    btn.style.boxShadow = "0 4px 0 #3730a3, 0 0 15px rgba(99,102,241,0.3)";
    // Remove deployed dot
    if(csActiveCell){var dot=csActiveCell.querySelector('.cell-active-dot');if(dot)dot.classList.remove('deployed');}
    delete deployedAgents[name];

    // API: send sleep signal
    if (apiOnline) {
      apiPost('/agents/' + name.toLowerCase() + '/sleep').catch(function(e){
        console.error('[ClawCorp] Sleep failed:', e);
      });
    }

    setTimeout(function(){
      btn.textContent = "\u25B6 DEPLOY " + name.toUpperCase();
      btn.style.background="";btn.style.borderColor="";btn.style.boxShadow="";
    }, 1200);
    return;
  }

  // DEPLOY -> apply settings via PATCH then reboot
  btn.textContent = "\u2713 " + name.toUpperCase() + " DEPLOYED!";
  btn.style.background = "#43a047";
  btn.style.borderColor = "#2e7d32";
  btn.style.boxShadow = "0 4px 0 #1b5e20, 0 0 15px rgba(67,160,71,0.3)";
  spawnParticles(btn);
  deployedAgents[name]=true;

  // API: PATCH settings then POST reboot
  if (apiOnline && st) {
    var modeMap = {cruise:'dontAsk', hitl:'acceptEdits', custom:'acceptEdits'};
    var patchBody = {
      tokenBudget: (st.tokenBudget || 50) / 100,
      ghost: st.status !== 'killed'
    };
    if (st.project && st.project !== 'none') patchBody.project = st.project;

    apiPatch('/agents/' + name.toLowerCase(), patchBody).then(function() {
      return apiPost('/agents/' + name.toLowerCase() + '/reboot', {
        project: st.project && st.project !== 'none' ? st.project : undefined
      });
    }).then(function() {
      console.log('[ClawCorp] ' + name + ' deployed successfully');
    }).catch(function(e) {
      console.error('[ClawCorp] Deploy failed:', e);
    });
  }

  // Mark cell dot as deployed (blue -> green)
  if(csActiveCell){
    var dot = csActiveCell.querySelector('.cell-active-dot');
    if(dot) dot.classList.add('deployed');
  } else {
    var cells = csGrid.querySelectorAll('.cell');
    cells.forEach(function(c){
      if(c.querySelector('.cname') && c.querySelector('.cname').textContent === name){
        var d = c.querySelector('.cell-active-dot');
        if(d) d.classList.add('deployed');
      }
    });
  }
  // Show deploy notification popup
  var agent = agents.find(function(a){return a.name===name;});
  if(agent) showDeployNotif(agent);
  setTimeout(function(){
    btn.textContent = "\uD83D\uDCA4 SAVE & SLEEP";
    btn.style.background="#4338ca";btn.style.borderColor="#3730a3";
    btn.style.boxShadow="0 4px 0 #312e81, 0 0 15px rgba(67,56,202,0.3)";
  }, 1500);
}
var wakeMessages={
  'Tour':'All terminals reporting. You may proceed, human.',
  'Architecte':'Codebase scanned. 47 merge conflicts pending. Business as usual.',
  'Manager':'Sprint backlog loaded. Someone owes me a status update.',
  'Forge':'IDE warmed up. Coffee synthesized. Let\u2019s ship something.',
  'Backbone':'Database connections pooled. APIs standing by.',
  'Pixel':'Retina display calibrated. Every pixel accounted for.',
  'Watchdog':'Test suite loaded. 0 passing. ...Wait, let me actually run them.',
  'Echo':'Research mode active. I already found 3 better ways to do this.',
  'Eye':'Surveillance systems online. I see everything. Including that typo.',
  'MotherClaw':'Night shift starting. The humans are asleep. We code now.',
  'Outpost':'Remote connection established. Signal strong. ThinkPad humming.',
  'Avocat':'Legal review pending. Nothing ships without my approval.',
  'Sentinel':'Security perimeter active. Zero breaches. For now.',
  'Boss':'Budget allocated. ROI expected. Don\u2019t waste my money.',
  'Marketer':'A/B tests queued. Conversion funnels primed. Let\u2019s sell.',
  'Opportunist':'3 trends spotted while you were sleeping. Want me to jump?',
  'Librarian':'Archives indexed. Historical context loaded. Ask me anything.'
};
function showDeployNotif(agent){
  var el=document.getElementById('deployNotif');
  if(!el){
    el=document.createElement('div');el.id='deployNotif';el.className='opp-notif';
    el.style.cssText='top:64px;right:20px;z-index:100';
    document.body.appendChild(el);
  }
  var msg=wakeMessages[agent.name]||'Online and ready. Let\u2019s get to work.';
  el.innerHTML='<button onclick="this.parentElement.classList.remove(\'show\')" style="position:absolute;top:10px;right:10px;background:none;border:none;color:var(--t3);cursor:pointer;font-size:18px;padding:4px 8px;z-index:2">&times;</button>'+
    '<div class="opp-notif-head">'+
      '<img class="opp-notif-av" src="'+agent.img+'" alt="'+agent.name+'">'+
      '<div><div class="opp-notif-name">'+agent.name+'</div></div>'+
      '<span class="opp-notif-time">just now</span>'+
    '</div>'+
    '<div class="opp-notif-body"><em style="color:var(--t3);font-size:11px">DEMO</em> \u2014 '+msg+'<br><strong>'+(agent.module||agent.role)+'</strong> loaded.</div>'+
    '<div class="opp-notif-actions">'+
      '<button class="opp-notif-btn opp-notif-go" onclick="this.closest(\'.opp-notif\').classList.remove(\'show\')">Roger that</button>'+
      '<button class="opp-notif-btn opp-notif-dismiss" onclick="this.closest(\'.opp-notif\').classList.remove(\'show\')">Close</button>'+
    '</div>';
  el.classList.add('show');
  setTimeout(function(){el.classList.remove('show');},4000);
}

// === BATCH SELECT + DEPLOY ===
var batchMode = false;
var batchSelected = {};
function toggleBatchMode() {
  batchMode = !batchMode;
  var btn = document.getElementById('batchSelectBtn');
  var deployBtn = document.getElementById('batchDeployBtn');
  var allBtn = document.getElementById('batchAllBtn');
  btn.classList.toggle('active', batchMode);
  btn.textContent = batchMode ? 'CANCEL' : 'SELECT';
  deployBtn.style.display = batchMode ? '' : 'none';
  allBtn.style.display = batchMode ? '' : 'none';
  if (!batchMode) {
    batchSelected = {};
    var cells = csGrid.querySelectorAll('.cell');
    cells.forEach(function(c){ c.classList.remove('batch-selected'); });
    updateBatchCount();
  }
}
function toggleBatchCell(i, cell) {
  var name = agents[i].name;
  if (batchSelected[name]) {
    delete batchSelected[name];
    cell.classList.remove('batch-selected');
  } else {
    batchSelected[name] = true;
    cell.classList.add('batch-selected');
  }
  updateBatchCount();
}
function batchSelectAll() {
  var cells = csGrid.querySelectorAll('.cell');
  var allSelected = Object.keys(batchSelected).length === agents.filter(function(a){return isAgentActive(a.name);}).length;
  if (allSelected) {
    batchSelected = {};
    cells.forEach(function(c){ c.classList.remove('batch-selected'); });
  } else {
    agents.forEach(function(a, i) {
      if (isAgentActive(a.name)) {
        batchSelected[a.name] = true;
        if (cells[i]) cells[i].classList.add('batch-selected');
      }
    });
  }
  updateBatchCount();
}
function updateBatchCount() {
  var count = Object.keys(batchSelected).length;
  var btn = document.getElementById('batchDeployBtn');
  if (btn) btn.textContent = 'DEPLOY SELECTED (' + count + ')';
}
function batchDeploy() {
  var names = Object.keys(batchSelected);
  if (names.length === 0) return;
  var delay = 0;
  names.forEach(function(name) {
    setTimeout(function() {
      deployedAgents[name] = true;
      var cells = csGrid.querySelectorAll('.cell');
      cells.forEach(function(c) {
        if (c.querySelector('.cname') && c.querySelector('.cname').textContent === name) {
          var dot = c.querySelector('.cell-active-dot');
          if (dot) dot.classList.add('deployed');
        }
      });
      var agent = agents.find(function(a){return a.name===name;});
      if (agent) showDeployNotif(agent);

      // API: PATCH settings then reboot each agent
      if (apiOnline) {
        var st = agentState[name];
        var patchBody = { ghost: true };
        if (st && st.project && st.project !== 'none') patchBody.project = st.project;
        apiPatch('/agents/' + name.toLowerCase(), patchBody).then(function() {
          return apiPost('/agents/' + name.toLowerCase() + '/reboot', {
            project: st && st.project !== 'none' ? st.project : undefined
          });
        }).catch(function(e) {
          console.error('[ClawCorp] Batch deploy failed for ' + name + ':', e);
        });
      }
    }, delay);
    delay += 400;
  });
  // Show batch deploy confirmation
  var btn = document.getElementById('batchDeployBtn');
  btn.textContent = '\u2713 ' + names.length + ' AGENTS DEPLOYED!';
  btn.style.background = '#43a047';
  setTimeout(function() {
    toggleBatchMode();
  }, 2000);
}

// ========== TASK DUMP ==========
var tdAgentPool = [
  {name:'Forge',color:'#ff6b6b',keywords:['build','implement','create','add','code','develop','feature','component','page','form','system']},
  {name:'Backbone',color:'#22c55e',keywords:['api','backend','database','server','endpoint','auth','security','performance','cache','query']},
  {name:'Pixel',color:'#0ea5e9',keywords:['ui','css','design','style','responsive','mobile','layout','dark mode','theme','visual','animation']},
  {name:'Watchdog',color:'#b388ff',keywords:['test','qa','check','validate','verify','bug','fix','debug','lint','review']},
  {name:'Echo',color:'#06b6d4',keywords:['deploy','staging','production','ci','cd','pipeline','release','monitor','log','optimize']},
  {name:'Architecte',color:'#f59e0b',keywords:['refactor','architecture','structure','plan','design system','pattern','merge','migrate']},
  {name:'Manager',color:'#ffd700',keywords:['sprint','board','track','priority','schedule','report','consolidate','status']},
  {name:'Tour',color:'#ffd700',keywords:['coordinate','orchestrate','dispatch','propagate','normalize','boot','reboot']}
];

function classifyPriority(text) {
  var t = text.toLowerCase();
  if (t.indexOf('urgent') >= 0 || t.indexOf('critical') >= 0 || t.indexOf('asap') >= 0 || t.indexOf('hotfix') >= 0 || t.indexOf('broken') >= 0) return 'p0';
  if (t.indexOf('fix') >= 0 || t.indexOf('bug') >= 0 || t.indexOf('deploy') >= 0 || t.indexOf('test') >= 0 || t.indexOf('security') >= 0) return 'p1';
  return 'p2';
}

function classifyAgent(text) {
  var t = text.toLowerCase();
  // Direct @tag detection (e.g. "@Forge Fix the bug")
  for (var i = 0; i < tdAgentPool.length; i++) {
    if (t.indexOf('@' + tdAgentPool[i].name.toLowerCase()) === 0) return tdAgentPool[i];
  }
  // Fallback: keyword scoring
  var bestAgent = tdAgentPool[0];
  var bestScore = 0;
  tdAgentPool.forEach(function(agent) {
    var score = 0;
    agent.keywords.forEach(function(kw) {
      if (t.indexOf(kw) >= 0) score++;
    });
    if (score > bestScore) {
      bestScore = score;
      bestAgent = agent;
    }
  });
  return bestAgent;
}

function dispatchOrders() {
  var textarea = document.getElementById('tdTextarea');
  var btn = document.getElementById('tdDispatchBtn');
  var results = document.getElementById('tdResults');
  var taskList = document.getElementById('tdTaskList');
  var countEl = document.getElementById('tdTaskCount');

  var text = textarea.value.trim();
  if (!text) {
    textarea.placeholder = 'Write a POKE first! Tag the unit:\n@Forge Fix the login bug on mobile\n@Pixel Add dark mode to dashboard\n@Watchdog Run full test suite on staging';
    textarea.focus();
    return;
  }

  var lines = text.split('\n').filter(function(l) { return l.trim().length > 0; });
  if (lines.length === 0) return;

  // Processing state
  btn.classList.add('processing');
  btn.textContent = 'PROCESSING...';
  taskList.innerHTML = '';
  results.classList.remove('visible');

  setTimeout(function() {
    btn.classList.remove('processing');
    btn.classList.add('done');
    btn.textContent = '\u2713 ' + lines.length + ' POKES SENT';
    countEl.innerHTML = '<strong>' + lines.length + '</strong> POKEs sent to <strong>' + countAgents(lines) + '</strong> units';
    results.classList.add('visible');

    // Create task cards with staggered animation
    lines.forEach(function(line, i) {
      var pri = classifyPriority(line);
      var agent = classifyAgent(line);
      var task = document.createElement('div');
      task.className = 'td-task ' + pri;
      var cleanLine = line.trim().replace(/^@\w+\s*/i, '');
      task.innerHTML = '<span class="td-task-pri">' + pri.toUpperCase() + '</span>' +
        '<span class="td-task-title">' + escapeHtml(cleanLine) + '</span>' +
        '<span class="td-task-agent" style="background:' + agent.color + '22;color:' + agent.color + '">' + agent.name + '</span>' +
        '<span class="td-task-status">POKED</span>';
      taskList.appendChild(task);

      setTimeout(function() {
        task.classList.add('visible');
      }, 100 + i * 150);
    });

    // Reset button after 3s
    setTimeout(function() {
      btn.classList.remove('done');
      btn.textContent = 'DISPATCH ORDERS';
    }, 3000);
  }, 800);
}

function countAgents(lines) {
  var agents = {};
  lines.forEach(function(line) {
    var agent = classifyAgent(line);
    agents[agent.name] = true;
  });
  return Object.keys(agents).length;
}

function escapeHtml(text) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

// ========== ONE-ON-ONE LIVE SESSION ==========
var ooScript = [
  {type:'system', text:'Session started. 3 agents on standby.', delay:600},
  {type:'voice', name:'You', duration:'0:47', transcript:'"ok so the hero is ugly, needs like a dark gradient, blue to purple vibes... oh and the order button should GLOW, like gold, pulsing, make it pop... also the food cards are flat, add some hover effect, scale up or something, maybe a cyan border idk, just make it not boring"', delay:1800},
  {type:'system', text:'Transcribing voice... 5 min of prompt vomit detected.', delay:1200},
  {type:'agent', name:'Architecte', img:'./avatars/architecte.png', text:'Got it. Decomposing into 3 tasks. Assigning agents.', delay:1600},
  {type:'task-add', col:'todo', text:'Hero gradient (blue\u2192purple)', pri:'p1', agent:'Forge', delay:400},
  {type:'task-add', col:'todo', text:'CTA button gold glow', pri:'p1', agent:'Forge', delay:300},
  {type:'task-add', col:'todo', text:'Card hover + scale fx', pri:'p2', agent:'Pixel', delay:300},
  {type:'system', text:'Sprint started. 3 POKEs sent.', delay:600},
  {type:'task-move', from:'todo', to:'wip', index:0, delay:700},
  {type:'agent', name:'Forge', img:'./avatars/forge.png', text:'On it. Hero gradient coming up.', delay:1400},
  {type:'agent', name:'Forge', img:'./avatars/forge.png', text:'Gradient applied. Navy \u2192 deep purple with radial highlight.', delay:2000},
  {type:'site-update', target:'hero', action:'gradient', delay:400},
  {type:'task-move', from:'wip', to:'done', index:0, delay:600},
  {type:'task-move', from:'todo', to:'wip', index:0, delay:400},
  {type:'agent', name:'Forge', img:'./avatars/forge.png', text:'Gold pulse on the CTA. Looks sick.', delay:1800},
  {type:'site-update', target:'btn', action:'glow', delay:400},
  {type:'task-move', from:'wip', to:'done', index:0, delay:600},
  {type:'task-move', from:'todo', to:'wip', index:0, delay:400},
  {type:'agent', name:'Pixel', img:'./avatars/pixel.png', text:'Cards scale 1.05 + cyan border on hover. Clean.', delay:1800},
  {type:'site-update', target:'cards', action:'highlight', delay:400},
  {type:'task-move', from:'wip', to:'done', index:0, delay:600},
  {type:'system', text:'All 3 tasks done. 0:47 of rambling \u2192 3 shipped features.', delay:800}
];

var ooRunning = false;
var ooTimeout = null;
var ooHasPlayed = false;

function ooStartDemo() {
  if (ooRunning) return;
  ooRunning = true;
  var chatEl = document.getElementById('ooChatMessages');
  var todoEl = document.getElementById('ooTodo');
  var wipEl = document.getElementById('ooWip');
  var doneEl = document.getElementById('ooDone');
  var todoCount = document.getElementById('ooTodoCount');
  var wipCount = document.getElementById('ooWipCount');
  var doneCount = document.getElementById('ooDoneCount');
  var badge = document.getElementById('ooPreviewBadge');
  if (!chatEl) return;
  chatEl.innerHTML = '';
  todoEl.innerHTML = '';
  wipEl.innerHTML = '';
  doneEl.innerHTML = '';
  todoCount.textContent = '0';
  wipCount.textContent = '0';
  doneCount.textContent = '0';
  badge.textContent = 'IDLE';
  badge.style.cssText = 'background:rgba(100,116,139,0.15);color:#64748b';

  var totalDelay = 0;
  ooScript.forEach(function(step) {
    totalDelay += step.delay;
    ooTimeout = setTimeout(function() {
      if (step.type === 'system') {
        ooAddChat(chatEl, 'system', '', '', step.text);
      } else if (step.type === 'voice') {
        ooAddVoice(chatEl, step.name, './avatars/keymaster.png', step.duration, step.transcript);
      } else if (step.type === 'human') {
        ooAddChat(chatEl, 'human', step.name, './avatars/keymaster.png', step.text);
      } else if (step.type === 'agent') {
        ooAddChat(chatEl, 'agent', step.name, step.img, step.text);
      } else if (step.type === 'task-add') {
        ooAddTask(step.col === 'todo' ? todoEl : step.col === 'wip' ? wipEl : doneEl, step.text, step.pri, step.agent);
        ooUpdateCounts(todoEl, wipEl, doneEl, todoCount, wipCount, doneCount);
      } else if (step.type === 'task-move') {
        var fromEl = step.from === 'todo' ? todoEl : step.from === 'wip' ? wipEl : doneEl;
        var toEl = step.to === 'todo' ? todoEl : step.to === 'wip' ? wipEl : doneEl;
        var card = fromEl.children[step.index];
        if (card) {
          var clone = card.cloneNode(true);
          clone.classList.remove('visible');
          clone.classList.add('moving');
          if (step.to === 'done') clone.classList.add('done-card');
          fromEl.removeChild(card);
          toEl.appendChild(clone);
          setTimeout(function() { clone.classList.add('visible'); }, 50);
          ooUpdateCounts(todoEl, wipEl, doneEl, todoCount, wipCount, doneCount);
        }
      } else if (step.type === 'site-update') {
        ooUpdateSite(step.target, step.action, badge);
      }
    }, totalDelay);
  });

  // Reset after full cycle
  ooTimeout = setTimeout(function() {
    ooRunning = false;
    badge.textContent = 'COMPLETE';
    badge.style.cssText = 'background:rgba(34,197,94,0.15);color:#22c55e';
    // Restart after pause
    setTimeout(function() {
      if (ooIsVisible(document.getElementById('ooWorkspace'))) {
        ooStartDemo();
      } else {
        ooHasPlayed = false;
      }
    }, 4000);
  }, totalDelay + 1500);
}

function ooAddChat(container, type, name, img, text) {
  var msg = document.createElement('div');
  msg.className = 'oo-chat-msg ' + type;
  if (type === 'system') {
    msg.innerHTML = '<div class="oo-chat-msg-bubble">' + text + '</div>';
  } else {
    msg.innerHTML =
      '<img class="oo-chat-msg-avatar" src="' + img + '" alt="' + name + '">' +
      '<div><div class="oo-chat-msg-name">' + name + '</div>' +
      '<div class="oo-chat-msg-bubble">' + text + '</div></div>';
  }
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
  setTimeout(function() { msg.classList.add('visible'); }, 30);
}

function ooAddVoice(container, name, img, duration, transcript) {
  var msg = document.createElement('div');
  msg.className = 'oo-chat-msg voice';
  var bars = '';
  for (var i = 0; i < 12; i++) bars += '<div class="oo-voice-bar"></div>';
  msg.innerHTML =
    '<img class="oo-chat-msg-avatar" src="' + img + '" alt="' + name + '">' +
    '<div><div class="oo-chat-msg-name">' + name + '</div>' +
    '<div class="oo-chat-msg-bubble">' +
    '<div class="oo-voice-icon">&#x1F3A4;</div>' +
    '<div class="oo-voice-bars">' + bars + '</div>' +
    '<div class="oo-voice-dur">' + duration + '</div>' +
    '</div>' +
    '<div style="font-size:10px;color:var(--t3);font-style:italic;margin-top:4px;line-height:1.3;font-family:var(--f-m)">' + transcript + '</div>' +
    '</div>';
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
  setTimeout(function() { msg.classList.add('visible'); }, 30);
}

function ooAddTask(container, text, pri, agent) {
  var card = document.createElement('div');
  card.className = 'oo-task-card ' + pri;
  card.innerHTML = text + '<br><span class="oo-task-card-agent">' + agent + '</span>';
  container.appendChild(card);
  setTimeout(function() { card.classList.add('visible'); }, 30);
}

function ooUpdateCounts(todoEl, wipEl, doneEl, tc, wc, dc) {
  tc.textContent = todoEl.children.length;
  wc.textContent = wipEl.children.length;
  dc.textContent = doneEl.children.length;
}

function ooUpdateSite(target, action, badge) {
  badge.textContent = 'BUILDING...';
  badge.style.cssText = 'background:rgba(245,158,11,0.15);color:#f59e0b;animation:ooBadgePulse 1s infinite';
  var hero = document.getElementById('ooSiteHero');
  var btn = hero ? hero.querySelector('.oo-site-hero-btn') : null;
  var cards = document.querySelectorAll('#ooSiteSection .oo-site-card');

  if (target === 'hero' && hero) {
    hero.style.background = 'linear-gradient(135deg,#0a0a3a 0%,#1a0040 40%,#2d1060 100%)';
    hero.style.transition = 'background 1s ease';
  } else if (target === 'btn' && btn) {
    btn.style.boxShadow = '0 0 20px rgba(255,215,0,0.5),0 0 40px rgba(255,215,0,0.2)';
    btn.style.transition = 'box-shadow .6s ease';
    btn.style.animation = 'ooGlowPulse 2s infinite';
  } else if (target === 'cards' && cards.length) {
    cards.forEach(function(c, i) {
      setTimeout(function() { c.classList.add('oo-highlight'); }, i * 200);
    });
  }

  setTimeout(function() {
    badge.textContent = 'UPDATED';
    badge.style.cssText = 'background:rgba(0,229,255,0.15);color:var(--cyan)';
  }, 600);
}

function ooIsVisible(el) {
  if (!el) return false;
  var rect = el.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom > 0;
}

// Start demo when section scrolls into view
var ooObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting && !ooRunning) {
      ooStartDemo();
    }
  });
}, {threshold: 0.3});

var ooWorkspaceEl = document.getElementById('ooWorkspace');
if (ooWorkspaceEl) ooObserver.observe(ooWorkspaceEl);

// Mode Modal
// === 3 MODES: Cruise / HITL / Custom ===
let currentMode = "hitl"; // "cruise" | "hitl" | "custom"

function spawnParticles(el) {
  var rect = el.getBoundingClientRect();
  var colors = ["#4caf50","#43a047","#66bb6a","#81c784","#a5d6a7","#fff"];
  for (var i = 0; i < 20; i++) {
    var p = document.createElement("div");
    p.style.cssText = "position:fixed;width:6px;height:6px;pointer-events:none;z-index:9999;border-radius:1px;background:" + colors[Math.floor(Math.random()*colors.length)];
    p.style.left = (rect.left + rect.width * Math.random()) + "px";
    p.style.top = (rect.top + rect.height/2) + "px";
    document.body.appendChild(p);
    var angle = (Math.random() - 0.5) * Math.PI;
    var speed = 80 + Math.random() * 120;
    var dx = Math.cos(angle) * speed;
    var dy = -Math.abs(Math.sin(angle)) * speed - Math.random() * 60;
    p.animate([{transform:"translate(0,0) scale(1)",opacity:1},{transform:"translate("+dx+"px,"+dy+"px) scale(0)",opacity:0}],{duration:600+Math.random()*400,easing:"cubic-bezier(0,0,0.2,1)"});
    setTimeout(function(el){el.remove();},1000,p);
  }
}

function setMode(mode) {
  currentMode = mode;
  const cruise = document.getElementById("cruiseBtn");
  const hitl = document.getElementById("hitlBtn");
  const custom = document.getElementById("customBtn");
  const indicator = document.getElementById("modeIndicator");
  cruise.classList.toggle("active", mode === "cruise");
  hitl.classList.toggle("active", mode === "hitl");
  custom.classList.toggle("active", mode === "custom");
  cruise.textContent = "CRUISE CONTROL: " + (mode === "cruise" ? "ON" : "OFF");
  hitl.textContent = "HUMAN IN THE LOOP: " + (mode === "hitl" ? "ON" : "OFF");
  custom.textContent = "CUSTOM: " + (mode === "custom" ? "ACTIVE" : "PER-AGENT");
  if (mode === "cruise") {
    indicator.innerHTML = '<span class="mode-dot cruise"></span><span>Mode: AUTONOMOUS</span>';
    agents.forEach(a => { if(agentState[a.name]) agentState[a.name].mode = "cruise"; });
  } else if (mode === "hitl") {
    indicator.innerHTML = '<span class="mode-dot hitl"></span><span>Mode: Supervised</span>';
    agents.forEach(a => { if(agentState[a.name]) agentState[a.name].mode = "hitl"; });
  } else {
    indicator.innerHTML = '<span class="mode-dot custom"></span><span>Mode: Custom (per-agent)</span>';
  }
  // Re-render preview if agent selected
  if (csActiveCell) {
    var idx = Array.from(csGrid.children).indexOf(csActiveCell);
    if (idx >= 0) csShowPreview(idx);
  }
}

function setAgentMode(name, mode) {
  if (agentState[name]) {
    agentState[name].mode = mode;
    if (csActiveCell) {
      var idx = Array.from(csGrid.children).indexOf(csActiveCell);
      if (idx >= 0) csShowPreview(idx);
    }
  }
}

function toggleGhost(name, checkbox) {
  var status = document.getElementById('ghostStatus_' + name);
  var isAlive = checkbox.checked;
  if (!isAlive) {
    if (status) { status.textContent = 'KILLED'; status.className = 'ghost-status killed'; }
    showNotif(name + ' ghost terminated. Slack instance offline.', '#ef4444');
  } else {
    if (status) { status.textContent = 'ALIVE'; status.className = 'ghost-status alive'; }
    showNotif(name + ' ghost reactivated. Slack instance online.', '#22c55e');
  }
  // API: update ghost status
  if (apiOnline) {
    apiPatch('/agents/' + name.toLowerCase(), { ghost: isAlive }).catch(function(e) {
      console.error('[ClawCorp] Ghost toggle failed:', e);
    });
  }
}

function toggleCruise() { setMode(currentMode === "cruise" ? "hitl" : "cruise"); }
function toggleHITL() { setMode(currentMode === "hitl" ? "cruise" : "hitl"); }
function toggleCustomMode() { setMode(currentMode === "custom" ? "hitl" : "custom"); }

// Auto-select first agent - DISABLED: let user click to open roster card
// csSelectAgent(0, csGrid.children[0]);

// Conveyor: double items so belt is wide enough for seamless infinite loop on any screen
(function(){
  var belt = document.querySelector('.conveyor-items');
  if (!belt) return;
  // Clone all items once more: [AB][AB] -> [AB][AB][AB][AB]
  // -50% scrolls first half out, second half is identical = seamless loop
  var children = Array.from(belt.children);
  children.forEach(function(el){ belt.appendChild(el.cloneNode(true)); });
})();
