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

// 8x8 pixel-art portraits (1 = fill with agent color, 0 = transparent, 2 = skin, 3 = dark accent)
const PORTRAITS = {
    main: { // Winston — suit & tie coordinator
        pixels: [
            [0,0,2,2,2,2,0,0],
            [0,2,2,2,2,2,2,0],
            [0,2,3,2,2,3,2,0],
            [0,2,2,2,2,2,2,0],
            [0,0,2,1,2,2,0,0],
            [0,1,1,1,1,1,1,0],
            [1,1,3,1,1,3,1,1],
            [1,1,1,1,1,1,1,1],
        ],
        skin: '#e8c89e', accent: '#f0c040', dark: '#2a2218'
    },
    engineering: { // Donatello — headphones, hoodie
        pixels: [
            [3,0,2,2,2,2,0,3],
            [3,2,2,2,2,2,2,3],
            [0,2,3,2,2,3,2,0],
            [0,2,2,2,2,2,2,0],
            [0,0,2,2,2,2,0,0],
            [0,1,1,1,1,1,1,0],
            [1,1,1,1,1,1,1,1],
            [1,1,1,0,0,1,1,1],
        ],
        skin: '#e8c89e', accent: '#40d0e0', dark: '#1a3038'
    },
    designer: { // Issey — beret
        pixels: [
            [0,1,1,1,1,0,0,0],
            [0,1,2,2,2,2,0,0],
            [0,2,2,2,2,2,2,0],
            [0,2,3,2,2,3,2,0],
            [0,2,2,1,2,2,2,0],
            [0,0,2,2,2,2,0,0],
            [0,1,1,1,1,1,1,0],
            [1,1,1,1,1,1,1,1],
        ],
        skin: '#f0d0b0', accent: '#e06090', dark: '#3a1828'
    },
    writer: { // Lee — glasses
        pixels: [
            [0,0,2,2,2,2,0,0],
            [0,2,2,2,2,2,2,0],
            [3,3,3,2,2,3,3,3],
            [0,2,3,2,2,3,2,0],
            [0,2,2,2,2,2,2,0],
            [0,0,2,2,2,2,0,0],
            [0,1,1,1,1,1,1,0],
            [1,1,1,1,1,1,1,1],
        ],
        skin: '#d8b090', accent: '#c060f0', dark: '#28182e'
    },
    observer: { // Niccolo — hat with feather
        pixels: [
            [0,0,1,1,1,1,1,0],
            [0,1,1,2,2,2,0,0],
            [0,2,2,2,2,2,2,0],
            [0,2,3,2,2,3,2,0],
            [0,2,2,2,2,2,2,0],
            [0,0,2,2,2,2,0,0],
            [0,1,1,1,1,1,1,0],
            [1,1,1,1,1,1,1,1],
        ],
        skin: '#e0c0a0', accent: '#8090b0', dark: '#2a2a38'
    },
    finance: { // Mark — bowtie
        pixels: [
            [0,0,2,2,2,2,0,0],
            [0,2,2,2,2,2,2,0],
            [0,2,3,2,2,3,2,0],
            [0,2,2,2,2,2,2,0],
            [0,0,2,2,2,2,0,0],
            [0,1,1,3,3,1,1,0],
            [1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1],
        ],
        skin: '#e8c89e', accent: '#40e080', dark: '#183020'
    },
    marketing: { // Steve — turtleneck
        pixels: [
            [0,0,2,2,2,2,0,0],
            [0,2,2,2,2,2,2,0],
            [0,2,3,2,2,3,2,0],
            [0,2,2,2,2,2,2,0],
            [0,0,2,2,2,2,0,0],
            [0,0,1,1,1,1,0,0],
            [0,1,1,1,1,1,1,0],
            [1,1,1,1,1,1,1,1],
        ],
        skin: '#e8c89e', accent: '#f06060', dark: '#381818'
    },
    research: { // Quill — monocle
        pixels: [
            [0,0,2,2,2,2,0,0],
            [0,2,2,2,2,2,2,0],
            [0,2,3,2,3,3,3,0],
            [0,2,2,2,2,3,2,0],
            [0,2,2,2,2,2,2,0],
            [0,0,2,2,2,2,0,0],
            [0,1,1,1,1,1,1,0],
            [1,1,1,1,1,1,1,1],
        ],
        skin: '#e8c89e', accent: '#60b0f0', dark: '#182838'
    },
    operations: { // Tim — hard hat
        pixels: [
            [0,1,1,1,1,1,1,0],
            [1,1,1,1,1,1,1,1],
            [0,2,2,2,2,2,2,0],
            [0,2,3,2,2,3,2,0],
            [0,2,2,2,2,2,2,0],
            [0,0,2,2,2,2,0,0],
            [0,1,1,1,1,1,1,0],
            [1,1,1,1,1,1,1,1],
        ],
        skin: '#e8c89e', accent: '#f08040', dark: '#382818'
    },
    legal: { // Mallory — wig
        pixels: [
            [3,3,3,3,3,3,3,3],
            [3,2,2,2,2,2,2,3],
            [3,2,2,2,2,2,2,3],
            [0,2,3,2,2,3,2,0],
            [0,2,2,2,2,2,2,0],
            [0,0,2,2,2,2,0,0],
            [0,1,1,1,1,1,1,0],
            [1,1,1,1,1,1,1,1],
        ],
        skin: '#e8c89e', accent: '#d0d060', dark: '#484020'
    },
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

// --- Pixel-Art Portrait Renderer ---
function renderPortrait(agentId, size) {
    const portrait = PORTRAITS[agentId];
    if (!portrait) return null;

    const canvas = document.createElement('canvas');
    const px = size / 8;
    canvas.width = size;
    canvas.height = size;
    canvas.style.imageRendering = 'pixelated';
    const ctx = canvas.getContext('2d');

    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            const val = portrait.pixels[y][x];
            if (val === 0) continue;
            if (val === 1) ctx.fillStyle = portrait.accent;
            else if (val === 2) ctx.fillStyle = portrait.skin;
            else if (val === 3) ctx.fillStyle = portrait.dark;
            ctx.fillRect(x * px, y * px, px, px);
        }
    }
    return canvas;
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
            <div class="agent-avatar-pixel" data-agent="${id}"></div>
            <div class="agent-info">
                <div class="agent-name">${escapeHtml(agent.name || config.label)}</div>
                <div class="agent-role">${config.role}</div>
                ${taskPreview}
            </div>
            ${msgBadge}
        `;

        // Render pixel-art avatar
        const avatarEl = card.querySelector('.agent-avatar-pixel');
        const canvas = renderPortrait(id, 20);
        if (canvas) avatarEl.appendChild(canvas);

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
        const agentKey = event.agent || event.agent_id;
        const config = AGENT_CONFIG[agentKey] || { cssClass: 'winston' };
        const agentName = event.agentName || event.agent_name || event.agent || 'System';
        const message = event.message || '';
        const time = formatTime(event.timestamp || event.created_at);
        const eventType = event.type || 'system';

        const entry = document.createElement('div');

        // Thought events get special styling
        if (eventType === 'thought') {
            entry.className = 'feed-entry thought';
            entry.innerHTML = `
                <div class="entry-header">
                    <span class="entry-agent ${config.cssClass}">${agentName}</span>
                    <span class="entry-type-badge thought">thought</span>
                    <span class="entry-time">${time}</span>
                </div>
                <div class="entry-message">
                    <span class="thought-prefix">pauses to think:</span> ${escapeHtml(message)}
                </div>
            `;
        }
        // Inter-agent messages
        else if (eventType === 'message' && event.metadata && event.metadata.to) {
            const toConfig = AGENT_CONFIG[event.metadata.to] || { cssClass: 'winston' };
            const toName = toConfig.label || event.metadata.to;
            entry.className = 'feed-entry inter-agent';
            entry.innerHTML = `
                <div class="entry-header">
                    <span class="entry-agent ${config.cssClass}">${agentName}</span>
                    <span class="entry-arrow">&rarr;</span>
                    <span class="entry-recipient ${toConfig.cssClass}">${toName}</span>
                    <span class="entry-type-badge message">msg</span>
                    <span class="entry-time">${time}</span>
                </div>
                <div class="entry-message">${escapeHtml(message)}</div>
            `;
        }
        // Regular events with type badges
        else {
            const highlighted = message.replace(
                /(heartbeat|inbox|tasks?|webhook|status|report|error|health|backup|deploy|tests?|API|debug|mission|working|idle|offline)/gi,
                '<span class="highlight">$1</span>'
            );

            const badgeClass = eventType.replace(/\s+/g, '_');
            entry.className = 'feed-entry';
            entry.innerHTML = `
                <div class="entry-header">
                    <span class="entry-agent ${config.cssClass}">${agentName}</span>
                    <span class="entry-type-badge ${badgeClass}">${eventType.replace(/_/g, ' ')}</span>
                    <span class="entry-time">${time}</span>
                </div>
                <div class="entry-message">${highlighted}</div>
            `;
        }

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

    // Portrait
    const portraitEl = document.getElementById('drawerPortrait');
    portraitEl.innerHTML = '';
    const canvas = renderPortrait(agentId, 40);
    if (canvas) portraitEl.appendChild(canvas);

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

// --- Org Chart ---
function openOrgChart() {
    document.getElementById('orgChartModal').classList.add('open');
    renderOrgChart();
}

function closeOrgChart() {
    document.getElementById('orgChartModal').classList.remove('open');
}

function renderOrgChart() {
    const tree = document.getElementById('orgChartTree');
    tree.innerHTML = '';

    // Leader (Winston)
    const leaderSection = document.createElement('div');
    leaderSection.className = 'org-leader';
    leaderSection.appendChild(buildOrgCard('main'));
    tree.appendChild(leaderSection);

    // Connector line
    const connector = document.createElement('div');
    connector.className = 'org-connector';
    tree.appendChild(connector);

    // Horizontal line
    const hLine = document.createElement('div');
    hLine.className = 'org-connector-h';
    tree.appendChild(hLine);

    // Team grid
    const grid = document.createElement('div');
    grid.className = 'org-grid';

    const teamIds = Object.keys(AGENT_CONFIG).filter(id => id !== 'main');
    for (const id of teamIds) {
        grid.appendChild(buildOrgCard(id));
    }
    tree.appendChild(grid);
}

function buildOrgCard(agentId) {
    const config = AGENT_CONFIG[agentId] || { cssClass: agentId, label: agentId, role: '' };
    const agent = currentAgents[agentId];
    const status = agent ? (agent.status || 'offline') : 'offline';

    const card = document.createElement('div');
    card.className = `org-card ${status === 'offline' ? 'offline' : ''}`;

    const portraitContainer = document.createElement('div');
    portraitContainer.className = 'org-portrait';
    const canvas = renderPortrait(agentId, 32);
    if (canvas) portraitContainer.appendChild(canvas);

    card.innerHTML = `
        <div class="org-portrait" data-id="${agentId}"></div>
        <div class="org-card-info">
            <div class="org-card-name" style="color: var(--col-${config.cssClass})">${config.label}</div>
            <div class="org-card-role">${config.role}</div>
        </div>
        <span class="org-card-status ${status}">${status}</span>
    `;

    // Render portrait into the placeholder
    const portraitEl = card.querySelector('.org-portrait');
    const c = renderPortrait(agentId, 32);
    if (c) portraitEl.appendChild(c);

    card.addEventListener('click', () => {
        closeOrgChart();
        if (agent) openAgentDrawer(agentId);
    });

    return card;
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

    document.getElementById('orgChartBtn').addEventListener('click', openOrgChart);
    document.getElementById('orgChartClose').addEventListener('click', closeOrgChart);
    document.getElementById('orgChartBackdrop').addEventListener('click', closeOrgChart);

    poll();
    setInterval(poll, 10000);
}

document.addEventListener('DOMContentLoaded', init);
