/* ============================================
   OPENCLAW AGENT OFFICE - Script
   ============================================ */

const API_BASE = '/api';

// --- Agent visual config (CSS classes, colors) ---
const AGENT_CONFIG = {
    main:        { cssClass: 'winston',     color: '#f0c040' },
    engineering: { cssClass: 'engineering', color: '#40d0e0' },
    designer:    { cssClass: 'designer',    color: '#e06090' },
    writer:      { cssClass: 'writer',      color: '#c060f0' },
    observer:    { cssClass: 'observer',    color: '#8090b0' },
    finance:     { cssClass: 'finance',     color: '#40e080' },
    marketing:   { cssClass: 'marketing',   color: '#f06060' },
    research:    { cssClass: 'research',    color: '#60b0f0' },
    operations:  { cssClass: 'operations',  color: '#f08040' },
    legal:       { cssClass: 'legal',       color: '#d0d060' },
};

// --- State ---
let currentAgents = {};
let missionsExpanded = true;

// --- DOM refs ---
const feedEntries = document.getElementById('feedEntries');
const missionsList = document.getElementById('missionsList');
const missionsCount = document.getElementById('missionsCount');
const missionsChevron = document.getElementById('missionsChevron');
const missionsToggle = document.getElementById('missionsToggle');
const agentDrawer = document.getElementById('agentDrawer');

// --- API helpers ---
async function fetchJSON(path) {
    const res = await fetch(API_BASE + path);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
}

// --- Timestamp formatting ---
function formatTime(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr + (isoStr.endsWith('Z') ? '' : 'Z'));
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

function formatTimeAgo(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr + (isoStr.endsWith('Z') ? '' : 'Z'));
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

// --- Activity Feed ---
function renderFeed(events) {
    feedEntries.innerHTML = '';
    for (const event of events) {
        const config = AGENT_CONFIG[event.agent] || AGENT_CONFIG[event.agent_id] || { cssClass: 'winston', color: '#f0c040' };
        const agentName = event.agentName || event.agent_name || event.agent || 'System';
        const message = event.message || '';
        const time = formatTime(event.timestamp || event.created_at);

        const highlightedMessage = message.replace(
            /(heartbeat|inbox|tasks?|webhook|status|report|error|health|backup|deploy|tests?|API|debug|mission|working|idle|offline)/gi,
            '<span class="highlight">$1</span>'
        );

        const entry = document.createElement('div');
        entry.className = 'feed-entry';
        entry.innerHTML = `
            <div class="entry-header">
                <span class="entry-agent ${config.cssClass}">${agentName}</span>
                <span class="entry-time">${time}</span>
            </div>
            <div class="entry-message">${highlightedMessage}</div>
        `;
        feedEntries.appendChild(entry);
    }

    if (events.length === 0) {
        feedEntries.innerHTML = '<div class="feed-empty">No activity yet</div>';
    }
}

// --- Agent Desk Updates ---
function updateDesks(agents) {
    currentAgents = agents;

    for (const [id, agent] of Object.entries(agents)) {
        const desk = document.querySelector(`.desk-unit[data-agent="${id}"]`);
        if (!desk) continue;

        const isActive = agent.status === 'working' || agent.status === 'active';
        const isIdle = agent.status === 'idle';
        const isOffline = agent.status === 'offline';

        // Update active/inactive classes
        desk.classList.toggle('active', isActive);
        desk.classList.toggle('inactive', isOffline);
        desk.classList.toggle('idle', isIdle);

        // Update status indicator
        const statusEl = desk.querySelector('.status-indicator');
        const comingSoon = desk.querySelector('.coming-soon-badge');

        if (isActive) {
            if (!statusEl) {
                const indicator = document.createElement('div');
                indicator.className = 'status-indicator active';
                indicator.innerHTML = '<span class="status-dot"></span> WORKING';
                if (comingSoon) comingSoon.replaceWith(indicator);
                else desk.appendChild(indicator);
            } else {
                statusEl.className = 'status-indicator active';
                statusEl.innerHTML = '<span class="status-dot"></span> WORKING';
            }
        } else if (isIdle) {
            if (statusEl) {
                statusEl.className = 'status-indicator idle';
                statusEl.innerHTML = '<span class="status-dot"></span> IDLE';
            } else if (comingSoon) {
                const indicator = document.createElement('div');
                indicator.className = 'status-indicator idle';
                indicator.innerHTML = '<span class="status-dot"></span> IDLE';
                comingSoon.replaceWith(indicator);
            }
        }
    }
}

