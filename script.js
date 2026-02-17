/* ============================================
   OPENCLAW MISSION CONTROL - Script
   ============================================ */

const API_BASE = '/api';

const AGENT_CONFIG = {
    main:        { cssClass: 'winston',     label: 'Winston',   role: 'Coordinator' },
    engineering: { cssClass: 'engineering', label: 'Donatello', role: 'Dev Lead' },
    designer:    { cssClass: 'designer',    label: 'Issey',     role: 'UI/UX' },
    writer:      { cssClass: 'writer',      label: 'Lee',       role: 'Content' },
    observer:    { cssClass: 'observer',    label: 'Niccolo',   role: 'Chronicler' },
    finance:     { cssClass: 'finance',     label: 'Mark',      role: 'Finance' },
    marketing:   { cssClass: 'marketing',   label: 'Steve',     role: 'Marketing' },
    research:    { cssClass: 'research',    label: 'Quill',     role: 'Research' },
    operations:  { cssClass: 'operations',  label: 'Tim',       role: 'Operations' },
    legal:       { cssClass: 'legal',       label: 'Mallory',   role: 'Legal' },
};

let currentAgents = {};

const feedEntries = document.getElementById('feedEntries');
const missionsList = document.getElementById('missionsList');
const missionsCount = document.getElementById('missionsCount');
const agentGrid = document.getElementById('agentGrid');
const agentOnlineCount = document.getElementById('agentOnlineCount');
const agentDrawer = document.getElementById('agentDrawer');

async function fetchJSON(path) {
    const res = await fetch(API_BASE + path);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
}

function formatTime(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr + (isoStr.endsWith('Z') ? '' : 'Z'));
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// --- Clock ---
function updateClock() {
    const el = document.getElementById('headerClock');
    if (el) el.textContent = new Date().toLocaleTimeString('en-GB');
}

// --- Agent Grid ---
function buildAgentGrid(agents) {
    currentAgents = agents;
    agentGrid.innerHTML = '';

    let onlineCount = 0;
    const total = Object.keys(agents).length;

    for (const [id, agent] of Object.entries(agents)) {
        const config = AGENT_CONFIG[id] || { cssClass: id, label: agent.name, role: '' };
        const status = agent.status || 'offline';
        const isOnline = status === 'working' || status === 'active' || status === 'idle';
        if (isOnline) onlineCount++;

        const card = document.createElement('div');
        card.className = `agent-card ${config.cssClass} status-${status}`;
        card.dataset.agent = id;

        const msgBadge = agent.pendingMessages > 0
            ? `<span class="agent-msg-badge">${agent.pendingMessages}</span>`
            : '';

        const taskPreview = (status === 'working' || status === 'active') && agent.currentTask
            ? `<div class="agent-task-preview">${escapeHtml(agent.currentTask)}</div>`
            : '';

        card.innerHTML = `
            <span class="agent-dot ${status}"></span>
            <div class="agent-info">
                <div class="agent-name">${escapeHtml(agent.name || config.label)}</div>
                <div class="agent-role">${config.role}</div>
                ${taskPreview}
            </div>
            ${msgBadge}
        `;

        card.addEventListener('click', () => openAgentDrawer(id));
        agentGrid.appendChild(card);
    }

    agentOnlineCount.textContent = `${onlineCount} / ${total}`;
}

// --- Activity Feed ---
function renderFeed(events) {
    feedEntries.innerHTML = '';

    if (events.length === 0) {
        feedEntries.innerHTML = '<div class="feed-empty">No activity yet</div>';
        return;
    }

    for (const event of events) {
        const config = AGENT_CONFIG[event.agent] || AGENT_CONFIG[event.agent_id] || { cssClass: 'winston' };
        const agentName = event.agentName || event.agent_name || event.agent || 'System';
        const message = event.message || '';
        const time = formatTime(event.timestamp || event.created_at);

        const highlighted = message.replace(
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
            <div class="entry-message">${highlighted}</div>
        `;
        feedEntries.appendChild(entry);
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
        const pct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

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
                        <div class="progress-fill" style="width:${pct}%"></div>
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

    const config = AGENT_CONFIG[agentId] || { cssClass: 'winston' };

    document.getElementById('drawerAgentName').textContent = agent.name;
    document.getElementById('drawerAgentName').className = `drawer-agent-name ${config.cssClass}`;

    document.getElementById('drawerStatus').innerHTML = `
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

        const pending = messages.filter(m => m.status === 'pending');
        msgCountEl.textContent = pending.length > 0 ? pending.length : '';
        messagesEl.innerHTML = '';

        if (messages.length === 0) {
            messagesEl.innerHTML = '<div class="drawer-empty">No messages</div>';
        } else {
            for (const msg of messages) {
                const fromConfig = AGENT_CONFIG[msg.from_agent] || { cssClass: 'winston' };
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

// --- Polling ---
async function poll() {
    try {
        const [status, missions] = await Promise.all([
            fetchJSON('/status'),
            fetchJSON('/missions?status=proposed,approved,running&limit=10'),
        ]);

        if (status.agents) buildAgentGrid(status.agents);
        if (status.activity) renderFeed(status.activity);
        renderMissions(missions);
    } catch (err) {
        console.error('Poll error:', err);
    }
}

// --- Init ---
function init() {
    updateClock();
    setInterval(updateClock, 1000);

    document.getElementById('drawerClose').addEventListener('click', closeAgentDrawer);
    document.getElementById('drawerBackdrop').addEventListener('click', closeAgentDrawer);

    poll();
    setInterval(poll, 10000);
}

document.addEventListener('DOMContentLoaded', init);
