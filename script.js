/* ============================================
   OPENCLAW AGENT OFFICE - Script
   ============================================ */

// --- Agent Configuration ---
// To add a new agent, just push to this array.
// Set status to 'active' when the agent is deployed.
const agents = [
    {
        id: 'main',
        name: 'Winston',
        cssClass: 'winston',
        role: 'Coordinator',
        defaultStatus: 'active',
        color: '#f0c040',
    },
    {
        id: 'coder',
        name: 'Coder',
        cssClass: 'coder',
        role: 'Developer',
        defaultStatus: 'coming_soon',
        color: '#40d0e0',
    },
    {
        id: 'researcher',
        name: 'Researcher',
        cssClass: 'researcher',
        role: 'Analyst',
        defaultStatus: 'coming_soon',
        color: '#40e080',
    },
    {
        id: 'writer',
        name: 'Writer',
        cssClass: 'writer',
        role: 'Content',
        defaultStatus: 'coming_soon',
        color: '#c060f0',
    },
    {
        id: 'ops',
        name: 'Ops',
        cssClass: 'ops',
        role: 'DevOps',
        defaultStatus: 'coming_soon',
        color: '#f08040',
    }
];

// --- State ---
const EXPIRY_MS = 20 * 60 * 1000; // 20 minutes
const POLL_INTERVAL = 5000; // 5 seconds
let lastStatus = null;
let displayedEntries = new Set();

// --- Activity Feed ---
const feedEntries = document.getElementById('feedEntries');

function timeAgo(timestamp) {
    const diff = Date.now() - new Date(timestamp).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + 'm ago';
    const hours = Math.floor(minutes / 60);
    return hours + 'h ago';
}

function getAgentConfig(agentId) {
    return agents.find(a => a.id === agentId) || agents[0];
}

function renderFeedEntry(entry) {
    const agent = getAgentConfig(entry.agent);
    const el = document.createElement('div');
    el.className = 'feed-entry';
    el.dataset.timestamp = entry.timestamp;

    el.innerHTML = `
        <div class=entry-header>
            <span class=entry-agent ${agent.cssClass}>${agent.name}</span>
            <span class=entry-time>${timeAgo(entry.timestamp)}</span>
        </div>
        <div class=entry-message>${entry.message}</div>
    `;

    return el;
}

function updateFeed(activity) {
    if (!activity || !Array.isArray(activity)) return;

    const now = Date.now();

    // Filter to entries within the last 20 minutes
    const recent = activity.filter(e => {
        const age = now - new Date(e.timestamp).getTime();
        return age < EXPIRY_MS;
    });

    // Sort newest first
    recent.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Build a key set for current entries
    const currentKeys = new Set(recent.map(e => e.timestamp + e.message));

    // Only re-render if entries changed
    const prevKeys = new Set([...feedEntries.querySelectorAll('.feed-entry')].map(
        el => el.dataset.timestamp + el.querySelector('.entry-message')?.textContent
    ));

    const changed = currentKeys.size !== prevKeys.size ||
        [...currentKeys].some(k => !prevKeys.has(k));

    if (!changed) {
        // Just update the relative timestamps
        feedEntries.querySelectorAll('.feed-entry').forEach(el => {
            const ts = el.dataset.timestamp;
            if (ts) {
                el.querySelector('.entry-time').textContent = timeAgo(ts);
            }
        });
        return;
    }

    // Full re-render
    feedEntries.innerHTML = '';
    if (recent.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'feed-empty';
        empty.textContent = 'No recent activity';
        feedEntries.appendChild(empty);
    } else {
        recent.forEach(entry => {
            feedEntries.appendChild(renderFeedEntry(entry));
        });
    }
}

// --- Status Bar ---
function buildStatusBar(agentStatuses) {
    const statusBar = document.getElementById('statusBar');
    statusBar.innerHTML = '';

    agents.forEach(agent => {
        const pill = document.createElement('div');

        // Check live status from status.json
        let liveStatus = null;
        if (agentStatuses && agentStatuses[agent.id]) {
            liveStatus = agentStatuses[agent.id].status;
        }

        const isActive = liveStatus === 'working' || liveStatus === 'idle' ||
                         liveStatus === 'waiting' || agent.defaultStatus === 'active';
        const isWorking = liveStatus === 'working';
        const isWaiting = liveStatus === 'waiting';

        pill.className = `agent-pill ${agent.cssClass} ${isActive ? 'active' : ''}`;

        let statusText, statusClass;
        if (isWorking) {
            statusText = 'Working';
            statusClass = 'working-status';
        } else if (isWaiting) {
            statusText = 'Waiting';
            statusClass = 'waiting-status';
        } else if (liveStatus === 'idle') {
            statusText = 'Idle';
            statusClass = 'idle-status';
        } else if (agent.defaultStatus === 'active') {
            statusText = 'Active';
            statusClass = 'active-status';
        } else {
            statusText = 'Coming Soon';
            statusClass = 'coming-soon-status';
        }

        // Show current task for working agents
        const currentTask = agentStatuses?.[agent.id]?.currentTask;
        const taskHtml = currentTask && isWorking
            ? `<span class=pill-task>${currentTask}</span>`
            : '';

        pill.innerHTML = `
            <span class=pill-icon></span>
            <span class=pill-name>${agent.name}</span>
            <span class=pill-status ${statusClass}>${statusText}</span>
            ${taskHtml}
        `;

        statusBar.appendChild(pill);
    });
}

// --- Poll status.json ---
async function pollStatus() {
    try {
        const res = await fetch((window.location.hostname === '178.156.133.80' ? '/status.json?t=' : '/api/status?t=') + Date.now());
        if (!res.ok) throw new Error('status ' + res.status);
        const data = await res.json();
        lastStatus = data;

        updateFeed(data.activity || []);
        buildStatusBar(data.agents || {});
    } catch (err) {
        // status.json might not exist yet — show empty state
        if (!lastStatus) {
            updateFeed([]);
            buildStatusBar({});
        }
    }
}

// --- Particles ---
function createParticles() {
    const container = document.getElementById('particles');
    const count = 15;

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDuration = (8 + Math.random() * 12) + 's';
        particle.style.animationDelay = (Math.random() * 10) + 's';
        particle.style.opacity = (0.1 + Math.random() * 0.3).toString();

        const colors = [
            'rgba(240, 192, 64, 0.3)',
            'rgba(64, 208, 224, 0.2)',
            'rgba(64, 224, 128, 0.2)',
            'rgba(192, 96, 240, 0.2)',
            'rgba(240, 128, 64, 0.2)',
        ];
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];

        container.appendChild(particle);
    }
}

// --- Initialize ---
function init() {
    createParticles();

    // Initial poll
    pollStatus();

    // Poll every 5 seconds
    setInterval(pollStatus, POLL_INTERVAL);

    // Update relative timestamps every 30 seconds
    setInterval(() => {
        feedEntries.querySelectorAll('.feed-entry').forEach(el => {
            const ts = el.dataset.timestamp;
            if (ts) {
                el.querySelector('.entry-time').textContent = timeAgo(ts);
            }
        });
    }, 30000);
}

document.addEventListener('DOMContentLoaded', init);
