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
        status: 'active', // 'active' | 'inactive' | 'coming_soon'
        color: '#f0c040',
        messages: [
            'Checking system heartbeat...',
            'Reviewing inbox for new tasks...',
            'Coordinating task assignments...',
            'Scanning project repositories...',
            'Running scheduled health checks...',
            'Parsing incoming webhooks...',
            'Updating agent status board...',
            'Compiling daily summary report...',
            'Monitoring resource utilization...',
            'Syncing configuration across services...',
            'Evaluating task priority queue...',
            'Dispatching notifications...',
            'Validating API endpoint responses...',
            'Archiving completed task logs...',
            'Refreshing authentication tokens...',
            'Optimizing workflow pipelines...',
            'Checking disk usage on openclaw...',
            'Verifying backup integrity...',
            'Reviewing error logs from last hour...',
            'Polling external service endpoints...',
        ]
    },
    {
        id: 'coder',
        name: 'Coder',
        cssClass: 'coder',
        role: 'Developer',
        status: 'coming_soon',
        color: '#40d0e0',
        messages: [
            'Writing unit tests...',
            'Refactoring module structure...',
            'Reviewing pull requests...',
            'Debugging async handler...',
            'Optimizing database queries...',
        ]
    },
    {
        id: 'researcher',
        name: 'Researcher',
        cssClass: 'researcher',
        role: 'Analyst',
        status: 'coming_soon',
        color: '#40e080',
        messages: [
            'Analyzing documentation...',
            'Comparing framework options...',
            'Summarizing research findings...',
            'Crawling knowledge base...',
            'Benchmarking performance data...',
        ]
    },
    {
        id: 'writer',
        name: 'Writer',
        cssClass: 'writer',
        role: 'Content',
        status: 'coming_soon',
        color: '#c060f0',
        messages: [
            'Drafting blog post...',
            'Editing documentation...',
            'Proofreading content...',
            'Generating release notes...',
            'Writing API documentation...',
        ]
    },
    {
        id: 'ops',
        name: 'Ops',
        cssClass: 'ops',
        role: 'DevOps',
        status: 'coming_soon',
        color: '#f08040',
        messages: [
            'Deploying containers...',
            'Checking server health...',
            'Rotating SSL certificates...',
            'Scaling infrastructure...',
            'Monitoring uptime...',
        ]
    }
];

// --- Activity Feed ---
const feedEntries = document.getElementById('feedEntries');
const MAX_ENTRIES = 50;
let entryCount = 0;

function getTimestamp() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

function getRandomMessage(agent) {
    const idx = Math.floor(Math.random() * agent.messages.length);
    return agent.messages[idx];
}

function addFeedEntry(agent, message) {
    const entry = document.createElement('div');
    entry.className = 'feed-entry';

    // Highlight keywords in messages
    const highlightedMessage = message.replace(
        /(heartbeat|inbox|tasks?|webhook|status|report|error|health|backup|deploy|tests?|API|debug)/gi,
        '<span class="highlight">$1</span>'
    );

    entry.innerHTML = `
        <div class="entry-header">
            <span class="entry-agent ${agent.cssClass}">${agent.name}</span>
            <span class="entry-time">${getTimestamp()}</span>
        </div>
        <div class="entry-message">${highlightedMessage}</div>
    `;

    // Insert at top
    feedEntries.insertBefore(entry, feedEntries.firstChild);
    entryCount++;

    // Remove old entries
    while (feedEntries.children.length > MAX_ENTRIES) {
        feedEntries.removeChild(feedEntries.lastChild);
    }
}

function generateActivity() {
    // Only active agents generate entries
    const activeAgents = agents.filter(a => a.status === 'active');
    if (activeAgents.length === 0) return;

    const agent = activeAgents[Math.floor(Math.random() * activeAgents.length)];
    const message = getRandomMessage(agent);
    addFeedEntry(agent, message);
}

// Initial burst of entries
function initialFeed() {
    const winston = agents.find(a => a.id === 'main');
    const initialMessages = [
        'System initialized. All modules loaded.',
        'Agent office online. Monitoring active.',
        'Checking system heartbeat...',
        'Reviewing inbox for new tasks...',
        'Coordinating task assignments...',
    ];

    // Add them in reverse so they appear in order
    for (let i = initialMessages.length - 1; i >= 0; i--) {
        setTimeout(() => {
            addFeedEntry(winston, initialMessages[i]);
        }, (initialMessages.length - 1 - i) * 200);
    }
}

// --- Status Bar ---
function buildStatusBar() {
    const statusBar = document.getElementById('statusBar');
    statusBar.innerHTML = '';

    agents.forEach(agent => {
        const pill = document.createElement('div');
        const isActive = agent.status === 'active';
        pill.className = `agent-pill ${agent.cssClass} ${isActive ? 'active' : ''}`;

        const statusText = isActive ? 'Active' : 'Coming Soon';
        const statusClass = isActive ? 'active-status' : 'coming-soon-status';

        pill.innerHTML = `
            <span class="pill-icon"></span>
            <span class="pill-name">${agent.name}</span>
            <span class="pill-status ${statusClass}">${statusText}</span>
        `;

        statusBar.appendChild(pill);
    });
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

        // Vary particle colors slightly
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
    buildStatusBar();
    createParticles();
    initialFeed();

    // Generate activity entries on a timer (every 3-6 seconds)
    function scheduleNext() {
        const delay = 3000 + Math.random() * 3000;
        setTimeout(() => {
            generateActivity();
            scheduleNext();
        }, delay);
    }

    // Start after initial feed
    setTimeout(scheduleNext, 2000);
}

document.addEventListener('DOMContentLoaded', init);