// --- Status Bar ---
function buildStatusBar(agents) {
    const statusBar = document.getElementById('statusBar');
    statusBar.innerHTML = '';

    for (const [id, agent] of Object.entries(agents)) {
        const config = AGENT_CONFIG[id] || { cssClass: id, color: '#888' };
        const isActive = agent.status === 'working' || agent.status === 'active';
        const isIdle = agent.status === 'idle';

        const pill = document.createElement('div');
        pill.className = `agent-pill ${config.cssClass} ${isActive ? 'active' : ''}`;
        pill.dataset.agent = id;

        let statusText, statusClass;
        if (isActive) {
            statusText = 'Working';
            statusClass = 'active-status';
        } else if (isIdle) {
            statusText = 'Idle';
            statusClass = 'idle-status';
        } else {
            statusText = agent.status === 'offline' ? 'Coming Soon' : agent.status;
            statusClass = 'coming-soon-status';
        }

        const msgBadge = agent.pendingMessages > 0
            ? `<span class="pill-msg-badge">${agent.pendingMessages}</span>`
            : '';

        pill.innerHTML = `
            <span class="pill-icon"></span>
            <span class="pill-name">${agent.name}</span>
            ${msgBadge}
            <span class="pill-status ${statusClass}">${statusText}</span>
        `;

        pill.addEventListener('click', () => openAgentDrawer(id));
        statusBar.appendChild(pill);
    }
}

// --- Missions ---
function renderMissions(missions) {
    missionsCount.textContent = missions.length;
    missionsList.innerHTML = '';

    if (missions.length === 0) {
        missionsList.innerHTML = '<div class="missions-empty">No active missions</div>';
        return;
    }

    for (const mission of missions) {
        const card = document.createElement('div');
        card.className = `mission-card status-${mission.status}`;

        const totalSteps = mission.steps ? mission.steps.length : 0;
        const doneSteps = mission.steps ? mission.steps.filter(s => s.status === 'succeeded').length : 0;
        const progressPct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

        const agentName = mission.agent_id && currentAgents[mission.agent_id]
            ? currentAgents[mission.agent_id].name
            : mission.agent_id || 'Unassigned';

        card.innerHTML = `
            <div class="mission-title">${escapeHtml(mission.title)}</div>
            <div class="mission-meta">
                <span class="mission-status-badge ${mission.status}">${mission.status}</span>
                <span class="mission-agent">${escapeHtml(agentName)}</span>
                <span class="mission-time">${formatTimeAgo(mission.updated_at)}</span>
            </div>
            ${totalSteps > 0 ? `
                <div class="mission-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPct}%"></div>
                    </div>
                    <span class="progress-text">${doneSteps}/${totalSteps}</span>
                </div>
            ` : ''}
        `;

        missionsList.appendChild(card);
    }
}

