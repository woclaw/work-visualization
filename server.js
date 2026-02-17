const express = require('express');
const path = require('path');
const {
  getStatus,
  getRecentEvents,
  getMissions,
  getMission,
  createMission,
  updateMission,
  addMissionStep,
  updateMissionStep,
  upsertAgent,
  pushEvent,
} = require('./db');

const app = express();
const PORT = 3001;

const API_KEY = process.env.DASHBOARD_API_KEY;

const ALLOWED_ORIGINS = [
  'https://openclaw-work-visual.netlify.app',
  'http://178.156.133.80:3001',
  'http://localhost:3001',
];

// --- Middleware ---

app.use(express.json());

app.use((req, res, next) => {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-cache');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Static files
app.use(express.static(path.join(__dirname), {
  index: 'index.html',
  extensions: ['html'],
}));

// Auth middleware for write endpoints
function requireAuth(req, res, next) {
  if (!API_KEY) return res.status(500).json({ error: 'API key not configured' });
  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${API_KEY}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// --- Read Endpoints (public) ---

app.get('/api/status', (req, res) => {
  try {
    res.json(getStatus());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/events', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const agent = req.query.agent || null;
    res.json(getRecentEvents(limit, offset, agent));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/missions', (req, res) => {
  try {
    res.json(getMissions({
      status: req.query.status,
      agentId: req.query.agent,
      limit: req.query.limit,
    }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/missions/:id', (req, res) => {
  try {
    const mission = getMission(parseInt(req.params.id));
    if (!mission) return res.status(404).json({ error: 'Mission not found' });
    res.json(mission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Write Endpoints (auth required) ---

app.post('/api/events', requireAuth, (req, res) => {
  try {
    const { agentId, type, message, metadata } = req.body;
    if (!agentId || !type || !message) {
      return res.status(400).json({ error: 'agentId, type, and message are required' });
    }
    const event = pushEvent(agentId, type, message, metadata || {});
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/agents/:id/status', requireAuth, (req, res) => {
  try {
    const { status, currentTask, name, role } = req.body;
    const agent = upsertAgent(req.params.id, { status, currentTask, name, role });

    // Auto-push a status change event
    if (status) {
      const msg = currentTask
        ? `Status: ${status} — ${currentTask}`
        : `Status: ${status}`;
      pushEvent(req.params.id, 'status_change', msg);
    }

    res.json(agent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/missions', requireAuth, (req, res) => {
  try {
    const { title, description, agentId, proposedBy, status } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });
    const mission = createMission({ title, description, agentId, proposedBy, status });
    res.status(201).json(mission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/missions/:id', requireAuth, (req, res) => {
  try {
    const mission = updateMission(parseInt(req.params.id), req.body);
    if (!mission) return res.status(404).json({ error: 'Mission not found' });
    res.json(mission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/missions/:id/steps', requireAuth, (req, res) => {
  try {
    const { kind, description, status: stepStatus, agentId } = req.body;
    if (!kind || !description) {
      return res.status(400).json({ error: 'kind and description are required' });
    }
    const step = addMissionStep(parseInt(req.params.id), {
      kind, description, status: stepStatus, agentId,
    });
    res.status(201).json(step);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/missions/:id/steps/:stepId', requireAuth, (req, res) => {
  try {
    const step = updateMissionStep(
      parseInt(req.params.id),
      parseInt(req.params.stepId),
      req.body
    );
    if (!step) return res.status(404).json({ error: 'Step not found' });
    res.json(step);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Backward compat: serve status.json if it exists ---
app.get('/status.json', (req, res) => {
  try {
    res.json(getStatus());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Start ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Dashboard API server running on port ${PORT}`);
});
