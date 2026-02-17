// ============================================
// AI Assistant Work Visualization - Script
// ============================================

(function () {
  'use strict';

  // ---- Task data (simulated work queue) ----
  const TASKS = [
    { name: 'Parse project requirements', file: 'requirements.md', status: 'completed', duration: '2.1s' },
    { name: 'Scaffold component architecture', file: 'src/components/', status: 'completed', duration: '4.3s' },
    { name: 'Implement authentication module', file: 'src/auth/login.ts', status: 'completed', duration: '12.7s' },
    { name: 'Write unit tests for auth', file: 'tests/auth.test.ts', status: 'completed', duration: '6.5s' },
    { name: 'Build REST API endpoints', file: 'src/api/routes.ts', status: 'in-progress', progress: 65 },
    { name: 'Design database schema', file: 'prisma/schema.prisma', status: 'pending' },
    { name: 'Add input validation layer', file: 'src/middleware/validate.ts', status: 'pending' },
    { name: 'Configure CI/CD pipeline', file: '.github/workflows/ci.yml', status: 'pending' },
    { name: 'Write integration tests', file: 'tests/integration/', status: 'pending' },
    { name: 'Performance optimization pass', file: 'src/', status: 'pending' },
  ];

  const THOUGHTS = [
    'Analyzing code structure...',
    'Optimizing algorithm complexity...',
    'Refactoring for clarity...',
    'Running test suite...',
    'Checking edge cases...',
    'Writing documentation...',
    'Reviewing dependencies...',
    'Validating type safety...',
    'Building module graph...',
    'Evaluating performance...',
  ];

  const ACTIVITIES = [
    'Processing',
    'Analyzing',
    'Building',
    'Testing',
    'Refactoring',
    'Optimizing',
    'Reviewing',
    'Deploying',
  ];

  const TYPING_COMMANDS = [
    'claude --task "build API endpoints"',
    'npm run test -- --coverage',
    'git commit -m "feat: add auth module"',
    'prisma migrate dev',
    'eslint src/ --fix',
    'tsc --noEmit --watch',
    'claude --review src/api/',
    'docker compose up -d',
  ];

  // ---- State ----
  let taskIndex = 0;
  let completedCount = 0;
  let linesCount = 0;
  let filesCount = 0;
  let uptimeSeconds = 0;
  let currentTasks = [];
  let cycleCount = 0;

  // ---- DOM refs ----
  const taskListEl = document.getElementById('taskList');
  const thoughtTextEl = document.getElementById('thoughtText');
  const activityLabelEl = document.getElementById('activityLabel');
  const typingTextEl = document.getElementById('typingText');
  const tasksCompletedEl = document.getElementById('tasksCompleted');
  const linesWrittenEl = document.getElementById('linesWritten');
  const filesChangedEl = document.getElementById('filesChanged');
  const uptimeEl = document.getElementById('uptime');
  const particlesEl = document.getElementById('particles');

  // ---- Initialize ----
  function init() {
    createParticles();
    renderInitialTasks();
    startThoughtCycle();
    startActivityCycle();
    startTypingAnimation();
    startTaskCycle();
    startStatsCounter();
    startUptime();
  }

  // ---- Particles ----
  function createParticles() {
    const count = 30;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.top = Math.random() * 100 + '%';
      p.style.animationDelay = Math.random() * 8 + 's';
      p.style.animationDuration = (6 + Math.random() * 6) + 's';

      // Vary colors
      const colors = ['var(--accent-light)', 'var(--cyan)', 'var(--green)', 'var(--amber)'];
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.width = (2 + Math.random() * 3) + 'px';
      p.style.height = p.style.width;

      particlesEl.appendChild(p);
    }
  }

  // ---- Render tasks ----
  function renderInitialTasks() {
    currentTasks = TASKS.slice(0, 7);
    taskListEl.innerHTML = '';
    currentTasks.forEach(function (task, i) {
      const el = createTaskElement(task, i);
      taskListEl.appendChild(el);
    });
    completedCount = currentTasks.filter(function (t) { return t.status === 'completed'; }).length;
    filesCount = completedCount;
    linesCount = completedCount * 47;
  }

  function createTaskElement(task, index) {
    var el = document.createElement('div');
    el.className = 'task-item ' + task.status;
    el.style.animationDelay = (index * 0.1) + 's';

    var icon = '';
    if (task.status === 'completed') icon = '\u2713';
    else if (task.status === 'in-progress') icon = '\u25E6';
    else icon = '\u25CB';

    var progressBar = '';
    if (task.status === 'in-progress' && task.progress) {
      progressBar = '<div class="task-progress"><div class="task-progress-fill" style="width:' + task.progress + '%"></div></div>';
    }

    var meta = '';
    if (task.duration) meta = task.duration;
    else if (task.status === 'in-progress') meta = 'running...';
    else meta = 'queued';

    el.innerHTML =
      '<div class="task-icon">' + icon + '</div>' +
      '<div class="task-content">' +
        '<span class="task-name">' + task.name + '</span>' +
        '<span class="task-meta">' + task.file + ' \u00B7 ' + meta + '</span>' +
        progressBar +
      '</div>';

    return el;
  }

  // ---- Task cycling (simulates work progressing) ----
  function startTaskCycle() {
    setInterval(function () {
      advanceTasks();
    }, 5000);
  }

  function advanceTasks() {
    // Find current in-progress task
    var inProgressIdx = -1;
    for (var i = 0; i < currentTasks.length; i++) {
      if (currentTasks[i].status === 'in-progress') {
        inProgressIdx = i;
        break;
      }
    }

    if (inProgressIdx >= 0) {
      // Complete it
      currentTasks[inProgressIdx].status = 'completed';
      currentTasks[inProgressIdx].duration = (3 + Math.random() * 15).toFixed(1) + 's';
      completedCount++;
      filesCount++;
      linesCount += Math.floor(20 + Math.random() * 80);

      // Move next pending to in-progress
      for (var j = inProgressIdx + 1; j < currentTasks.length; j++) {
        if (currentTasks[j].status === 'pending') {
          currentTasks[j].status = 'in-progress';
          currentTasks[j].progress = Math.floor(10 + Math.random() * 50);
          break;
        }
      }
    }

    // Check if all are completed — cycle the list
    var allDone = currentTasks.every(function (t) { return t.status === 'completed'; });
    if (allDone) {
      cycleCount++;
      resetTasks();
    }

    // Re-render
    taskListEl.innerHTML = '';
    currentTasks.forEach(function (task, i) {
      taskListEl.appendChild(createTaskElement(task, i));
    });
  }

  function resetTasks() {
    // Generate fresh task names for variety
    var freshTasks = [
      ['Refactor state management', 'src/store/index.ts'],
      ['Add WebSocket handlers', 'src/ws/handler.ts'],
      ['Implement caching layer', 'src/cache/redis.ts'],
      ['Update API documentation', 'docs/api.md'],
      ['Write e2e test suite', 'tests/e2e/'],
      ['Optimize bundle size', 'webpack.config.js'],
      ['Add error boundaries', 'src/components/ErrorBoundary.tsx'],
      ['Setup monitoring hooks', 'src/monitoring/index.ts'],
      ['Migrate database schema', 'prisma/migrations/'],
      ['Build deployment script', 'scripts/deploy.sh'],
      ['Implement rate limiting', 'src/middleware/rateLimit.ts'],
      ['Add search functionality', 'src/search/engine.ts'],
      ['Create admin dashboard', 'src/pages/admin/'],
      ['Setup log aggregation', 'src/logging/index.ts'],
    ];

    // Pick a random subset
    var shuffled = freshTasks.sort(function () { return 0.5 - Math.random(); });
    var selected = shuffled.slice(0, 6);

    currentTasks = selected.map(function (item, i) {
      return {
        name: item[0],
        file: item[1],
        status: i === 0 ? 'in-progress' : 'pending',
        progress: i === 0 ? Math.floor(10 + Math.random() * 30) : undefined,
      };
    });
  }

  // ---- Thought cycle ----
  function startThoughtCycle() {
    var idx = 0;
    setInterval(function () {
      idx = (idx + 1) % THOUGHTS.length;
      thoughtTextEl.style.opacity = '0';
      setTimeout(function () {
        thoughtTextEl.textContent = THOUGHTS[idx];
        thoughtTextEl.style.opacity = '1';
      }, 300);
    }, 4000);
    thoughtTextEl.style.transition = 'opacity 0.3s ease';
  }

  // ---- Activity cycle ----
  function startActivityCycle() {
    var idx = 0;
    setInterval(function () {
      idx = (idx + 1) % ACTIVITIES.length;
      activityLabelEl.textContent = ACTIVITIES[idx];
    }, 3500);
  }

  // ---- Typing animation ----
  function startTypingAnimation() {
    var cmdIdx = 0;

    function typeCommand() {
      var cmd = TYPING_COMMANDS[cmdIdx];
      var charIdx = 0;
      typingTextEl.textContent = '';

      var typeInterval = setInterval(function () {
        if (charIdx < cmd.length) {
          typingTextEl.textContent += cmd[charIdx];
          charIdx++;
        } else {
          clearInterval(typeInterval);
          // Pause, then clear and start next
          setTimeout(function () {
            typingTextEl.style.opacity = '0.5';
            setTimeout(function () {
              typingTextEl.textContent = '';
              typingTextEl.style.opacity = '1';
              cmdIdx = (cmdIdx + 1) % TYPING_COMMANDS.length;
              typeCommand();
            }, 500);
          }, 2000);
        }
      }, 60 + Math.random() * 40);
    }

    typingTextEl.style.transition = 'opacity 0.3s ease';
    typeCommand();
  }

  // ---- Stats counter ----
  function startStatsCounter() {
    setInterval(function () {
      animateValue(tasksCompletedEl, completedCount);
      animateValue(linesWrittenEl, linesCount);
      animateValue(filesChangedEl, filesCount);
    }, 1000);
  }

  function animateValue(el, target) {
    var current = parseInt(el.textContent, 10) || 0;
    if (current !== target) {
      var diff = target - current;
      var step = Math.ceil(Math.abs(diff) / 5);
      var newVal = diff > 0 ? current + step : current - step;
      // Don't overshoot
      if (diff > 0 && newVal > target) newVal = target;
      if (diff < 0 && newVal < target) newVal = target;
      el.textContent = newVal;
    }
  }

  // ---- Uptime ----
  function startUptime() {
    setInterval(function () {
      uptimeSeconds++;
      var h = String(Math.floor(uptimeSeconds / 3600)).padStart(2, '0');
      var m = String(Math.floor((uptimeSeconds % 3600) / 60)).padStart(2, '0');
      var s = String(uptimeSeconds % 60).padStart(2, '0');
      uptimeEl.textContent = h + ':' + m + ':' + s;
    }, 1000);
  }

  // ---- Boot ----
  document.addEventListener('DOMContentLoaded', init);
})();