// --- Agent Drawer ---
async function openAgentDrawer(agentId) {
    const agent = currentAgents[agentId];
    if (!agent) return;

    const config = AGENT_CONFIG[agentId] || { cssClass: 'winston', color: '#f0c040' };

    document.getElementById('drawerAgentName').textContent = agent.name;
    document.getElementById('drawerAgentName').className = `drawer-agent-name ${config.cssClass}`;

    const statusEl = document.getElementById('drawerStatus');
    statusEl.innerHTML = `
        <span class="drawer-status-dot ${agent.status}"></span>
        <span class="drawer-status-text">${agent.status}</span>
    `;

    const taskEl = document.getElementById('drawerTask');
    taskEl.textContent = agent.currentTask || 'No current task';
    taskEl.className = `drawer-task ${agent.currentTask ? '' : 'no-task'}`;

    const messagesEl = document.getElementById('drawerMessages');
    const msgCountEl = document.getElementById('drawerMsgCount');
    const eventsEl = document.getElementById('drawerEvents');
    messagesEl.innerHTML = '<div class="drawer-loading">Loading...</div>';
    eventsEl.innerHTML = '<div class="drawer-loading">Loading...</div>';

    agentDrawer.classList.add('open');

    try {
        const [messages, events] = await Promise.all([
            fetchJSON(`/messages?to=${agentId}&limit=20`),
            fetchJSON(`/events?agent=${agentId}&limit=20`),
        ]);

        // Render messages
        const pending = messages.filter(m => m.status === 'pending');
        msgCountEl.textContent = pending.length > 0 ? pending.length : '';
        messagesEl.innerHTML = '';

        if (messages.length === 0) {
            messagesEl.innerHTML = '<div class="drawer-empty">No messages</div>';
        } else {
            for (const msg of messages) {
                const fromConfig = AGENT_CONFIG[msg.from_agent] || { cssClass: 'winston', color: '#888' };
                const div = document.createElement('div');
                div.className = `drawer-message ${msg.status}`;
                div.innerHTML = `
                    <div class="msg-header">
                        <span class="msg-from ${fromConfig.cssClass}">${escapeHtml(msg.from_name)}</span>
                        <span class="msg-time">${formatTimeAgo(msg.created_at)}</span>
                        <span class="msg-type-badge ${msg.type}">${msg.type}</span>
                    </div>
                    ${msg.subject ? `<div class="msg-subject">${escapeHtml(msg.subject)}</div>` : ''}
                    <div class="msg-body">${escapeHtml(msg.body)}</div>
                `;
                messagesEl.appendChild(div);
            }
        }

        // Render events
        eventsEl.innerHTML = '';
        if (events.length === 0) {
            eventsEl.innerHTML = '<div class="drawer-empty">No recent events</div>';
        } else {
            for (const event of events) {
                const div = document.createElement('div');
                div.className = 'drawer-event';
                div.innerHTML = `
                    <span class="drawer-event-time">${formatTime(event.created_at)}</span>
                    <span class="drawer-event-type">${event.type}</span>
                    <span class="drawer-event-msg">${escapeHtml(event.message)}</span>
                `;
                eventsEl.appendChild(div);
            }
        }
    } catch (err) {
        messagesEl.innerHTML = '<div class="drawer-empty">Could not load messages</div>';
        eventsEl.innerHTML = '<div class="drawer-empty">Could not load events</div>';
    }
}

function closeAgentDrawer() {
    agentDrawer.classList.remove('open');
}

// --- Desk click handlers ---
function setupDeskClicks() {
    document.querySelectorAll('.desk-unit[data-agent]').forEach(desk => {
        desk.style.cursor = 'pointer';
        desk.addEventListener('click', () => {
            openAgentDrawer(desk.dataset.agent);
        });
    });
}

// --- Missions toggle ---
function setupMissionsToggle() {
    missionsToggle.addEventListener('click', () => {
        missionsExpanded = !missionsExpanded;
        missionsList.classList.toggle('collapsed', !missionsExpanded);
        missionsChevron.textContent = missionsExpanded ? '\u25BC' : '\u25B6';
    });
}

// --- Drawer close ---
function setupDrawerClose() {
    document.getElementById('drawerClose').addEventListener('click', closeAgentDrawer);
    document.getElementById('drawerBackdrop').addEventListener('click', closeAgentDrawer);
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
            'rgba(240, 192, 64, 0.3)',   // winston
            'rgba(64, 208, 224, 0.2)',    // engineering
            'rgba(224, 96, 144, 0.2)',    // designer
            'rgba(192, 96, 240, 0.2)',    // writer
            'rgba(128, 144, 176, 0.2)',   // observer
            'rgba(64, 224, 128, 0.2)',    // finance
            'rgba(240, 96, 96, 0.2)',     // marketing
            'rgba(96, 176, 240, 0.2)',    // research
            'rgba(240, 128, 64, 0.2)',    // operations
            'rgba(208, 208, 96, 0.2)',    // legal
        ];
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        container.appendChild(particle);
    }
}

// --- Utility ---
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// --- Polling ---
let pollInterval = null;

async function poll() {
    try {
        const [status, missions] = await Promise.all([
            fetchJSON('/status'),
            fetchJSON('/missions?status=proposed,approved,running&limit=10'),
        ]);

        if (status.agents) {
            updateDesks(status.agents);
            buildStatusBar(status.agents);
        }
        if (status.activity) {
            renderFeed(status.activity);
        }
        renderMissions(missions);
    } catch (err) {
        console.error('Poll error:', err);
    }
}

// --- Initialize ---
async function init() {
    createParticles();
    setupDeskClicks();
    setupMissionsToggle();
    setupDrawerClose();

    // Initial load
    await poll();

    // Poll every 10 seconds
    pollInterval = setInterval(poll, 10000);
}

document.addEventListener('DOMContentLoaded', init);
