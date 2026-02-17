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

const STEP_ICONS = {
    queued:    '\u25CB',  // ○
    running:   '\u25D4',  // ◔
    succeeded: '\u25CF',  // ●
    failed:    '\u2716',  // ✖
};

let currentAgents = {};
let currentMissions = [];

const feedEntries = document.getElementById('feedEntries');
const missionsList = document.getElementById('missionsList');
const missionsCount = document.getElementById('missionsCount');
const agentGrid = document.getElementById('agentGrid');
const agentOnlineCount = document.getElementById('agentOnlineCount');
const agentDrawer = document.getElementById('agentDrawer');
const missionDrawer = document.getElementById('missionDrawer');

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

// --- Dashboard Stats ---
function updateDashboardStats(agents, activity, missions) {
    const agentValues = Object.values(agents);
    const online = agentValues.filter(a => a.status === 'working' || a.status === 'active' || a.status === 'idle').length;
    const total = agentValues.length;
    const activeMissions = missions.filter(m => m.status === 'running' || m.status === 'approved').length;
    const totalPending = agentValues.reduce((sum, a) => sum + (a.pendingMessages || 0), 0);

    document.getElementById('statAgentsOnline').textContent = online;
    document.getElementById('statMissionsActive').textContent = activeMissions;
    document.getElementById('statEventsToday').textContent = activity.length;
    document.getElementById('statMsgPending').textContent = totalPending;

    document.getElementById('statAgentsBar').style.width = total > 0 ? `${(online / total) * 100}%` : '0%';
    document.getElementById('statMissionsBar').style.width = missions.length > 0 ? `${(activeMissions / missions.length) * 100}%` : '0%';
    document.getElementById('statEventsBar').style.width = `${Math.min(activity.length / 20 * 100, 100)}%`;
    document.getElementById('statMsgsBar').style.width = `${Math.min(totalPending / 10 * 100, 100)}%`;
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

// --- Activity Timeline ---
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
        const type = event.type || 'general';

        const highlighted = message.replace(
            /(heartbeat|inbox|tasks?|webhook|status|report|error|health|backup|deploy|tests?|API|debug|mission|working|idle|offline)/gi,
            '<span class="highlight">$1</span>'
        );

        const entry = document.createElement('div');
        entry.className = 'timeline-entry';
        entry.innerHTML = `
            <span class="timeline-node type-${type}"></span>
            <div class="timeline-header">
                <span class="timeline-type ${type}">${type.replace('_', ' ')}</span>
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
    currentMissions = missions;
    missionsCount.textContent = missions.length;
    missionsList.innerHTML = '';

    if (missions.length === 0) {
        missionsList.innerHTML = '<div class="missions-empty">No active missions</div>';
        return;
    }

    for (const mission of missions) {
        const card = document.createElement('div');
        card.className = `mission-card status-${mission.status}`;

        const steps = mission.steps || [];
        const totalSteps = steps.length;
        const doneSteps = steps.filter(s => s.status === 'succeeded').length;
        const pct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;
        const isComplete = pct === 100 && totalSteps > 0;

        const agentName = mission.agent_id && currentAgents[mission.agent_id]
            ? currentAgents[mission.agent_id].name
            : mission.agent_id || 'Unassigned';

        // Build steps preview (max 4 visible)
        let stepsHtml = '';
        if (totalSteps > 0) {
            const visibleSteps = steps.slice(0, 4);
            const stepsRows = visibleSteps.map(s => `
                <div class="step-row">
                    <span class="step-icon ${s.status}">${STEP_ICONS[s.status] || STEP_ICONS.queued}</span>
                    <span class="step-label">${escapeHtml(s.description)}</span>
                    <span class="step-kind">${s.kind}</span>
                </div>
            `).join('');
            const moreLabel = totalSteps > 4 ? `<div class="step-row"><span class="step-icon queued"></span><span class="step-label">+${totalSteps - 4} more</span></div>` : '';
            stepsHtml = `<div class="mission-steps-preview">${stepsRows}${moreLabel}</div>`;
        }

        const descHtml = mission.description
            ? `<div class="mission-description">${escapeHtml(mission.description)}</div>`
            : '';

        card.innerHTML = `
            <div class="mission-card-header">
                <div class="mission-title-row">
                    <div class="mission-title">${escapeHtml(mission.title)}</div>
                    <span class="mission-status-badge ${mission.status}">${mission.status}</span>
                </div>
                <div class="mission-meta">
                    <span class="mission-agent">${escapeHtml(agentName)}</span>
                    <span class="mission-time">${formatTimeAgo(mission.updated_at)}</span>
                </div>
            </div>
            <div class="mission-card-body">
                ${descHtml}
                ${totalSteps > 0 ? `
                    <div class="mission-progress">
                        <div class="progress-bar">
                            <div class="progress-fill${isComplete ? ' complete' : ''}" style="width:${pct}%"></div>
                        </div>
                        <span class="progress-text">${doneSteps}/${totalSteps}</span>
                    </div>
                ` : ''}
            </div>
            ${stepsHtml}
        `;

        card.addEventListener('click', () => openMissionDrawer(mission.id));
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

// --- Mission Drawer ---
async function openMissionDrawer(missionId) {
    const bodyEl = document.getElementById('missionDrawerBody');
    const titleEl = document.getElementById('missionDrawerTitle');
    bodyEl.innerHTML = '<div class="drawer-loading">Loading...</div>';
    titleEl.textContent = 'MISSION';
    missionDrawer.classList.add('open');

    try {
        const mission = await fetchJSON(`/missions/${missionId}`);
        titleEl.textContent = mission.title.length > 30 ? mission.title.slice(0, 30) + '...' : mission.title;

        const agentName = mission.agent_id && currentAgents[mission.agent_id]
            ? currentAgents[mission.agent_id].name
            : mission.agent_id || 'Unassigned';

        const steps = mission.steps || [];
        const doneSteps = steps.filter(s => s.status === 'succeeded').length;

        let stepsHtml = '';
        if (steps.length > 0) {
            stepsHtml = `
                <div class="mission-drawer-steps-title">STEPS (${doneSteps}/${steps.length})</div>
                ${steps.map(s => `
                    <div class="mission-drawer-step">
                        <span class="drawer-step-icon ${s.status}">${STEP_ICONS[s.status] || STEP_ICONS.queued}</span>
                        <div class="drawer-step-body">
                            <div class="drawer-step-desc">${escapeHtml(s.description)}</div>
                            <div class="drawer-step-meta">
                                <span>${s.kind}</span>
                                <span>${s.status}</span>
                                ${s.result ? `<span>${escapeHtml(s.result)}</span>` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            `;
        }

        bodyEl.innerHTML = `
            ${mission.description ? `<div class="mission-drawer-desc">${escapeHtml(mission.description)}</div>` : ''}
            <div class="mission-drawer-meta">
                <span><span class="meta-label">STATUS</span> <span class="meta-value"><span class="mission-status-badge ${mission.status}">${mission.status}</span></span></span>
                <span><span class="meta-label">AGENT</span> <span class="meta-value">${escapeHtml(agentName)}</span></span>
                <span><span class="meta-label">CREATED</span> <span class="meta-value">${formatTimeAgo(mission.created_at)}</span></span>
                <span><span class="meta-label">UPDATED</span> <span class="meta-value">${formatTimeAgo(mission.updated_at)}</span></span>
            </div>
            ${stepsHtml}
        `;
    } catch (err) {
        bodyEl.innerHTML = '<div class="drawer-empty">Could not load mission</div>';
    }
}

function closeMissionDrawer() {
    missionDrawer.classList.remove('open');
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
        updateDashboardStats(status.agents || {}, status.activity || [], missions);
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
    document.getElementById('missionDrawerClose').addEventListener('click', closeMissionDrawer);
    document.getElementById('missionDrawerBackdrop').addEventListener('click', closeMissionDrawer);

    poll();
    setInterval(poll, 10000);
}

document.addEventListener('DOMContentLoaded', init);
