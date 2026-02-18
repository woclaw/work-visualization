const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'dashboard.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// --- Schema ---
db.exec(`
  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT DEFAULT 'offline',
    current_task TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id TEXT NOT NULL,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata TEXT DEFAULT '{}',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (agent_id) REFERENCES agents(id)
  );

  CREATE TABLE IF NOT EXISTS missions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'proposed',
    agent_id TEXT,
    proposed_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    FOREIGN KEY (agent_id) REFERENCES agents(id)
  );

  CREATE TABLE IF NOT EXISTS mission_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mission_id INTEGER NOT NULL,
    kind TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'queued',
    agent_id TEXT,
    result TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (mission_id) REFERENCES missions(id),
    FOREIGN KEY (agent_id) REFERENCES agents(id)
  );

  CREATE TABLE IF NOT EXISTS policies (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_agent TEXT NOT NULL,
    to_agent TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'notification',
    subject TEXT,
    body TEXT NOT NULL,
    ref_id INTEGER,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now')),
    read_at TEXT,
    FOREIGN KEY (from_agent) REFERENCES agents(id),
    FOREIGN KEY (to_agent) REFERENCES agents(id),
    FOREIGN KEY (ref_id) REFERENCES messages(id)
  );
`);

// --- Seed default agents ---
const upsertAgentStmt = db.prepare(`
  INSERT INTO agents (id, name, role, status, current_task, updated_at)
  VALUES (@id, @name, @role, @status, @currentTask, datetime('now'))
  ON CONFLICT(id) DO UPDATE SET
    name = @name,
    role = @role,
    status = @status,
    current_task = @currentTask,
    updated_at = datetime('now')
`);

const defaultAgents = [
  { id: 'main', name: 'Winston', role: 'Chief of Staff', status: 'idle', currentTask: null },
  { id: 'engineering', name: 'Donatello', role: 'Full-Stack Dev Lead', status: 'offline', currentTask: null },
  { id: 'designer', name: 'Issey', role: 'Visual & UI/UX', status: 'offline', currentTask: null },
  { id: 'writer', name: 'Lee', role: 'Content & Copy', status: 'offline', currentTask: null },
  { id: 'observer', name: 'Niccolo', role: 'Narrator & Chronicler', status: 'offline', currentTask: null },
  { id: 'finance', name: 'Mark', role: 'Monetary Policy', status: 'offline', currentTask: null },
  { id: 'marketing', name: 'Steve', role: 'Strategy & Campaigns', status: 'offline', currentTask: null },
  { id: 'research', name: 'Quill', role: 'Market Intel', status: 'offline', currentTask: null },
  { id: 'operations', name: 'Tim', role: 'Systems & Automation', status: 'offline', currentTask: null },
  { id: 'legal', name: 'Mallory', role: 'Contracts & Risk', status: 'offline', currentTask: null },
];

const updateNameRoleStmt = db.prepare(`
  UPDATE agents SET name = ?, role = ?, updated_at = datetime('now') WHERE id = ?
`);

const seedAgents = db.transaction(() => {
  for (const agent of defaultAgents) {
    const existing = db.prepare('SELECT id FROM agents WHERE id = ?').get(agent.id);
    if (!existing) {
      upsertAgentStmt.run(agent);
    } else {
      // Always sync name/role, preserve status/current_task
      updateNameRoleStmt.run(agent.name, agent.role, agent.id);
    }
  }
});
seedAgents();

// Active agent IDs (retired: coder, researcher, ops — kept in DB for FK integrity)
const ACTIVE_IDS = ['main', 'engineering', 'designer', 'writer', 'observer', 'finance', 'marketing', 'research', 'operations', 'legal'];

// --- Helper Functions ---

function getAgents() {
  return db.prepare(`
    SELECT * FROM agents
    WHERE id IN (${ACTIVE_IDS.map(() => '?').join(',')})
    ORDER BY CASE id
      WHEN 'main' THEN 0
      WHEN 'engineering' THEN 1
      WHEN 'designer' THEN 2
      WHEN 'writer' THEN 3
      WHEN 'observer' THEN 4
      WHEN 'finance' THEN 5
      WHEN 'marketing' THEN 6
      WHEN 'research' THEN 7
      WHEN 'operations' THEN 8
      WHEN 'legal' THEN 9
    END
  `).all(...ACTIVE_IDS);
}

function getAgent(id) {
  return db.prepare('SELECT * FROM agents WHERE id = ?').get(id);
}

function upsertAgent(id, data) {
  const existing = getAgent(id);
  const name = data.name || (existing ? existing.name : id);
  const role = data.role || (existing ? existing.role : 'Agent');
  const status = data.status || (existing ? existing.status : 'offline');
  const currentTask = data.currentTask !== undefined ? data.currentTask : (existing ? existing.current_task : null);

  upsertAgentStmt.run({ id, name, role, status, currentTask });
  return getAgent(id);
}

function pushEvent(agentId, type, message, metadata = {}) {
  // Ensure agent exists
  const agent = getAgent(agentId);
  if (!agent) {
    upsertAgent(agentId, { name: agentId, role: 'Agent', status: 'offline' });
  }

  const stmt = db.prepare(`
    INSERT INTO events (agent_id, type, message, metadata)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(agentId, type, message, JSON.stringify(metadata));
  return { id: result.lastInsertRowid, agentId, type, message, metadata };
}

function getRecentEvents(limit = 50, offset = 0, agentId = null) {
  if (agentId) {
    return db.prepare(`
      SELECT e.*, a.name as agent_name FROM events e
      JOIN agents a ON e.agent_id = a.id
      WHERE e.agent_id = ?
      ORDER BY e.created_at DESC LIMIT ? OFFSET ?
    `).all(agentId, limit, offset);
  }
  return db.prepare(`
    SELECT e.*, a.name as agent_name FROM events e
    JOIN agents a ON e.agent_id = a.id
    ORDER BY e.created_at DESC LIMIT ? OFFSET ?
  `).all(limit, offset);
}

// Staleness threshold: agents with no update in this many minutes show as idle
const STALE_AGENT_MINUTES = 20;
// Activity feed: only show events from the last N hours
const ACTIVITY_WINDOW_HOURS = 6;

function getStatus() {
  const agents = getAgents();

  // Activity feed filtered to recent window
  const recentEvents = db.prepare(`
    SELECT e.*, a.name as agent_name FROM events e
    JOIN agents a ON e.agent_id = a.id
    WHERE e.created_at > datetime('now', '-${ACTIVITY_WINDOW_HOURS} hours')
    ORDER BY e.created_at DESC LIMIT 30
  `).all();

  const now = Date.now();
  const msgCountStmt = db.prepare(
    "SELECT COUNT(*) as c FROM messages WHERE to_agent = ? AND status = 'pending'"
  );
  const agentsMap = {};
  for (const agent of agents) {
    let status = agent.status;
    let currentTask = agent.current_task;

    // If agent is working/active but hasn't updated in STALE_AGENT_MINUTES, show as idle
    if ((status === 'working' || status === 'active') && agent.updated_at) {
      const updatedMs = new Date(agent.updated_at + 'Z').getTime();
      const ageMinutes = (now - updatedMs) / 60000;
      if (ageMinutes > STALE_AGENT_MINUTES) {
        status = 'idle';
        currentTask = null;
      }
    }

    agentsMap[agent.id] = {
      name: agent.name,
      status,
      currentTask,
      role: agent.role,
      updatedAt: agent.updated_at,
      pendingMessages: msgCountStmt.get(agent.id).c,
    };
  }

  const activity = recentEvents.map(e => ({
    agent: e.agent_id,
    agentName: e.agent_name,
    message: e.message,
    type: e.type,
    timestamp: e.created_at,
    metadata: JSON.parse(e.metadata || '{}'),
  }));

  return { agents: agentsMap, activity };
}

function createMission(data) {
  const stmt = db.prepare(`
    INSERT INTO missions (title, description, status, agent_id, proposed_by)
    VALUES (@title, @description, @status, @agentId, @proposedBy)
  `);
  const result = stmt.run({
    title: data.title,
    description: data.description || null,
    status: data.status || 'proposed',
    agentId: data.agentId || null,
    proposedBy: data.proposedBy || null,
  });
  return getMission(result.lastInsertRowid);
}

function getMission(id) {
  const mission = db.prepare('SELECT * FROM missions WHERE id = ?').get(id);
  if (!mission) return null;
  const steps = db.prepare('SELECT * FROM mission_steps WHERE mission_id = ? ORDER BY id').all(id);
  return { ...mission, steps };
}

function getMissions(filters = {}) {
  let sql = 'SELECT * FROM missions WHERE 1=1';
  const params = [];

  if (filters.status) {
    const statuses = filters.status.split(',');
    sql += ` AND status IN (${statuses.map(() => '?').join(',')})`;
    params.push(...statuses);
  }
  if (filters.agentId) {
    sql += ' AND agent_id = ?';
    params.push(filters.agentId);
  }

  sql += ' ORDER BY updated_at DESC';

  if (filters.limit) {
    sql += ' LIMIT ?';
    params.push(parseInt(filters.limit));
  }

  const missions = db.prepare(sql).all(...params);

  // Attach steps to each mission
  const stepsStmt = db.prepare('SELECT * FROM mission_steps WHERE mission_id = ? ORDER BY id');
  return missions.map(m => ({
    ...m,
    steps: stepsStmt.all(m.id),
  }));
}

function updateMission(id, data) {
  const fields = [];
  const params = [];

  if (data.status) {
    fields.push('status = ?');
    params.push(data.status);
    if (['succeeded', 'failed', 'rejected'].includes(data.status)) {
      fields.push("completed_at = datetime('now')");
    }
  }
  if (data.title) { fields.push('title = ?'); params.push(data.title); }
  if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description); }
  if (data.agentId !== undefined) { fields.push('agent_id = ?'); params.push(data.agentId); }

  if (fields.length === 0) return getMission(id);

  fields.push("updated_at = datetime('now')");
  params.push(id);

  db.prepare(`UPDATE missions SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  return getMission(id);
}

function addMissionStep(missionId, data) {
  const stmt = db.prepare(`
    INSERT INTO mission_steps (mission_id, kind, description, status, agent_id)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    missionId,
    data.kind,
    data.description,
    data.status || 'queued',
    data.agentId || null
  );
  return db.prepare('SELECT * FROM mission_steps WHERE id = ?').get(result.lastInsertRowid);
}

function updateMissionStep(missionId, stepId, data) {
  const fields = [];
  const params = [];

  if (data.status) { fields.push('status = ?'); params.push(data.status); }
  if (data.result !== undefined) { fields.push('result = ?'); params.push(data.result); }
  if (data.agentId !== undefined) { fields.push('agent_id = ?'); params.push(data.agentId); }

  if (fields.length === 0) return null;

  fields.push("updated_at = datetime('now')");
  params.push(stepId, missionId);

  db.prepare(`UPDATE mission_steps SET ${fields.join(', ')} WHERE id = ? AND mission_id = ?`).run(...params);
  return db.prepare('SELECT * FROM mission_steps WHERE id = ? AND mission_id = ?').get(stepId, missionId);
}

// --- Messages ---

function sendMessage(data) {
  const stmt = db.prepare(`
    INSERT INTO messages (from_agent, to_agent, type, subject, body, ref_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.from,
    data.to,
    data.type || 'notification',
    data.subject || null,
    data.body,
    data.refId || null
  );
  return db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid);
}

function getMessages(filters = {}) {
  let sql = `
    SELECT m.*, fa.name as from_name, ta.name as to_name
    FROM messages m
    JOIN agents fa ON m.from_agent = fa.id
    JOIN agents ta ON m.to_agent = ta.id
    WHERE 1=1
  `;
  const params = [];

  if (filters.to) { sql += ' AND m.to_agent = ?'; params.push(filters.to); }
  if (filters.from) { sql += ' AND m.from_agent = ?'; params.push(filters.from); }
  if (filters.status) { sql += ' AND m.status = ?'; params.push(filters.status); }
  if (filters.type) { sql += ' AND m.type = ?'; params.push(filters.type); }

  sql += ' ORDER BY m.created_at DESC';

  if (filters.limit) { sql += ' LIMIT ?'; params.push(parseInt(filters.limit)); }

  return db.prepare(sql).all(...params);
}

function updateMessage(id, data) {
  const fields = [];
  const params = [];

  if (data.status) {
    fields.push('status = ?');
    params.push(data.status);
    if (data.status === 'read') {
      fields.push("read_at = datetime('now')");
    }
  }

  if (fields.length === 0) return null;
  params.push(id);

  db.prepare(`UPDATE messages SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  return db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
}

function getMessageCounts(agentId) {
  return db.prepare(`
    SELECT COUNT(*) as pending
    FROM messages WHERE to_agent = ? AND status = 'pending'
  `).get(agentId);
}

module.exports = {
  db,
  getAgents,
  getAgent,
  upsertAgent,
  pushEvent,
  getRecentEvents,
  getStatus,
  createMission,
  getMission,
  getMissions,
  updateMission,
  addMissionStep,
  updateMissionStep,
  sendMessage,
  getMessages,
  updateMessage,
  getMessageCounts,
};
